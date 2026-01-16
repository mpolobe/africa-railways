package oauth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/supabase-community/supabase-go"
)

var supabaseClient *supabase.Client

func init() {
	supabaseURL := os.Getenv("SUPABASE_URL")
	supabaseKey := os.Getenv("SUPABASE_SERVICE_KEY")
	
	if supabaseURL != "" && supabaseKey != "" {
		var err error
		supabaseClient, err = supabase.NewClient(supabaseURL, supabaseKey, nil)
		if err != nil {
			fmt.Printf("Failed to initialize Supabase client: %v\n", err)
		}
	}
}

// OAuthClient represents a registered OAuth client
type OAuthClient struct {
	ID                     string   `json:"id"`
	ClientID               string   `json:"client_id"`
	ClientSecret           string   `json:"client_secret"`
	ClientType             string   `json:"client_type"`
	OperatorName           string   `json:"operator_name"`
	OperatorCountry        string   `json:"operator_country"`
	RedirectURIs           []string `json:"redirect_uris"`
	AllowedScopes          []string `json:"allowed_scopes"`
	IsActive               bool     `json:"is_active"`
	TokenExpirySeconds     int      `json:"token_expiry_seconds"`
	RefreshTokenExpiryDays int      `json:"refresh_token_expiry_days"`
}

// TokenResponse represents the OAuth token response
type TokenResponse struct {
	AccessToken  string `json:"access_token"`
	TokenType    string `json:"token_type"`
	ExpiresIn    int    `json:"expires_in"`
	RefreshToken string `json:"refresh_token,omitempty"`
	Scope        string `json:"scope"`
}

// ErrorResponse represents an OAuth error
type ErrorResponse struct {
	Error            string `json:"error"`
	ErrorDescription string `json:"error_description,omitempty"`
}

// generateToken creates a secure random token
func generateToken(length int) (string, error) {
	bytes := make([]byte, length)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return hex.EncodeToString(bytes), nil
}

// hashToken creates a SHA-256 hash of a token
func hashToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return hex.EncodeToString(hash[:])
}

// AuthorizeHandler handles the OAuth authorization endpoint
// GET /oauth/authorize
func AuthorizeHandler(w http.ResponseWriter, r *http.Request) {
	clientID := r.URL.Query().Get("client_id")
	redirectURI := r.URL.Query().Get("redirect_uri")
	scope := r.URL.Query().Get("scope")
	state := r.URL.Query().Get("state")
	responseType := r.URL.Query().Get("response_type")

	// Validate required parameters
	if clientID == "" || redirectURI == "" || responseType == "" {
		writeError(w, http.StatusBadRequest, "invalid_request", "Missing required parameters")
		return
	}

	if responseType != "code" {
		writeError(w, http.StatusBadRequest, "unsupported_response_type", "Only authorization code flow is supported")
		return
	}

	// Validate client
	client, err := getOAuthClient(clientID)
	if err != nil || client == nil || !client.IsActive {
		writeError(w, http.StatusUnauthorized, "invalid_client", "Client not found or inactive")
		return
	}

	// Validate redirect URI
	validRedirect := false
	for _, uri := range client.RedirectURIs {
		if uri == redirectURI {
			validRedirect = true
			break
		}
	}
	if !validRedirect {
		writeError(w, http.StatusBadRequest, "invalid_request", "Invalid redirect_uri")
		return
	}

	// Validate scopes
	requestedScopes := strings.Split(scope, " ")
	for _, s := range requestedScopes {
		if s == "" {
			continue
		}
		valid := false
		for _, allowed := range client.AllowedScopes {
			if s == allowed {
				valid = true
				break
			}
		}
		if !valid {
			writeError(w, http.StatusBadRequest, "invalid_scope", fmt.Sprintf("Invalid scope: %s", s))
			return
		}
	}

	// Redirect to consent page
	siteURL := os.Getenv("SITE_URL")
	if siteURL == "" {
		siteURL = "http://localhost:3000"
	}

	consentURL, _ := url.Parse(siteURL + "/oauth/consent")
	q := consentURL.Query()
	q.Set("client_id", clientID)
	q.Set("redirect_uri", redirectURI)
	q.Set("scope", scope)
	q.Set("state", state)
	consentURL.RawQuery = q.Encode()

	http.Redirect(w, r, consentURL.String(), http.StatusFound)
}

// TokenHandler handles the OAuth token endpoint
// POST /oauth/token
func TokenHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "invalid_request", "Method not allowed")
		return
	}

	var req struct {
		GrantType    string `json:"grant_type"`
		Code         string `json:"code"`
		RedirectURI  string `json:"redirect_uri"`
		ClientID     string `json:"client_id"`
		ClientSecret string `json:"client_secret"`
		RefreshToken string `json:"refresh_token"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "Invalid request body")
		return
	}

	// Validate client
	client, err := getOAuthClient(req.ClientID)
	if err != nil || client == nil {
		writeError(w, http.StatusUnauthorized, "invalid_client", "Client not found")
		return
	}

	// For confidential clients, verify secret
	if client.ClientType == "confidential" && client.ClientSecret != req.ClientSecret {
		writeError(w, http.StatusUnauthorized, "invalid_client", "Invalid client credentials")
		return
	}

	switch req.GrantType {
	case "authorization_code":
		handleAuthorizationCodeGrant(w, req.Code, req.RedirectURI, client)
	case "refresh_token":
		handleRefreshTokenGrant(w, req.RefreshToken, client)
	default:
		writeError(w, http.StatusBadRequest, "unsupported_grant_type", "Only authorization_code and refresh_token grants are supported")
	}
}

// handleAuthorizationCodeGrant exchanges an authorization code for tokens
func handleAuthorizationCodeGrant(w http.ResponseWriter, code, redirectURI string, client *OAuthClient) {
	// Get authorization code from database
	authCode, err := getAuthorizationCode(code, client.ClientID)
	if err != nil || authCode == nil {
		writeError(w, http.StatusBadRequest, "invalid_grant", "Invalid or expired authorization code")
		return
	}

	// Mark code as used
	if err := markCodeAsUsed(authCode.ID); err != nil {
		writeError(w, http.StatusInternalServerError, "server_error", "Failed to process authorization code")
		return
	}

	// Generate tokens
	accessToken, _ := generateToken(32)
	refreshToken, _ := generateToken(32)
	expiresIn := client.TokenExpirySeconds
	if expiresIn == 0 {
		expiresIn = 3600
	}

	// Store tokens
	if err := storeAccessToken(accessToken, client.ClientID, authCode.UserID, authCode.Scopes, expiresIn); err != nil {
		writeError(w, http.StatusInternalServerError, "server_error", "Failed to create access token")
		return
	}

	refreshExpiryDays := client.RefreshTokenExpiryDays
	if refreshExpiryDays == 0 {
		refreshExpiryDays = 30
	}
	if err := storeRefreshToken(refreshToken, client.ClientID, authCode.UserID, authCode.Scopes, refreshExpiryDays); err != nil {
		writeError(w, http.StatusInternalServerError, "server_error", "Failed to create refresh token")
		return
	}

	// Log event
	logOAuthEvent("token_issued", client.ClientID, authCode.UserID, map[string]interface{}{
		"grant_type": "authorization_code",
	})

	// Return tokens
	response := TokenResponse{
		AccessToken:  accessToken,
		TokenType:    "Bearer",
		ExpiresIn:    expiresIn,
		RefreshToken: refreshToken,
		Scope:        strings.Join(authCode.Scopes, " "),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// handleRefreshTokenGrant exchanges a refresh token for a new access token
func handleRefreshTokenGrant(w http.ResponseWriter, refreshToken string, client *OAuthClient) {
	// Validate refresh token
	tokenHash := hashToken(refreshToken)
	storedToken, err := getRefreshToken(tokenHash, client.ClientID)
	if err != nil || storedToken == nil {
		writeError(w, http.StatusBadRequest, "invalid_grant", "Invalid or expired refresh token")
		return
	}

	// Generate new access token
	newAccessToken, _ := generateToken(32)
	expiresIn := client.TokenExpirySeconds
	if expiresIn == 0 {
		expiresIn = 3600
	}

	// Store new access token
	if err := storeAccessToken(newAccessToken, client.ClientID, storedToken.UserID, storedToken.Scopes, expiresIn); err != nil {
		writeError(w, http.StatusInternalServerError, "server_error", "Failed to create access token")
		return
	}

	// Return new token
	response := TokenResponse{
		AccessToken: newAccessToken,
		TokenType:   "Bearer",
		ExpiresIn:   expiresIn,
		Scope:       strings.Join(storedToken.Scopes, " "),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// UserInfoHandler returns user information for a valid access token
// GET /oauth/userinfo
func UserInfoHandler(w http.ResponseWriter, r *http.Request) {
	authHeader := r.Header.Get("Authorization")
	if !strings.HasPrefix(authHeader, "Bearer ") {
		writeError(w, http.StatusUnauthorized, "invalid_token", "Missing or invalid authorization header")
		return
	}

	token := strings.TrimPrefix(authHeader, "Bearer ")
	tokenHash := hashToken(token)

	// Validate token
	accessToken, err := getAccessToken(tokenHash)
	if err != nil || accessToken == nil {
		writeError(w, http.StatusUnauthorized, "invalid_token", "Token not found or expired")
		return
	}

	// Get user info
	userInfo := map[string]interface{}{
		"sub": accessToken.UserID,
	}

	// Add claims based on scopes
	for _, scope := range accessToken.Scopes {
		switch scope {
		case "email":
			// Fetch email from auth.users
			userInfo["email"] = getUserEmail(accessToken.UserID)
		case "profile":
			// Fetch profile info
			userInfo["name"] = getUserName(accessToken.UserID)
		case "phone":
			userInfo["phone_number"] = getUserPhone(accessToken.UserID)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(userInfo)
}

// RevokeHandler revokes an access or refresh token
// POST /oauth/revoke
func RevokeHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "invalid_request", "Method not allowed")
		return
	}

	var req struct {
		Token         string `json:"token"`
		TokenTypeHint string `json:"token_type_hint"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "Invalid request body")
		return
	}

	tokenHash := hashToken(req.Token)

	// Revoke based on hint or try both
	if req.TokenTypeHint == "access_token" || req.TokenTypeHint == "" {
		revokeAccessToken(tokenHash)
	}
	if req.TokenTypeHint == "refresh_token" || req.TokenTypeHint == "" {
		revokeRefreshToken(tokenHash)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

// ApproveHandler handles user approval of authorization request
// POST /oauth/approve
func ApproveHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "invalid_request", "Method not allowed")
		return
	}

	var req struct {
		ClientID    string `json:"client_id"`
		RedirectURI string `json:"redirect_uri"`
		Scope       string `json:"scope"`
		State       string `json:"state"`
		UserID      string `json:"user_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "Invalid request body")
		return
	}

	// Generate authorization code
	code, _ := generateToken(32)
	scopes := strings.Split(req.Scope, " ")

	// Store authorization code
	if err := storeAuthorizationCode(code, req.ClientID, req.UserID, req.RedirectURI, scopes, req.State); err != nil {
		writeError(w, http.StatusInternalServerError, "server_error", "Failed to create authorization code")
		return
	}

	// Record consent
	recordConsent(req.UserID, req.ClientID, scopes)

	// Log event
	logOAuthEvent("authorization_approved", req.ClientID, req.UserID, map[string]interface{}{
		"scopes": scopes,
	})

	// Build redirect URL
	redirectURL, _ := url.Parse(req.RedirectURI)
	q := redirectURL.Query()
	q.Set("code", code)
	if req.State != "" {
		q.Set("state", req.State)
	}
	redirectURL.RawQuery = q.Encode()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"redirect_to": redirectURL.String(),
	})
}

// DenyHandler handles user denial of authorization request
// POST /oauth/deny
func DenyHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		writeError(w, http.StatusMethodNotAllowed, "invalid_request", "Method not allowed")
		return
	}

	var req struct {
		ClientID    string `json:"client_id"`
		RedirectURI string `json:"redirect_uri"`
		State       string `json:"state"`
		UserID      string `json:"user_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid_request", "Invalid request body")
		return
	}

	// Log event
	logOAuthEvent("authorization_denied", req.ClientID, req.UserID, nil)

	// Build redirect URL with error
	redirectURL, _ := url.Parse(req.RedirectURI)
	q := redirectURL.Query()
	q.Set("error", "access_denied")
	q.Set("error_description", "User denied the authorization request")
	if req.State != "" {
		q.Set("state", req.State)
	}
	redirectURL.RawQuery = q.Encode()

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"redirect_to": redirectURL.String(),
	})
}

// writeError writes an OAuth error response
func writeError(w http.ResponseWriter, status int, errorCode, description string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(ErrorResponse{
		Error:            errorCode,
		ErrorDescription: description,
	})
}

// Database helper functions (implement with your database)

type AuthorizationCode struct {
	ID          string
	Code        string
	ClientID    string
	UserID      string
	RedirectURI string
	Scopes      []string
	State       string
	ExpiresAt   time.Time
}

type StoredToken struct {
	ID        string
	TokenHash string
	ClientID  string
	UserID    string
	Scopes    []string
	ExpiresAt time.Time
}

func getOAuthClient(clientID string) (*OAuthClient, error) {
	// TODO: Implement database query
	return nil, nil
}

func getAuthorizationCode(code, clientID string) (*AuthorizationCode, error) {
	// TODO: Implement database query
	return nil, nil
}

func markCodeAsUsed(codeID string) error {
	// TODO: Implement database update
	return nil
}

func storeAccessToken(token, clientID, userID string, scopes []string, expiresIn int) error {
	// TODO: Implement database insert
	return nil
}

func storeRefreshToken(token, clientID, userID string, scopes []string, expiryDays int) error {
	// TODO: Implement database insert
	return nil
}

func getAccessToken(tokenHash string) (*StoredToken, error) {
	// TODO: Implement database query
	return nil, nil
}

func getRefreshToken(tokenHash, clientID string) (*StoredToken, error) {
	// TODO: Implement database query
	return nil, nil
}

func revokeAccessToken(tokenHash string) error {
	// TODO: Implement database update
	return nil
}

func revokeRefreshToken(tokenHash string) error {
	// TODO: Implement database update
	return nil
}

func storeAuthorizationCode(code, clientID, userID, redirectURI string, scopes []string, state string) error {
	// TODO: Implement database insert
	return nil
}

func recordConsent(userID, clientID string, scopes []string) error {
	// TODO: Implement database upsert
	return nil
}

func logOAuthEvent(eventType, clientID, userID string, details map[string]interface{}) {
	// TODO: Implement audit logging
}

func getUserEmail(userID string) string {
	// TODO: Implement user lookup
	return ""
}

func getUserName(userID string) string {
	// TODO: Implement user lookup
	return ""
}

func getUserPhone(userID string) string {
	// TODO: Implement user lookup
	return ""
}

package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	_ "github.com/lib/pq"
)

// NewsfeedPost represents a post in the newsfeed
type NewsfeedPost struct {
	ID            string    `json:"id"`
	AuthorID      string    `json:"author_id"`
	AuthorType    string    `json:"author_type"`
	AuthorName    string    `json:"author_name"`
	AuthorAvatar  string    `json:"author_avatar,omitempty"`
	Content       string    `json:"content"`
	MediaURLs     []string  `json:"media_urls,omitempty"`
	Visibility    string    `json:"visibility"`
	LikesCount    int       `json:"likes_count"`
	CommentsCount int       `json:"comments_count"`
	IsPinned      bool      `json:"is_pinned"`
	IsLiked       bool      `json:"is_liked"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
	TimeAgo       string    `json:"time_ago"`
}

// NewsfeedComment represents a comment on a post
type NewsfeedComment struct {
	ID              string    `json:"id"`
	PostID          string    `json:"post_id"`
	AuthorID        string    `json:"author_id"`
	AuthorType      string    `json:"author_type"`
	AuthorName      string    `json:"author_name"`
	AuthorAvatar    string    `json:"author_avatar,omitempty"`
	Content         string    `json:"content"`
	ParentCommentID *string   `json:"parent_comment_id,omitempty"`
	LikesCount      int       `json:"likes_count"`
	IsLiked         bool      `json:"is_liked"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	TimeAgo         string    `json:"time_ago"`
}

// NewsfeedLike represents a like action
type NewsfeedLike struct {
	UserID     string `json:"user_id"`
	UserType   string `json:"user_type"`
	TargetType string `json:"target_type"`
	TargetID   string `json:"target_id"`
}

var db *sql.DB

// InitNewsfeedDB initializes the database connection
func InitNewsfeedDB() error {
	dbURL := getEnvOrDefault("DATABASE_URL", "")
	if dbURL == "" {
		log.Println("⚠️  DATABASE_URL not set, newsfeed will use in-memory storage")
		return nil
	}

	var err error
	db, err = sql.Open("postgres", dbURL)
	if err != nil {
		return fmt.Errorf("failed to connect to database: %w", err)
	}

	if err = db.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %w", err)
	}

	log.Println("✅ Newsfeed database connected")
	return nil
}

// getEnvOrDefault gets environment variable or returns default
func getEnvOrDefault(key, defaultValue string) string {
	value := os.Getenv(key)
	if value != "" {
		return value
	}
	return defaultValue
}

// timeAgo converts a timestamp to a human-readable "time ago" string
func timeAgo(t time.Time) string {
	duration := time.Since(t)
	
	if duration < time.Minute {
		return "just now"
	} else if duration < time.Hour {
		mins := int(duration.Minutes())
		if mins == 1 {
			return "1 minute ago"
		}
		return fmt.Sprintf("%d minutes ago", mins)
	} else if duration < 24*time.Hour {
		hours := int(duration.Hours())
		if hours == 1 {
			return "1 hour ago"
		}
		return fmt.Sprintf("%d hours ago", hours)
	} else if duration < 7*24*time.Hour {
		days := int(duration.Hours() / 24)
		if days == 1 {
			return "1 day ago"
		}
		return fmt.Sprintf("%d days ago", days)
	} else if duration < 30*24*time.Hour {
		weeks := int(duration.Hours() / 24 / 7)
		if weeks == 1 {
			return "1 week ago"
		}
		return fmt.Sprintf("%d weeks ago", weeks)
	} else {
		return t.Format("Jan 2, 2006")
	}
}

// GetNewsfeedPosts retrieves posts from the newsfeed
func GetNewsfeedPosts(userID, userType string, limit, offset int) ([]NewsfeedPost, error) {
	if db == nil {
		return getMockPosts(), nil
	}

	query := `
		SELECT 
			p.id, p.author_id, p.author_type, p.author_name, p.author_avatar,
			p.content, p.media_urls, p.visibility, p.likes_count, p.comments_count,
			p.is_pinned, p.created_at, p.updated_at,
			EXISTS(
				SELECT 1 FROM newsfeed_likes 
				WHERE user_id = $1 AND target_type = 'post' AND target_id = p.id
			) as is_liked
		FROM newsfeed_posts p
		WHERE p.is_deleted = false
			AND (p.visibility = 'all' OR 
				 (p.visibility = 'sentinels_only' AND $2 = 'sentinel') OR
				 (p.visibility = 'admins_only' AND $2 = 'admin'))
		ORDER BY p.is_pinned DESC, p.created_at DESC
		LIMIT $3 OFFSET $4
	`

	rows, err := db.Query(query, userID, userType, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var posts []NewsfeedPost
	for rows.Next() {
		var post NewsfeedPost
		var mediaURLs sql.NullString
		
		err := rows.Scan(
			&post.ID, &post.AuthorID, &post.AuthorType, &post.AuthorName, &post.AuthorAvatar,
			&post.Content, &mediaURLs, &post.Visibility, &post.LikesCount, &post.CommentsCount,
			&post.IsPinned, &post.CreatedAt, &post.UpdatedAt, &post.IsLiked,
		)
		if err != nil {
			return nil, err
		}

		if mediaURLs.Valid {
			// Parse PostgreSQL array format
			post.MediaURLs = parsePostgresArray(mediaURLs.String)
		}

		post.TimeAgo = timeAgo(post.CreatedAt)
		posts = append(posts, post)
	}

	return posts, nil
}

// CreateNewsfeedPost creates a new post
func CreateNewsfeedPost(post NewsfeedPost) (*NewsfeedPost, error) {
	if db == nil {
		return nil, fmt.Errorf("database not initialized")
	}

	query := `
		INSERT INTO newsfeed_posts (
			author_id, author_type, author_name, author_avatar,
			content, media_urls, visibility
		) VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at, updated_at
	`

	var mediaURLs interface{}
	if len(post.MediaURLs) > 0 {
		mediaURLs = "{" + strings.Join(post.MediaURLs, ",") + "}"
	}

	err := db.QueryRow(
		query,
		post.AuthorID, post.AuthorType, post.AuthorName, post.AuthorAvatar,
		post.Content, mediaURLs, post.Visibility,
	).Scan(&post.ID, &post.CreatedAt, &post.UpdatedAt)

	if err != nil {
		return nil, err
	}

	post.TimeAgo = timeAgo(post.CreatedAt)
	return &post, nil
}

// GetPostComments retrieves comments for a post
func GetPostComments(postID, userID string, limit, offset int) ([]NewsfeedComment, error) {
	if db == nil {
		return getMockComments(postID), nil
	}

	query := `
		SELECT 
			c.id, c.post_id, c.author_id, c.author_type, c.author_name, c.author_avatar,
			c.content, c.parent_comment_id, c.likes_count, c.created_at, c.updated_at,
			EXISTS(
				SELECT 1 FROM newsfeed_likes 
				WHERE user_id = $1 AND target_type = 'comment' AND target_id = c.id
			) as is_liked
		FROM newsfeed_comments c
		WHERE c.post_id = $2 AND c.is_deleted = false
		ORDER BY c.created_at ASC
		LIMIT $3 OFFSET $4
	`

	rows, err := db.Query(query, userID, postID, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var comments []NewsfeedComment
	for rows.Next() {
		var comment NewsfeedComment
		var parentID sql.NullString
		
		err := rows.Scan(
			&comment.ID, &comment.PostID, &comment.AuthorID, &comment.AuthorType,
			&comment.AuthorName, &comment.AuthorAvatar, &comment.Content,
			&parentID, &comment.LikesCount, &comment.CreatedAt, &comment.UpdatedAt,
			&comment.IsLiked,
		)
		if err != nil {
			return nil, err
		}

		if parentID.Valid {
			comment.ParentCommentID = &parentID.String
		}

		comment.TimeAgo = timeAgo(comment.CreatedAt)
		comments = append(comments, comment)
	}

	return comments, nil
}

// CreateComment creates a new comment
func CreateComment(comment NewsfeedComment) (*NewsfeedComment, error) {
	if db == nil {
		return nil, fmt.Errorf("database not initialized")
	}

	query := `
		INSERT INTO newsfeed_comments (
			post_id, author_id, author_type, author_name, author_avatar,
			content, parent_comment_id
		) VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at, updated_at
	`

	err := db.QueryRow(
		query,
		comment.PostID, comment.AuthorID, comment.AuthorType, comment.AuthorName,
		comment.AuthorAvatar, comment.Content, comment.ParentCommentID,
	).Scan(&comment.ID, &comment.CreatedAt, &comment.UpdatedAt)

	if err != nil {
		return nil, err
	}

	comment.TimeAgo = timeAgo(comment.CreatedAt)
	return &comment, nil
}

// ToggleLike toggles a like on a post or comment
func ToggleLike(like NewsfeedLike) (bool, error) {
	if db == nil {
		return true, nil
	}

	// Check if like exists
	var exists bool
	checkQuery := `
		SELECT EXISTS(
			SELECT 1 FROM newsfeed_likes 
			WHERE user_id = $1 AND target_type = $2 AND target_id = $3
		)
	`
	err := db.QueryRow(checkQuery, like.UserID, like.TargetType, like.TargetID).Scan(&exists)
	if err != nil {
		return false, err
	}

	if exists {
		// Unlike
		deleteQuery := `
			DELETE FROM newsfeed_likes 
			WHERE user_id = $1 AND target_type = $2 AND target_id = $3
		`
		_, err = db.Exec(deleteQuery, like.UserID, like.TargetType, like.TargetID)
		return false, err
	} else {
		// Like
		insertQuery := `
			INSERT INTO newsfeed_likes (user_id, user_type, target_type, target_id)
			VALUES ($1, $2, $3, $4)
		`
		_, err = db.Exec(insertQuery, like.UserID, like.UserType, like.TargetType, like.TargetID)
		return true, err
	}
}

// parsePostgresArray parses PostgreSQL array format
func parsePostgresArray(s string) []string {
	s = strings.Trim(s, "{}")
	if s == "" {
		return []string{}
	}
	return strings.Split(s, ",")
}

// HTTP Handlers

func newsfeedPostsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method == "GET" {
		// Get posts
		userID := r.URL.Query().Get("user_id")
		userType := r.URL.Query().Get("user_type")
		limitStr := r.URL.Query().Get("limit")
		offsetStr := r.URL.Query().Get("offset")

		limit := 20
		offset := 0

		if limitStr != "" {
			if l, err := strconv.Atoi(limitStr); err == nil {
				limit = l
			}
		}
		if offsetStr != "" {
			if o, err := strconv.Atoi(offsetStr); err == nil {
				offset = o
			}
		}

		posts, err := GetNewsfeedPosts(userID, userType, limit, offset)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		json.NewEncoder(w).Encode(map[string]interface{}{
			"posts": posts,
			"count": len(posts),
		})

	} else if r.Method == "POST" {
		// Create post
		var post NewsfeedPost
		if err := json.NewDecoder(r.Body).Decode(&post); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		createdPost, err := CreateNewsfeedPost(post)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(createdPost)
	} else {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func newsfeedCommentsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method == "GET" {
		// Get comments
		postID := r.URL.Query().Get("post_id")
		userID := r.URL.Query().Get("user_id")
		limitStr := r.URL.Query().Get("limit")
		offsetStr := r.URL.Query().Get("offset")

		if postID == "" {
			http.Error(w, "post_id is required", http.StatusBadRequest)
			return
		}

		limit := 50
		offset := 0

		if limitStr != "" {
			if l, err := strconv.Atoi(limitStr); err == nil {
				limit = l
			}
		}
		if offsetStr != "" {
			if o, err := strconv.Atoi(offsetStr); err == nil {
				offset = o
			}
		}

		comments, err := GetPostComments(postID, userID, limit, offset)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		json.NewEncoder(w).Encode(map[string]interface{}{
			"comments": comments,
			"count":    len(comments),
		})

	} else if r.Method == "POST" {
		// Create comment
		var comment NewsfeedComment
		if err := json.NewDecoder(r.Body).Decode(&comment); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		createdComment, err := CreateComment(comment)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(createdComment)
	} else {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func newsfeedLikeHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var like NewsfeedLike
	if err := json.NewDecoder(r.Body).Decode(&like); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	isLiked, err := ToggleLike(like)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"liked": isLiked,
	})
}

// Mock data for testing without database

func getMockPosts() []NewsfeedPost {
	now := time.Now()
	return []NewsfeedPost{
		{
			ID:            "1",
			AuthorID:      "admin-1",
			AuthorType:    "admin",
			AuthorName:    "Railway Admin",
			AuthorAvatar:  "",
			Content:       "Welcome to the Sentinel Network! We're excited to have you all on board. Please report any issues or concerns through this feed.",
			Visibility:    "all",
			LikesCount:    12,
			CommentsCount: 5,
			IsPinned:      true,
			CreatedAt:     now.Add(-2 * time.Hour),
			UpdatedAt:     now.Add(-2 * time.Hour),
			TimeAgo:       "2 hours ago",
		},
		{
			ID:            "2",
			AuthorID:      "sentinel-1",
			AuthorType:    "sentinel",
			AuthorName:    "John Mwamba",
			AuthorAvatar:  "",
			Content:       "Track maintenance completed on Lusaka-Livingstone route. All clear for operations.",
			Visibility:    "all",
			LikesCount:    8,
			CommentsCount: 2,
			CreatedAt:     now.Add(-4 * time.Hour),
			UpdatedAt:     now.Add(-4 * time.Hour),
			TimeAgo:       "4 hours ago",
		},
	}
}

func getMockComments(postID string) []NewsfeedComment {
	now := time.Now()
	return []NewsfeedComment{
		{
			ID:         "c1",
			PostID:     postID,
			AuthorID:   "sentinel-2",
			AuthorType: "sentinel",
			AuthorName: "Sarah Banda",
			Content:    "Great work team!",
			LikesCount: 3,
			CreatedAt:  now.Add(-1 * time.Hour),
			UpdatedAt:  now.Add(-1 * time.Hour),
			TimeAgo:    "1 hour ago",
		},
	}
}

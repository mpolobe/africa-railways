package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"
)

// Station represents a railway station
type Station struct {
	ID          string       `json:"id"`
	Name        string       `json:"name"`
	Type        string       `json:"type"`
	Coordinates *Coordinates `json:"coordinates,omitempty"`
	Address     string       `json:"address,omitempty"`
	Rating      *float64     `json:"rating,omitempty"`
	Source      string       `json:"source,omitempty"`
}

// Coordinates represents lat/lng
type Coordinates struct {
	Lat float64 `json:"lat"`
	Lng float64 `json:"lng"`
}

// City represents a city with stations
type City struct {
	ID       string    `json:"id"`
	Name     string    `json:"name"`
	Stations []Station `json:"stations"`
}

// Country represents a country with cities
type Country struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Cities []City `json:"cities"`
}

// StationData represents the full station dataset
type StationData struct {
	Countries []Country        `json:"countries"`
	Metadata  StationMetadata  `json:"metadata"`
}

// StationMetadata contains dataset statistics
type StationMetadata struct {
	TotalCountries int      `json:"totalCountries"`
	TotalCities    int      `json:"totalCities"`
	TotalStations  int      `json:"totalStations"`
	LastUpdated    string   `json:"lastUpdated"`
	Sources        []string `json:"sources"`
}

// FlatStation is a flattened station for search results
type FlatStation struct {
	ID          string       `json:"id"`
	Name        string       `json:"name"`
	City        string       `json:"city"`
	Country     string       `json:"country"`
	Type        string       `json:"type"`
	Coordinates *Coordinates `json:"coordinates,omitempty"`
}

// StationsCache holds the cached station data
type StationsCache struct {
	mu           sync.RWMutex
	data         *StationData
	flatStations []FlatStation
	lastLoaded   time.Time
	cacheTTL     time.Duration
}

var stationsCache = &StationsCache{
	cacheTTL: 5 * time.Minute,
}

// loadStationData loads station data from JSON file
func loadStationData() (*StationData, error) {
	// Try multiple paths
	paths := []string{
		"data/stations.json",
		"../data/stations.json",
		filepath.Join(os.Getenv("PWD"), "data/stations.json"),
	}

	var data []byte
	var err error
	var loadedPath string

	for _, path := range paths {
		data, err = os.ReadFile(path)
		if err == nil {
			loadedPath = path
			break
		}
	}

	if err != nil {
		return nil, err
	}

	var stationData StationData
	if err := json.Unmarshal(data, &stationData); err != nil {
		return nil, err
	}

	log.Printf("📍 Loaded station data from %s", loadedPath)
	return &stationData, nil
}

// getStationData returns cached or fresh station data
func getStationData() (*StationData, []FlatStation, error) {
	stationsCache.mu.RLock()
	if stationsCache.data != nil && time.Since(stationsCache.lastLoaded) < stationsCache.cacheTTL {
		data := stationsCache.data
		flat := stationsCache.flatStations
		stationsCache.mu.RUnlock()
		return data, flat, nil
	}
	stationsCache.mu.RUnlock()

	// Need to reload
	stationsCache.mu.Lock()
	defer stationsCache.mu.Unlock()

	// Double-check after acquiring write lock
	if stationsCache.data != nil && time.Since(stationsCache.lastLoaded) < stationsCache.cacheTTL {
		return stationsCache.data, stationsCache.flatStations, nil
	}

	data, err := loadStationData()
	if err != nil {
		return nil, nil, err
	}

	// Build flat station list for search
	var flatStations []FlatStation
	for _, country := range data.Countries {
		for _, city := range country.Cities {
			for _, station := range city.Stations {
				flatStations = append(flatStations, FlatStation{
					ID:          station.ID,
					Name:        station.Name,
					City:        city.Name,
					Country:     country.Name,
					Type:        station.Type,
					Coordinates: station.Coordinates,
				})
			}
		}
	}

	stationsCache.data = data
	stationsCache.flatStations = flatStations
	stationsCache.lastLoaded = time.Now()

	log.Printf("📍 Station cache refreshed: %d countries, %d stations",
		data.Metadata.TotalCountries, data.Metadata.TotalStations)

	return data, flatStations, nil
}

// stationsHandler handles /api/stations requests
func stationsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	data, _, err := getStationData()
	if err != nil {
		http.Error(w, `{"error": "Failed to load station data"}`, http.StatusInternalServerError)
		log.Printf("❌ Error loading stations: %v", err)
		return
	}

	json.NewEncoder(w).Encode(data)
}

// stationsMetadataHandler handles /api/stations/metadata
func stationsMetadataHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	data, _, err := getStationData()
	if err != nil {
		http.Error(w, `{"error": "Failed to load station data"}`, http.StatusInternalServerError)
		return
	}

	json.NewEncoder(w).Encode(data.Metadata)
}

// stationsCountriesHandler handles /api/stations/countries
func stationsCountriesHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	data, _, err := getStationData()
	if err != nil {
		http.Error(w, `{"error": "Failed to load station data"}`, http.StatusInternalServerError)
		return
	}

	// Return just country list with city counts
	type CountrySummary struct {
		ID         string `json:"id"`
		Name       string `json:"name"`
		CityCount  int    `json:"cityCount"`
		StationCount int  `json:"stationCount"`
	}

	var countries []CountrySummary
	for _, c := range data.Countries {
		stationCount := 0
		for _, city := range c.Cities {
			stationCount += len(city.Stations)
		}
		countries = append(countries, CountrySummary{
			ID:           c.ID,
			Name:         c.Name,
			CityCount:    len(c.Cities),
			StationCount: stationCount,
		})
	}

	json.NewEncoder(w).Encode(countries)
}

// stationsCitiesHandler handles /api/stations/cities?country=xxx
func stationsCitiesHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	countryID := r.URL.Query().Get("country")
	if countryID == "" {
		http.Error(w, `{"error": "country parameter required"}`, http.StatusBadRequest)
		return
	}

	data, _, err := getStationData()
	if err != nil {
		http.Error(w, `{"error": "Failed to load station data"}`, http.StatusInternalServerError)
		return
	}

	// Find country
	for _, country := range data.Countries {
		if country.ID == countryID || strings.EqualFold(country.Name, countryID) {
			type CitySummary struct {
				ID           string `json:"id"`
				Name         string `json:"name"`
				StationCount int    `json:"stationCount"`
			}

			var cities []CitySummary
			for _, city := range country.Cities {
				cities = append(cities, CitySummary{
					ID:           city.ID,
					Name:         city.Name,
					StationCount: len(city.Stations),
				})
			}

			json.NewEncoder(w).Encode(map[string]interface{}{
				"country": country.Name,
				"cities":  cities,
			})
			return
		}
	}

	http.Error(w, `{"error": "Country not found"}`, http.StatusNotFound)
}

// stationsListHandler handles /api/stations/list?country=xxx&city=xxx
func stationsListHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	countryID := r.URL.Query().Get("country")
	cityID := r.URL.Query().Get("city")

	data, _, err := getStationData()
	if err != nil {
		http.Error(w, `{"error": "Failed to load station data"}`, http.StatusInternalServerError)
		return
	}

	var result []FlatStation

	for _, country := range data.Countries {
		if countryID != "" && country.ID != countryID && !strings.EqualFold(country.Name, countryID) {
			continue
		}

		for _, city := range country.Cities {
			if cityID != "" && city.ID != cityID && !strings.EqualFold(city.Name, cityID) {
				continue
			}

			for _, station := range city.Stations {
				result = append(result, FlatStation{
					ID:          station.ID,
					Name:        station.Name,
					City:        city.Name,
					Country:     country.Name,
					Type:        station.Type,
					Coordinates: station.Coordinates,
				})
			}
		}
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"count":    len(result),
		"stations": result,
	})
}

// stationsSearchHandler handles /api/stations/search?q=xxx&limit=20
func stationsSearchHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	query := strings.ToLower(r.URL.Query().Get("q"))
	if query == "" || len(query) < 2 {
		http.Error(w, `{"error": "Query must be at least 2 characters"}`, http.StatusBadRequest)
		return
	}

	limitStr := r.URL.Query().Get("limit")
	limit := 20
	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	_, flatStations, err := getStationData()
	if err != nil {
		http.Error(w, `{"error": "Failed to load station data"}`, http.StatusInternalServerError)
		return
	}

	var results []FlatStation
	for _, station := range flatStations {
		searchText := strings.ToLower(station.Name + " " + station.City + " " + station.Country)
		if strings.Contains(searchText, query) {
			results = append(results, station)
			if len(results) >= limit {
				break
			}
		}
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"query":   query,
		"count":   len(results),
		"results": results,
	})
}

// stationByIDHandler handles /api/stations/station?id=xxx
func stationByIDHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	stationID := r.URL.Query().Get("id")
	if stationID == "" {
		http.Error(w, `{"error": "id parameter required"}`, http.StatusBadRequest)
		return
	}

	data, _, err := getStationData()
	if err != nil {
		http.Error(w, `{"error": "Failed to load station data"}`, http.StatusInternalServerError)
		return
	}

	for _, country := range data.Countries {
		for _, city := range country.Cities {
			for _, station := range city.Stations {
				if station.ID == stationID {
					json.NewEncoder(w).Encode(map[string]interface{}{
						"id":          station.ID,
						"name":        station.Name,
						"city":        city.Name,
						"country":     country.Name,
						"type":        station.Type,
						"coordinates": station.Coordinates,
					})
					return
				}
			}
		}
	}

	http.Error(w, `{"error": "Station not found"}`, http.StatusNotFound)
}

// stationsNearbyHandler handles /api/stations/nearby?lat=xxx&lng=xxx&radius=50
func stationsNearbyHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	latStr := r.URL.Query().Get("lat")
	lngStr := r.URL.Query().Get("lng")
	radiusStr := r.URL.Query().Get("radius")

	if latStr == "" || lngStr == "" {
		http.Error(w, `{"error": "lat and lng parameters required"}`, http.StatusBadRequest)
		return
	}

	lat, err := strconv.ParseFloat(latStr, 64)
	if err != nil {
		http.Error(w, `{"error": "Invalid lat parameter"}`, http.StatusBadRequest)
		return
	}

	lng, err := strconv.ParseFloat(lngStr, 64)
	if err != nil {
		http.Error(w, `{"error": "Invalid lng parameter"}`, http.StatusBadRequest)
		return
	}

	radius := 50.0 // Default 50km
	if radiusStr != "" {
		if r, err := strconv.ParseFloat(radiusStr, 64); err == nil && r > 0 && r <= 500 {
			radius = r
		}
	}

	_, flatStations, err := getStationData()
	if err != nil {
		http.Error(w, `{"error": "Failed to load station data"}`, http.StatusInternalServerError)
		return
	}

	type NearbyStation struct {
		FlatStation
		Distance float64 `json:"distance"`
	}

	var results []NearbyStation
	for _, station := range flatStations {
		if station.Coordinates == nil {
			continue
		}

		dist := haversineDistance(lat, lng, station.Coordinates.Lat, station.Coordinates.Lng)
		if dist <= radius {
			results = append(results, NearbyStation{
				FlatStation: station,
				Distance:    dist,
			})
		}
	}

	// Sort by distance (simple bubble sort for small results)
	for i := 0; i < len(results)-1; i++ {
		for j := 0; j < len(results)-i-1; j++ {
			if results[j].Distance > results[j+1].Distance {
				results[j], results[j+1] = results[j+1], results[j]
			}
		}
	}

	// Limit to 50 results
	if len(results) > 50 {
		results = results[:50]
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"lat":      lat,
		"lng":      lng,
		"radius":   radius,
		"count":    len(results),
		"stations": results,
	})
}

// haversineDistance calculates distance between two points in km
func haversineDistance(lat1, lng1, lat2, lng2 float64) float64 {
	const earthRadius = 6371.0 // km

	lat1Rad := lat1 * 3.14159265359 / 180
	lat2Rad := lat2 * 3.14159265359 / 180
	deltaLat := (lat2 - lat1) * 3.14159265359 / 180
	deltaLng := (lng2 - lng1) * 3.14159265359 / 180

	a := sin(deltaLat/2)*sin(deltaLat/2) +
		cos(lat1Rad)*cos(lat2Rad)*sin(deltaLng/2)*sin(deltaLng/2)

	c := 2 * atan2(sqrt(a), sqrt(1-a))

	return earthRadius * c
}

// Math helper functions
func sin(x float64) float64 {
	return x - x*x*x/6 + x*x*x*x*x/120 // Taylor series approximation
}

func cos(x float64) float64 {
	return 1 - x*x/2 + x*x*x*x/24
}

func sqrt(x float64) float64 {
	if x <= 0 {
		return 0
	}
	z := x
	for i := 0; i < 10; i++ {
		z = (z + x/z) / 2
	}
	return z
}

func atan2(y, x float64) float64 {
	if x > 0 {
		return atan(y / x)
	}
	if x < 0 && y >= 0 {
		return atan(y/x) + 3.14159265359
	}
	if x < 0 && y < 0 {
		return atan(y/x) - 3.14159265359
	}
	if x == 0 && y > 0 {
		return 3.14159265359 / 2
	}
	if x == 0 && y < 0 {
		return -3.14159265359 / 2
	}
	return 0
}

func atan(x float64) float64 {
	return x - x*x*x/3 + x*x*x*x*x/5 // Taylor series approximation
}

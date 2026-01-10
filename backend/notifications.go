package main

import (
	"encoding/json"
	"net/http"
	"strconv"
	"sync"
	"time"
)

// Notification represents a system notification
type Notification struct {
	ID        int64     `json:"id"`
	Type      string    `json:"type"`
	Icon      string    `json:"icon"`
	Title     string    `json:"title"`
	Message   string    `json:"message"`
	Time      string    `json:"time"`
	Timestamp int64     `json:"timestamp"`
	Read      bool      `json:"read"`
	Archived  bool      `json:"archived"`
	UserID    string    `json:"user_id"`
}

var (
	notificationsMu    sync.RWMutex
	notifications      = []Notification{}
	notificationIDSeq  = int64(1)
)

// InitNotifications initializes the notifications system with some mock data
func InitNotifications() {
	notificationsMu.Lock()
	defer notificationsMu.Unlock()

	now := time.Now()
	notifications = []Notification{
		{
			ID:        notificationIDSeq,
			Type:      "alert",
			Icon:      "⚠️",
			Title:     "Track Maintenance Alert",
			Message:   "Scheduled maintenance on Lusaka-Livingstone route starting tomorrow at 06:00.",
			Time:      "5 minutes ago",
			Timestamp: now.Add(-5 * time.Minute).Unix(),
			Read:      false,
			Archived:  false,
			UserID:    "admin-1",
		},
		{
			ID:        notificationIDSeq + 1,
			Type:      "maintenance",
			Icon:      "🔧",
			Title:     "Maintenance Completed",
			Message:   "LOC-001 maintenance has been completed. Unit is ready for service.",
			Time:      "1 hour ago",
			Timestamp: now.Add(-1 * time.Hour).Unix(),
			Read:      false,
			Archived:  false,
			UserID:    "admin-1",
		},
		{
			ID:        notificationIDSeq + 2,
			Type:      "booking",
			Icon:      "🎫",
			Title:     "High Booking Volume",
			Message:   "Lusaka-Livingstone route has 95% capacity for tomorrow. Consider adding extra cars.",
			Time:      "2 hours ago",
			Timestamp: now.Add(-2 * time.Hour).Unix(),
			Read:      false,
			Archived:  false,
			UserID:    "admin-1",
		},
		{
			ID:        notificationIDSeq + 3,
			Type:      "system",
			Icon:      "✅",
			Title:     "System Update Complete",
			Message:   "Ticketing system has been updated to version 2.4.1. New features available.",
			Time:      "3 hours ago",
			Timestamp: now.Add(-3 * time.Hour).Unix(),
			Read:      true,
			Archived:  false,
			UserID:    "admin-1",
		},
		{
			ID:        notificationIDSeq + 4,
			Type:      "alert",
			Icon:      "⚠️",
			Title:     "Weather Alert",
			Message:   "Heavy rainfall expected on TAZARA line. Monitor track conditions closely.",
			Time:      "5 hours ago",
			Timestamp: now.Add(-5 * time.Hour).Unix(),
			Read:      true,
			Archived:  false,
			UserID:    "admin-1",
		},
	}
	notificationIDSeq += 5
}

// GetNotifications retrieves notifications for a user
func GetNotifications(userID string, filter string) []Notification {
	notificationsMu.RLock()
	defer notificationsMu.RUnlock()

	var filtered []Notification
	for _, n := range notifications {
		if n.UserID != userID {
			continue
		}

		switch filter {
		case "unread":
			if !n.Read && !n.Archived {
				filtered = append(filtered, n)
			}
		case "archived":
			if n.Archived {
				filtered = append(filtered, n)
			}
		default: // "all"
			if !n.Archived {
				filtered = append(filtered, n)
			}
		}
	}

	return filtered
}

// CreateNotification creates a new notification
func CreateNotification(notification Notification) Notification {
	notificationsMu.Lock()
	defer notificationsMu.Unlock()

	notification.ID = notificationIDSeq
	notification.Timestamp = time.Now().Unix()
	notification.Read = false
	notification.Archived = false
	notificationIDSeq++

	notifications = append([]Notification{notification}, notifications...)
	return notification
}

// MarkAsRead marks a notification as read
func MarkAsRead(id int64) bool {
	notificationsMu.Lock()
	defer notificationsMu.Unlock()

	for i := range notifications {
		if notifications[i].ID == id {
			notifications[i].Read = true
			return true
		}
	}
	return false
}

// MarkAllAsRead marks all notifications as read for a user
func MarkAllAsRead(userID string) int {
	notificationsMu.Lock()
	defer notificationsMu.Unlock()

	count := 0
	for i := range notifications {
		if notifications[i].UserID == userID && !notifications[i].Archived && !notifications[i].Read {
			notifications[i].Read = true
			count++
		}
	}
	return count
}

// ArchiveNotification archives a notification
func ArchiveNotification(id int64) bool {
	notificationsMu.Lock()
	defer notificationsMu.Unlock()

	for i := range notifications {
		if notifications[i].ID == id {
			notifications[i].Archived = true
			return true
		}
	}
	return false
}

// DeleteNotification deletes a notification
func DeleteNotification(id int64) bool {
	notificationsMu.Lock()
	defer notificationsMu.Unlock()

	for i, n := range notifications {
		if n.ID == id {
			notifications = append(notifications[:i], notifications[i+1:]...)
			return true
		}
	}
	return false
}

// HTTP Handlers

func notificationsHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method == "GET" {
		// Get notifications
		userID := r.URL.Query().Get("user_id")
		filter := r.URL.Query().Get("filter")
		if filter == "" {
			filter = "all"
		}

		if userID == "" {
			http.Error(w, "user_id is required", http.StatusBadRequest)
			return
		}

		notifs := GetNotifications(userID, filter)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"notifications": notifs,
			"count":         len(notifs),
		})

	} else if r.Method == "POST" {
		// Create notification
		var notification Notification
		if err := json.NewDecoder(r.Body).Decode(&notification); err != nil {
			http.Error(w, err.Error(), http.StatusBadRequest)
			return
		}

		created := CreateNotification(notification)
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(created)

	} else {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
	}
}

func notificationActionHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	if r.Method != "POST" {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req struct {
		Action string  `json:"action"`
		IDs    []int64 `json:"ids"`
		UserID string  `json:"user_id"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	switch req.Action {
	case "mark_read":
		count := 0
		for _, id := range req.IDs {
			if MarkAsRead(id) {
				count++
			}
		}
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"count":   count,
		})

	case "mark_all_read":
		count := MarkAllAsRead(req.UserID)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"count":   count,
		})

	case "archive":
		count := 0
		for _, id := range req.IDs {
			if ArchiveNotification(id) {
				count++
			}
		}
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"count":   count,
		})

	case "delete":
		count := 0
		for _, id := range req.IDs {
			if DeleteNotification(id) {
				count++
			}
		}
		json.NewEncoder(w).Encode(map[string]interface{}{
			"success": true,
			"count":   count,
		})

	default:
		http.Error(w, "Invalid action", http.StatusBadRequest)
	}
}

func notificationCountHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		http.Error(w, "user_id is required", http.StatusBadRequest)
		return
	}

	notificationsMu.RLock()
	defer notificationsMu.RUnlock()

	unreadCount := 0
	for _, n := range notifications {
		if n.UserID == userID && !n.Read && !n.Archived {
			unreadCount++
		}
	}

	json.NewEncoder(w).Encode(map[string]interface{}{
		"unread_count": unreadCount,
	})
}

// Helper function to format time ago
func formatTimeAgo(timestamp int64) string {
	duration := time.Since(time.Unix(timestamp, 0))

	if duration < time.Minute {
		return "just now"
	} else if duration < time.Hour {
		mins := int(duration.Minutes())
		if mins == 1 {
			return "1 minute ago"
		}
		return strconv.Itoa(mins) + " minutes ago"
	} else if duration < 24*time.Hour {
		hours := int(duration.Hours())
		if hours == 1 {
			return "1 hour ago"
		}
		return strconv.Itoa(hours) + " hours ago"
	} else if duration < 7*24*time.Hour {
		days := int(duration.Hours() / 24)
		if days == 1 {
			return "1 day ago"
		}
		return strconv.Itoa(days) + " days ago"
	} else {
		return time.Unix(timestamp, 0).Format("Jan 2, 2006")
	}
}

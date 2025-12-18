package models

import "time"

type TrainTelemetry struct {
    TrainID   string    `json:"train_id"`
    Lat       float64   `json:"latitude"`
    Long      float64   `json:"longitude"`
    Speed     float64   `json:"speed_kmh"`
    Timestamp time.Time `json:"timestamp"`
    Status    string    `json:"status"`
}
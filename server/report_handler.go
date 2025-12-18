package main

type Report struct {
    ID         string `json:"id"`
    WorkerID   string `json:"worker_id"`
    Transcript string `json:"transcript"`
    Timestamp  string `json:"timestamp"`
}

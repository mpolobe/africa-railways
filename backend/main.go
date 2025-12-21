package main

import (
    "fmt"
    "log"
    "net/http"
)

func main() {
    fmt.Println("🚂 Africa Railways Digital Spine: Backend Active")
    
    http.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "Digital Spine Backend: Operational")
    })

    // Port 8080 for internal services
    fmt.Println("Starting server on :8080...")
    if err := http.ListenAndServe(":8080", nil); err != nil {
        log.Fatalf("Server failed to start: %v", err)
    }
}
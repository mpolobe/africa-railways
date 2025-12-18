package main

import (
    "fmt"
    "net/http"
)

func main() {
    fmt.Println("🚂 Africa Railways Digital Spine: Backend Active")
    
    http.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
        fmt.Fprintf(w, "Digital Spine Backend: Operational")
    })

    // Port 8080 for internal services
    http.ListenAndServe(":8080", nil)
}
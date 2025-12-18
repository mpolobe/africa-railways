package main

import (
"strings"
)

type AIReport struct {
OriginalText string  `json:"transcript"`
Priority     string  `json:"priority"`
BonusAmount  float64 `json:"bonus_amount"`
}

func ClassifyVoiceReport(transcript string) AIReport {
t := strings.ToLower(transcript)
report := AIReport{
OriginalText: transcript,
Priority:     "LOW",
BonusAmount:  5.00,
}

if strings.Contains(t, "danger") || strings.Contains(t, "stop") || strings.Contains(t, "fire") || strings.Contains(t, "leak") {
report.Priority = "CRITICAL"
report.BonusAmount = 50.00
} else if strings.Contains(t, "maintenance") || strings.Contains(t, "delay") {
report.Priority = "MEDIUM"
report.BonusAmount = 15.00
}
return report
}

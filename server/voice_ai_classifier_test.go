package main

import (
	"testing"
)

func TestClassifyVoiceReport_Critical(t *testing.T) {
	tests := []struct {
		name           string
		transcript     string
		expectedPrio   string
		expectedBonus  float64
	}{
		{
			name:          "Danger keyword",
			transcript:    "There is danger on track 5",
			expectedPrio:  "CRITICAL",
			expectedBonus: 50.00,
		},
		{
			name:          "Fire keyword",
			transcript:    "Fire detected near the station",
			expectedPrio:  "CRITICAL",
			expectedBonus: 50.00,
		},
		{
			name:          "Stop keyword",
			transcript:    "Emergency stop required immediately",
			expectedPrio:  "CRITICAL",
			expectedBonus: 50.00,
		},
		{
			name:          "Leak keyword",
			transcript:    "Water leak in tunnel section",
			expectedPrio:  "CRITICAL",
			expectedBonus: 50.00,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ClassifyVoiceReport(tt.transcript)
			if result.Priority != tt.expectedPrio {
				t.Errorf("Expected priority %s, got %s", tt.expectedPrio, result.Priority)
			}
			if result.BonusAmount != tt.expectedBonus {
				t.Errorf("Expected bonus %.2f, got %.2f", tt.expectedBonus, result.BonusAmount)
			}
			if result.OriginalText != tt.transcript {
				t.Errorf("Expected original text to be preserved")
			}
		})
	}
}

func TestClassifyVoiceReport_Medium(t *testing.T) {
	tests := []struct {
		name           string
		transcript     string
		expectedPrio   string
		expectedBonus  float64
	}{
		{
			name:          "Maintenance keyword",
			transcript:    "Track maintenance needed on section B",
			expectedPrio:  "MEDIUM",
			expectedBonus: 15.00,
		},
		{
			name:          "Delay keyword",
			transcript:    "Train delay reported at station",
			expectedPrio:  "MEDIUM",
			expectedBonus: 15.00,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ClassifyVoiceReport(tt.transcript)
			if result.Priority != tt.expectedPrio {
				t.Errorf("Expected priority %s, got %s", tt.expectedPrio, result.Priority)
			}
			if result.BonusAmount != tt.expectedBonus {
				t.Errorf("Expected bonus %.2f, got %.2f", tt.expectedBonus, result.BonusAmount)
			}
		})
	}
}

func TestClassifyVoiceReport_Low(t *testing.T) {
	result := ClassifyVoiceReport("Everything looks normal today")
	
	if result.Priority != "LOW" {
		t.Errorf("Expected priority LOW, got %s", result.Priority)
	}
	if result.BonusAmount != 5.00 {
		t.Errorf("Expected bonus 5.00, got %.2f", result.BonusAmount)
	}
}

func TestClassifyVoiceReport_CaseInsensitive(t *testing.T) {
	tests := []string{
		"DANGER ahead",
		"Danger ahead",
		"danger ahead",
		"DaNgEr ahead",
	}

	for _, transcript := range tests {
		result := ClassifyVoiceReport(transcript)
		if result.Priority != "CRITICAL" {
			t.Errorf("Case insensitive test failed for '%s': got priority %s", transcript, result.Priority)
		}
	}
}

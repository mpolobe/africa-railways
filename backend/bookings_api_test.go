package main

import (
	"strings"
	"testing"
)

func TestRandomString_Length(t *testing.T) {
	tests := []int{1, 6, 10, 20}
	for _, length := range tests {
		result := randomString(length)
		if len(result) != length {
			t.Errorf("randomString(%d) returned string of length %d, want %d", length, len(result), length)
		}
	}
}

func TestRandomString_ValidCharacters(t *testing.T) {
	const validChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
	result := randomString(100)
	for i, c := range result {
		if !strings.ContainsRune(validChars, c) {
			t.Errorf("randomString returned invalid character '%c' at position %d", c, i)
		}
	}
}

func TestRandomString_Uniqueness(t *testing.T) {
	// Generate 1000 random strings and check for duplicates
	seen := make(map[string]bool)
	duplicates := 0
	iterations := 1000

	for i := 0; i < iterations; i++ {
		s := randomString(6)
		if seen[s] {
			duplicates++
		}
		seen[s] = true
	}

	// With 36^6 = 2.1 billion possible combinations, duplicates should be extremely rare
	// Allow at most 1 duplicate in 1000 iterations (statistically very unlikely)
	if duplicates > 1 {
		t.Errorf("randomString produced %d duplicates in %d iterations, expected <= 1", duplicates, iterations)
	}
}

func TestRandomString_Distribution(t *testing.T) {
	// Test that characters are reasonably distributed
	charCount := make(map[byte]int)
	iterations := 10000
	strLen := 6

	for i := 0; i < iterations; i++ {
		s := randomString(strLen)
		for j := 0; j < len(s); j++ {
			charCount[s[j]]++
		}
	}

	totalChars := iterations * strLen
	expectedPerChar := float64(totalChars) / 36.0 // 36 possible characters
	tolerance := expectedPerChar * 0.3            // Allow 30% deviation

	for char, count := range charCount {
		if float64(count) < expectedPerChar-tolerance || float64(count) > expectedPerChar+tolerance {
			t.Logf("Character '%c' appeared %d times, expected ~%.0f (within %.0f)", char, count, expectedPerChar, tolerance)
		}
	}

	// Ensure all 36 characters appear at least once
	if len(charCount) < 36 {
		t.Errorf("Only %d unique characters appeared, expected 36", len(charCount))
	}
}

func TestGenerateBookingID_Format(t *testing.T) {
	id := GenerateBookingID()
	if !strings.HasPrefix(id, "BKG-") {
		t.Errorf("GenerateBookingID() = %s, want prefix 'BKG-'", id)
	}
}

func TestGenerateTicketID_Format(t *testing.T) {
	id := GenerateTicketID()
	if !strings.HasPrefix(id, "TKT-TAZARA-") {
		t.Errorf("GenerateTicketID() = %s, want prefix 'TKT-TAZARA-'", id)
	}
}

func TestGenerateNFTID_Format(t *testing.T) {
	id := GenerateNFTID()
	if !strings.HasPrefix(id, "NFT-") {
		t.Errorf("GenerateNFTID() = %s, want prefix 'NFT-'", id)
	}
}

func TestGeneratePaymentID_Format(t *testing.T) {
	id := GeneratePaymentID()
	if !strings.HasPrefix(id, "PAY-") {
		t.Errorf("GeneratePaymentID() = %s, want prefix 'PAY-'", id)
	}
}

func TestGenerateBookingID_Uniqueness(t *testing.T) {
	seen := make(map[string]bool)
	for i := 0; i < 100; i++ {
		id := GenerateBookingID()
		if seen[id] {
			t.Errorf("GenerateBookingID() produced duplicate: %s", id)
		}
		seen[id] = true
	}
}

func TestGenerateTicketID_Uniqueness(t *testing.T) {
	seen := make(map[string]bool)
	for i := 0; i < 100; i++ {
		id := GenerateTicketID()
		if seen[id] {
			t.Errorf("GenerateTicketID() produced duplicate: %s", id)
		}
		seen[id] = true
	}
}

func BenchmarkRandomString(b *testing.B) {
	for i := 0; i < b.N; i++ {
		randomString(6)
	}
}

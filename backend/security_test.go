package main

import (
	"os"
	"strings"
	"testing"
)

// TestEncryptDecryptRoundtrip verifies the AES-256-GCM token encryption from issue #6.
// This is the difference between "DB dump = all users compromised" and
// "DB dump = encrypted blobs". Getting this wrong is a security incident.
func TestEncryptDecryptRoundtrip(t *testing.T) {
	// 32 bytes for AES-256
	os.Setenv("AES_KEY", "PlanPalTest2026SecureAESKey32B__")
	defer os.Unsetenv("AES_KEY")

	cases := []string{
		"ya29.a0AfH6SMBxxxxxxxxxxxxxxxxxxxxx",                          // typical Google access token shape
		"",                                                              // empty input
		strings.Repeat("a", 4096),                                       // long input
		"日本語のトークンが来ることはないが念のため",                                       // unicode
		"newline\nand\ttab",                                             // control chars
	}

	for _, plaintext := range cases {
		t.Run(plaintext[:min(20, len(plaintext))], func(t *testing.T) {
			ciphertext, err := Encrypt(plaintext)
			if err != nil {
				t.Fatalf("Encrypt failed: %v", err)
			}
			if ciphertext == plaintext && plaintext != "" {
				t.Fatalf("ciphertext equals plaintext — encryption did not happen")
			}

			got, err := Decrypt(ciphertext)
			if err != nil {
				t.Fatalf("Decrypt failed: %v", err)
			}
			if got != plaintext {
				t.Errorf("roundtrip mismatch: got %q, want %q", got, plaintext)
			}
		})
	}
}

// TestEncryptUsesUniqueNonce verifies the per-call nonce design from issue #6.
// Identical plaintexts MUST produce different ciphertexts — otherwise an attacker
// can correlate "user A and user B have the same refresh token" from DB inspection.
func TestEncryptUsesUniqueNonce(t *testing.T) {
	os.Setenv("AES_KEY", "PlanPalTest2026SecureAESKey32B__")
	defer os.Unsetenv("AES_KEY")

	plaintext := "ya29.a0SameTokenTwice"
	c1, _ := Encrypt(plaintext)
	c2, _ := Encrypt(plaintext)

	if c1 == c2 {
		t.Errorf("encrypting the same plaintext twice produced identical ciphertexts — nonce is not randomized")
	}

	// Both should still decrypt to the same plaintext
	p1, _ := Decrypt(c1)
	p2, _ := Decrypt(c2)
	if p1 != plaintext || p2 != plaintext {
		t.Errorf("decryption mismatch: p1=%q, p2=%q, want %q", p1, p2, plaintext)
	}
}

// TestDecryptRejectsTamperedCiphertext verifies GCM's authentication property.
// Issue #6 chose GCM specifically so we get integrity for free.
func TestDecryptRejectsTamperedCiphertext(t *testing.T) {
	os.Setenv("AES_KEY", "PlanPalTest2026SecureAESKey32B__")
	defer os.Unsetenv("AES_KEY")

	ciphertext, _ := Encrypt("ya29.a0Sensitive")

	// Flip a character in the middle of the ciphertext
	tampered := []byte(ciphertext)
	if len(tampered) > 10 {
		tampered[10] = tampered[10] ^ 0x01
		// Re-encode the flipped byte back into a valid base64 char if needed
		if tampered[10] == '+' || tampered[10] == '/' || tampered[10] == '=' {
			tampered[10] = 'A'
		}
	}

	if _, err := Decrypt(string(tampered)); err == nil {
		t.Errorf("Decrypt accepted a tampered ciphertext — GCM auth tag is not being checked")
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}

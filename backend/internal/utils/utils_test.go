package utils

import (
	"testing"
)

func TestPasswordHash(t *testing.T) {
	password := "SecretP@ss123"
	hash, err := HashPassword(password)
	if err != nil {
		t.Fatalf("failed to hash password: %v", err)
	}

	if err := CheckPasswordHash(hash, password); err != nil {
		t.Fatalf("expected password to match hash: %v", err)
	}

	if err := CheckPasswordHash(hash, "wrong-password"); err == nil {
		t.Fatalf("expected wrong password to fail")
	}
}

func TestJWT(t *testing.T) {
	InitJWT("test-jwt-secret-key-1234567890")

	userID := int64(42)
	name := "Alice"

	token, err := GenerateJWT(userID, name)
	if err != nil {
		t.Fatalf("failed to generate JWT: %v", err)
	}

	parsedID, parsedName, err := ParsJWT(token)
	if err != nil {
		t.Fatalf("failed to parse JWT: %v", err)
	}

	if parsedID != userID {
		t.Errorf("expected user ID %d, got %d", userID, parsedID)
	}

	if parsedName != name {
		t.Errorf("expected name %s, got %s", name, parsedName)
	}
}

func TestRefreshToken(t *testing.T) {
	token, err := GenerateRefreshToken()
	if err != nil {
		t.Fatalf("failed to generate refresh token: %v", err)
	}

	if len(token) == 0 {
		t.Fatalf("expected non-empty refresh token")
	}

	hash1 := HashRefreshToken(token)
	hash2 := HashRefreshToken(token)

	if hash1 != hash2 {
		t.Errorf("expected deterministic hash output, got %s and %s", hash1, hash2)
	}
}

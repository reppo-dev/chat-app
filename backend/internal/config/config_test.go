package config

import (
	"os"
	"testing"
)

func TestLoadConfig_PortDetection(t *testing.T) {
	// Simulate Render environment where PORT is injected
	os.Setenv("PORT", "10000")
	defer os.Unsetenv("PORT")

	cfg := LoadConfig()
	expectedAddress := "0.0.0.0:10000"
	if cfg.HTTP_ADDRESS != expectedAddress {
		t.Errorf("expected HTTP_ADDRESS to be %s, got %s", expectedAddress, cfg.HTTP_ADDRESS)
	}

	if cfg.DB_DRIVER != "pgx" {
		t.Errorf("expected default DB_DRIVER to be pgx, got %s", cfg.DB_DRIVER)
	}
}

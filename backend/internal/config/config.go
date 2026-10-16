package config

import (
	"flag"
	"log"
	"os"
	"strings"

	"github.com/ilyakaznacheev/cleanenv"
)

type Config struct {
	JWT_KEY      string `env:"JWT_KEY"`
	DB           string `env:"DB"`
	HTTP_ADDRESS string `env:"HTTP_ADDRESS"`
	DB_DRIVER    string `env:"DB_DRIVER"`
	CLIENT_URL   string `env:"CLIENT_URL"`
	PORT         string `env:"PORT"`
}

func LoadConfig() *Config {
	var cfg Config

	var envfile string

	flag.StringVar(&envfile, "config", "", "path to env file")
	flag.Parse()

	if envfile == "" {
		envfile = os.Getenv("CONFIG_PATH")
	}

	if envfile == "" {
		envfile = "config/dev.env"
	}

	// Try reading env file if it exists on disk (e.g. local dev)
	if envfile != "" {
		if _, err := os.Stat(envfile); err == nil {
			if err := cleanenv.ReadConfig(envfile, &cfg); err != nil {
				log.Printf("Warning: failed to read config file %s: %v", envfile, err)
			}
		}
	}

	// Read/override directly from environment variables (e.g. on Render/Railway/cloud)
	if err := cleanenv.ReadEnv(&cfg); err != nil {
		log.Printf("Note on reading env: %v", err)
	}

	// Automatic Render / Cloud PORT detection:
	// Cloud providers like Render, Railway, etc. automatically set the PORT environment variable.
	port := os.Getenv("PORT")
	if port == "" {
		port = cfg.PORT
	}

	if port != "" {
		port = strings.TrimSpace(port)
		if strings.HasPrefix(port, ":") {
			cfg.HTTP_ADDRESS = "0.0.0.0" + port
		} else {
			cfg.HTTP_ADDRESS = "0.0.0.0:" + port
		}
	} else if cfg.HTTP_ADDRESS == "" {
		cfg.HTTP_ADDRESS = "0.0.0.0:9090"
	}

	if cfg.DB_DRIVER == "" {
		cfg.DB_DRIVER = "pgx"
	}

	return &cfg
}

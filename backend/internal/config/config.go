package config

import (
	"flag"
	"log"
	"os"

	"github.com/ilyakaznacheev/cleanenv"
)

type Config struct {
	JWT_KEY     string `env:"JWT_KEY"`
	DB           string `env:"DB"`
	HTTP_ADDRESS string `env:"HTTP_ADDRESS"`
	DB_DRIVER    string `env:"DB_DRIVER"`
}

func LoadConfig() *Config {
	var cfg Config

	var envfile string

	flag.StringVar(&envfile,"config","","path to env file")
	flag.Parse()

	if envfile == "" {
		envfile = os.Getenv("CONFIG_PATH")
	}

	if envfile == "" {
		envfile = "config/dev.env"
	}

	err := cleanenv.ReadConfig(envfile,&cfg)
	if err != nil {
		log.Fatalf("Cannot read env file %s: %v",envfile,err)
	}

	return &cfg
}

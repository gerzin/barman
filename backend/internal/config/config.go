// Package config loads application configuration from the environment.
package config

import "os"

// Config holds all runtime configuration for the backend service.
type Config struct {
	Port        string
	DatabaseURL string
}

// Load reads configuration from environment variables, falling back to
// sensible local development defaults.
func Load() Config {
	return Config{
		Port:        getEnv("PORT", "8080"),
		DatabaseURL: getEnv("DATABASE_URL", "postgres://barman:barman@postgres:5432/barman?sslmode=disable"),
	}
}

func getEnv(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}

	return fallback
}

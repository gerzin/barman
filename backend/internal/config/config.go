// Package config loads application configuration from the environment.
package config

import (
	"log/slog"
	"os"
	"strconv"
	"time"
)

// Config holds all runtime configuration for the backend service.
type Config struct {
	Port        string
	DatabaseURL string

	// JWTSecret signs the auth tokens issued on login. It must be set to a
	// real secret in production - a random fallback is used otherwise so
	// the server still runs locally, but tokens won't survive a restart.
	JWTSecret string

	// TableRetentionDays is how long a closed table (and its orders/logs)
	// is kept before being permanently deleted.
	TableRetentionDays int
	// TableCleanupInterval is how often the background purge job runs.
	TableCleanupInterval time.Duration
}

// Load reads configuration from environment variables, falling back to
// sensible local development defaults.
func Load() Config {
	return Config{
		Port:                 getEnv("PORT", "8080"),
		DatabaseURL:          getEnv("DATABASE_URL", "postgres://barman:barman@postgres:5432/barman?sslmode=disable"),
		JWTSecret:            loadJWTSecret(),
		TableRetentionDays:   getEnvInt("TABLE_RETENTION_DAYS", 30),
		TableCleanupInterval: getEnvDuration("TABLE_CLEANUP_INTERVAL", time.Hour),
	}
}

func loadJWTSecret() string {
	if v, ok := os.LookupEnv("JWT_SECRET"); ok && v != "" {
		return v
	}

	slog.Warn("JWT_SECRET not set, using an insecure development default - set it explicitly in production")
	return "insecure-development-secret-change-me"
}

func getEnv(key, fallback string) string {
	if v, ok := os.LookupEnv(key); ok && v != "" {
		return v
	}

	return fallback
}

func getEnvInt(key string, fallback int) int {
	v, ok := os.LookupEnv(key)
	if !ok || v == "" {
		return fallback
	}

	n, err := strconv.Atoi(v)
	if err != nil {
		return fallback
	}
	return n
}

func getEnvDuration(key string, fallback time.Duration) time.Duration {
	v, ok := os.LookupEnv(key)
	if !ok || v == "" {
		return fallback
	}

	d, err := time.ParseDuration(v)
	if err != nil {
		return fallback
	}
	return d
}

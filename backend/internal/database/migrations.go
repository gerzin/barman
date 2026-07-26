package database

import (
	"database/sql"
	"embed"
	"errors"
	"fmt"
	"log/slog"
	"time"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/database/postgres"
	"github.com/golang-migrate/migrate/v4/source/iofs"

	_ "github.com/jackc/pgx/v5/stdlib" // registers the "pgx" database/sql driver
)

//go:embed migrations/*.sql
var migrationsFS embed.FS

// migrationConnectAttempts/Delay bound how long RunMigrations waits for
// Postgres to become reachable before giving up. This covers orchestrators
// (or plain `docker run`) that don't gate startup on a DB healthcheck.
const (
	migrationConnectAttempts = 10
	migrationConnectDelay    = 2 * time.Second
)

// RunMigrations applies all pending "up" migrations embedded in the binary.
// It opens its own short-lived database/sql connection (golang-migrate does
// not use pgxpool) and closes it before returning.
func RunMigrations(databaseURL string) error {
	source, err := iofs.New(migrationsFS, "migrations")
	if err != nil {
		return fmt.Errorf("load embedded migrations: %w", err)
	}

	db, err := sql.Open("pgx", databaseURL)
	if err != nil {
		return fmt.Errorf("open migration connection: %w", err)
	}
	defer db.Close()

	if err := waitForDB(db); err != nil {
		return fmt.Errorf("database not reachable: %w", err)
	}

	driver, err := postgres.WithInstance(db, &postgres.Config{})
	if err != nil {
		return fmt.Errorf("create postgres migration driver: %w", err)
	}

	m, err := migrate.NewWithInstance("iofs", source, "postgres", driver)
	if err != nil {
		return fmt.Errorf("create migrator: %w", err)
	}

	if err := m.Up(); err != nil && !errors.Is(err, migrate.ErrNoChange) {
		return fmt.Errorf("apply migrations: %w", err)
	}

	return nil
}

// waitForDB retries pinging the database with a fixed backoff, since the
// database container may still be starting up when this runs.
func waitForDB(db *sql.DB) error {
	var err error
	for attempt := 1; attempt <= migrationConnectAttempts; attempt++ {
		if err = db.Ping(); err == nil {
			return nil
		}

		slog.Warn("database not ready, retrying", "attempt", attempt, "error", err)
		time.Sleep(migrationConnectDelay)
	}

	return err
}

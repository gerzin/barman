package postgres

import (
	"barman/internal/domain"
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
)

// TablePostgresRepository implements repository.TableRepository.
type TablePostgresRepository struct {
	db *pgxpool.Pool
}

func NewTablePostgresRepository(db *pgxpool.Pool) *TablePostgresRepository {
	return &TablePostgresRepository{db: db}
}

func (r *TablePostgresRepository) Create(ctx context.Context, table *domain.Table) error {
	query := `INSERT INTO tables (name) VALUES ($1)
		RETURNING id, qr_token, closed, closed_at, created_at, updated_at`
	err := r.db.QueryRow(ctx, query, table.Name).Scan(
		&table.ID, &table.QRToken, &table.Closed, &table.ClosedAt, &table.CreatedAt, &table.UpdatedAt,
	)
	if err != nil {
		return fmt.Errorf("failed to create table: %w", err)
	}
	return nil
}

func (r *TablePostgresRepository) GetByID(ctx context.Context, id string) (*domain.Table, error) {
	query := `SELECT id, name, qr_token, closed, closed_at, created_at, updated_at FROM tables WHERE id = $1`
	row := r.db.QueryRow(ctx, query, id)
	return scanTable(row)
}

func (r *TablePostgresRepository) GetByQRToken(ctx context.Context, token string) (*domain.Table, error) {
	query := `SELECT id, name, qr_token, closed, closed_at, created_at, updated_at FROM tables WHERE qr_token = $1`
	row := r.db.QueryRow(ctx, query, token)
	return scanTable(row)
}

func (r *TablePostgresRepository) Update(ctx context.Context, table *domain.Table) error {
	query := `UPDATE tables SET name = $1, closed = $2, closed_at = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4`
	_, err := r.db.Exec(ctx, query, table.Name, table.Closed, table.ClosedAt, table.ID)
	if err != nil {
		return fmt.Errorf("failed to update table: %w", err)
	}
	return nil
}

func (r *TablePostgresRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM tables WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete table: %w", err)
	}
	return nil
}

func (r *TablePostgresRepository) List(ctx context.Context) ([]*domain.Table, error) {
	query := `SELECT id, name, qr_token, closed, closed_at, created_at, updated_at FROM tables ORDER BY name`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to list tables: %w", err)
	}
	defer rows.Close()

	tables := make([]*domain.Table, 0)
	for rows.Next() {
		var table domain.Table
		err := rows.Scan(&table.ID, &table.Name, &table.QRToken, &table.Closed, &table.ClosedAt, &table.CreatedAt, &table.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan table: %w", err)
		}
		tables = append(tables, &table)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating over table rows: %w", err)
	}

	return tables, nil
}

func (r *TablePostgresRepository) DeleteClosedBefore(ctx context.Context, cutoff time.Time) (int64, error) {
	query := `DELETE FROM tables WHERE closed = true AND closed_at < $1`
	tag, err := r.db.Exec(ctx, query, cutoff)
	if err != nil {
		return 0, fmt.Errorf("failed to delete closed tables: %w", err)
	}
	return tag.RowsAffected(), nil
}

// rowScanner is satisfied by both pgx.Row and pgxpool.Row, letting scanTable
// be reused for any single-row query result.
type rowScanner interface {
	Scan(dest ...any) error
}

func scanTable(row rowScanner) (*domain.Table, error) {
	var table domain.Table
	err := row.Scan(&table.ID, &table.Name, &table.QRToken, &table.Closed, &table.ClosedAt, &table.CreatedAt, &table.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to get table: %w", err)
	}
	return &table, nil
}

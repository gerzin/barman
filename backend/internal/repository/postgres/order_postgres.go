package postgres

import (
	"barman/internal/domain"
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// OrderPostgresRepository implements repository.OrderRepository.
type OrderPostgresRepository struct {
	db *pgxpool.Pool
}

func NewOrderPostgresRepository(db *pgxpool.Pool) *OrderPostgresRepository {
	return &OrderPostgresRepository{db: db}
}

func (r *OrderPostgresRepository) Create(ctx context.Context, order *domain.Order) error {
	query := `INSERT INTO orders (table_id, product_id, product_name, unit_price, quantity, note, created_by)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id, created_at, updated_at`
	err := r.db.QueryRow(ctx, query,
		order.TableID, order.ProductID, order.ProductName, order.UnitPrice, order.Quantity, order.Note, order.CreatedBy,
	).Scan(&order.ID, &order.CreatedAt, &order.UpdatedAt)
	if err != nil {
		return fmt.Errorf("failed to create order: %w", err)
	}
	return nil
}

func (r *OrderPostgresRepository) GetByID(ctx context.Context, id string) (*domain.Order, error) {
	query := `SELECT id, table_id, product_id, product_name, unit_price, quantity, note, created_by, created_at, updated_at
		FROM orders WHERE id = $1`
	row := r.db.QueryRow(ctx, query, id)

	var order domain.Order
	err := row.Scan(&order.ID, &order.TableID, &order.ProductID, &order.ProductName, &order.UnitPrice, &order.Quantity, &order.Note, &order.CreatedBy, &order.CreatedAt, &order.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to get order by ID: %w", err)
	}

	return &order, nil
}

func (r *OrderPostgresRepository) Update(ctx context.Context, order *domain.Order) error {
	query := `UPDATE orders SET quantity = $1, note = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`
	_, err := r.db.Exec(ctx, query, order.Quantity, order.Note, order.ID)
	if err != nil {
		return fmt.Errorf("failed to update order: %w", err)
	}
	return nil
}

func (r *OrderPostgresRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM orders WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete order: %w", err)
	}
	return nil
}

func (r *OrderPostgresRepository) ListByTable(ctx context.Context, tableID string) ([]*domain.Order, error) {
	query := `SELECT id, table_id, product_id, product_name, unit_price, quantity, note, created_by, created_at, updated_at
		FROM orders WHERE table_id = $1 ORDER BY created_at`
	rows, err := r.db.Query(ctx, query, tableID)
	if err != nil {
		return nil, fmt.Errorf("failed to list orders: %w", err)
	}
	defer rows.Close()

	orders := make([]*domain.Order, 0)
	for rows.Next() {
		var order domain.Order
		err := rows.Scan(&order.ID, &order.TableID, &order.ProductID, &order.ProductName, &order.UnitPrice, &order.Quantity, &order.Note, &order.CreatedBy, &order.CreatedAt, &order.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan order: %w", err)
		}
		orders = append(orders, &order)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating over order rows: %w", err)
	}

	return orders, nil
}

// OrderLogPostgresRepository implements repository.OrderLogRepository.
type OrderLogPostgresRepository struct {
	db *pgxpool.Pool
}

func NewOrderLogPostgresRepository(db *pgxpool.Pool) *OrderLogPostgresRepository {
	return &OrderLogPostgresRepository{db: db}
}

func (r *OrderLogPostgresRepository) Create(ctx context.Context, log *domain.OrderLog) error {
	query := `INSERT INTO order_logs (order_id, table_id, action, product_name, quantity, unit_price, note, performed_by, performed_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
		RETURNING id`
	err := r.db.QueryRow(ctx, query,
		log.OrderID, log.TableID, log.Action, log.ProductName, log.Quantity, log.UnitPrice, log.Note, log.PerformedBy, log.PerformedAt,
	).Scan(&log.ID)
	if err != nil {
		return fmt.Errorf("failed to create order log: %w", err)
	}
	return nil
}

func (r *OrderLogPostgresRepository) ListByTable(ctx context.Context, tableID string) ([]*domain.OrderLog, error) {
	query := `SELECT id, order_id, table_id, action, product_name, quantity, unit_price, note, performed_by, performed_at
		FROM order_logs WHERE table_id = $1 ORDER BY performed_at`
	rows, err := r.db.Query(ctx, query, tableID)
	if err != nil {
		return nil, fmt.Errorf("failed to list order logs: %w", err)
	}
	defer rows.Close()

	logs := make([]*domain.OrderLog, 0)
	for rows.Next() {
		var log domain.OrderLog
		err := rows.Scan(&log.ID, &log.OrderID, &log.TableID, &log.Action, &log.ProductName, &log.Quantity, &log.UnitPrice, &log.Note, &log.PerformedBy, &log.PerformedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan order log: %w", err)
		}
		logs = append(logs, &log)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating over order log rows: %w", err)
	}

	return logs, nil
}

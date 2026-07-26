package postgres

import (
	"barman/internal/domain"
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

type ProductPostgresRepository struct {
	db *pgxpool.Pool
}

func NewProductPostgresRepository(db *pgxpool.Pool) *ProductPostgresRepository {
	return &ProductPostgresRepository{db: db}
}

func (r *ProductPostgresRepository) Create(ctx context.Context, product *domain.Product) error {
	query := `INSERT INTO products (name, description, price, section_id) VALUES ($1, $2, $3, $4) RETURNING id`
	err := r.db.QueryRow(ctx, query, product.Name, product.Description, product.Price, product.SectionID).Scan(&product.ID)
	if err != nil {
		return fmt.Errorf("failed to create product: %w", err)
	}
	return nil
}

func (r *ProductPostgresRepository) GetByID(ctx context.Context, id string) (*domain.Product, error) {
	query := `SELECT id, name, description, price, available, section_id, created_at, updated_at FROM products WHERE id = $1`
	row := r.db.QueryRow(ctx, query, id)

	var product domain.Product
	err := row.Scan(&product.ID, &product.Name, &product.Description, &product.Price, &product.Available, &product.SectionID, &product.CreatedAt, &product.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to get product by ID: %w", err)
	}

	return &product, nil
}

func (r *ProductPostgresRepository) Update(ctx context.Context, product *domain.Product) error {
	query := `UPDATE products SET name = $1, description = $2, price = $3, available = $4, section_id = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6`
	_, err := r.db.Exec(ctx, query, product.Name, product.Description, product.Price, product.Available, product.SectionID, product.ID)
	if err != nil {
		return fmt.Errorf("failed to update product: %w", err)
	}
	return nil
}

func (r *ProductPostgresRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM products WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete product: %w", err)
	}
	return nil
}

func (r *ProductPostgresRepository) List(ctx context.Context, limit, offset int) ([]*domain.Product, error) {
	query := `SELECT id, name, description, price, available, section_id, created_at, updated_at FROM products ORDER BY created_at DESC LIMIT $1 OFFSET $2`
	rows, err := r.db.Query(ctx, query, limit, offset)
	if err != nil {
		return nil, fmt.Errorf("failed to list products: %w", err)
	}
	defer rows.Close()

	products := make([]*domain.Product, 0)
	for rows.Next() {
		var product domain.Product
		err := rows.Scan(&product.ID, &product.Name, &product.Description, &product.Price, &product.Available, &product.SectionID, &product.CreatedAt, &product.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan product: %w", err)
		}
		products = append(products, &product)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating over product rows: %w", err)
	}

	return products, nil
}

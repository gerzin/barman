package postgres

import (
	"barman/internal/domain"
	"context"
	"database/sql"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// MenuSectionPostgresRepository implements repository.MenuSectionRepository.
type MenuSectionPostgresRepository struct {
	db *pgxpool.Pool
}

func NewMenuSectionPostgresRepository(db *pgxpool.Pool) *MenuSectionPostgresRepository {
	return &MenuSectionPostgresRepository{db: db}
}

func (r *MenuSectionPostgresRepository) Create(ctx context.Context, section *domain.MenuSection) error {
	query := `INSERT INTO menu_sections (name, description, position) VALUES ($1, $2, $3) RETURNING id`
	err := r.db.QueryRow(ctx, query, section.Name, section.Description, section.Position).Scan(&section.ID)
	if err != nil {
		return fmt.Errorf("failed to create menu section: %w", err)
	}
	return nil
}

func (r *MenuSectionPostgresRepository) GetByID(ctx context.Context, id string) (*domain.MenuSection, error) {
	query := `SELECT id, name, description, position, created_at, updated_at FROM menu_sections WHERE id = $1`
	row := r.db.QueryRow(ctx, query, id)

	var section domain.MenuSection
	err := row.Scan(&section.ID, &section.Name, &section.Description, &section.Position, &section.CreatedAt, &section.UpdatedAt)
	if err != nil {
		return nil, fmt.Errorf("failed to get menu section by ID: %w", err)
	}

	return &section, nil
}

func (r *MenuSectionPostgresRepository) Update(ctx context.Context, section *domain.MenuSection) error {
	query := `UPDATE menu_sections SET name = $1, description = $2, position = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4`
	_, err := r.db.Exec(ctx, query, section.Name, section.Description, section.Position, section.ID)
	if err != nil {
		return fmt.Errorf("failed to update menu section: %w", err)
	}
	return nil
}

func (r *MenuSectionPostgresRepository) Delete(ctx context.Context, id string) error {
	query := `DELETE FROM menu_sections WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("failed to delete menu section: %w", err)
	}
	return nil
}

func (r *MenuSectionPostgresRepository) List(ctx context.Context) ([]*domain.MenuSection, error) {
	query := `SELECT id, name, description, position, created_at, updated_at FROM menu_sections ORDER BY position, name`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to list menu sections: %w", err)
	}
	defer rows.Close()

	sections := make([]*domain.MenuSection, 0)
	for rows.Next() {
		var section domain.MenuSection
		err := rows.Scan(&section.ID, &section.Name, &section.Description, &section.Position, &section.CreatedAt, &section.UpdatedAt)
		if err != nil {
			return nil, fmt.Errorf("failed to scan menu section: %w", err)
		}
		sections = append(sections, &section)
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating over menu section rows: %w", err)
	}

	return sections, nil
}

// GetMenu loads every section (ordered by position) together with its
// products in a single query, using a LEFT JOIN so that empty sections are
// still included with an empty product list.
func (r *MenuSectionPostgresRepository) GetMenu(ctx context.Context) ([]*domain.MenuSectionWithProducts, error) {
	query := `
		SELECT s.id, s.name, s.description, s.position, s.created_at, s.updated_at,
		       p.id, p.name, p.description, p.price, p.available, p.created_at, p.updated_at
		FROM menu_sections s
		LEFT JOIN products p ON p.section_id = s.id
		ORDER BY s.position, s.name, p.name`

	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to load menu: %w", err)
	}
	defer rows.Close()

	sections := make([]*domain.MenuSectionWithProducts, 0)
	index := make(map[string]*domain.MenuSectionWithProducts)

	for rows.Next() {
		var section domain.MenuSection
		var (
			productID          sql.NullString
			productName        sql.NullString
			productDescription sql.NullString
			productPrice       sql.NullFloat64
			productAvailable   sql.NullBool
			productCreatedAt   sql.NullTime
			productUpdatedAt   sql.NullTime
		)

		err := rows.Scan(
			&section.ID, &section.Name, &section.Description, &section.Position, &section.CreatedAt, &section.UpdatedAt,
			&productID, &productName, &productDescription, &productPrice, &productAvailable, &productCreatedAt, &productUpdatedAt,
		)
		if err != nil {
			return nil, fmt.Errorf("failed to scan menu row: %w", err)
		}

		entry, ok := index[section.ID]
		if !ok {
			entry = &domain.MenuSectionWithProducts{
				MenuSection: section,
				Products:    make([]*domain.Product, 0),
			}
			index[section.ID] = entry
			sections = append(sections, entry)
		}

		if productID.Valid {
			sectionID := section.ID
			entry.Products = append(entry.Products, &domain.Product{
				ID:          productID.String,
				Name:        productName.String,
				Description: productDescription.String,
				Price:       productPrice.Float64,
				Available:   productAvailable.Bool,
				SectionID:   &sectionID,
				CreatedAt:   productCreatedAt.Time,
				UpdatedAt:   productUpdatedAt.Time,
			})
		}
	}

	if err = rows.Err(); err != nil {
		return nil, fmt.Errorf("error iterating over menu rows: %w", err)
	}

	return sections, nil
}

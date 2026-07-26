package repository

import (
	"barman/internal/domain"
	"context"
)

// MenuSectionRepository manages menu sections and the composed menu view.
type MenuSectionRepository interface {
	Create(ctx context.Context, section *domain.MenuSection) error
	GetByID(ctx context.Context, id string) (*domain.MenuSection, error)
	Update(ctx context.Context, section *domain.MenuSection) error
	Delete(ctx context.Context, id string) error
	List(ctx context.Context) ([]*domain.MenuSection, error)

	// GetMenu returns every section, ordered by position, with its
	// assigned products nested underneath.
	GetMenu(ctx context.Context) ([]*domain.MenuSectionWithProducts, error)
}

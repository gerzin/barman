package repository

import (
	"barman/internal/domain"
	"context"
	"time"
)

// TableRepository manages the physical bar tables that collect orders.
type TableRepository interface {
	Create(ctx context.Context, table *domain.Table) error
	GetByID(ctx context.Context, id string) (*domain.Table, error)
	GetByQRToken(ctx context.Context, token string) (*domain.Table, error)
	Update(ctx context.Context, table *domain.Table) error
	Delete(ctx context.Context, id string) error
	List(ctx context.Context) ([]*domain.Table, error)

	// DeleteClosedBefore permanently removes tables closed before cutoff,
	// cascading to their orders and order logs. It returns the number of
	// tables deleted.
	DeleteClosedBefore(ctx context.Context, cutoff time.Time) (int64, error)
}

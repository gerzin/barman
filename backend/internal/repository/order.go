package repository

import (
	"barman/internal/domain"
	"context"
)

// OrderRepository manages the order line items placed on tables.
type OrderRepository interface {
	Create(ctx context.Context, order *domain.Order) error
	GetByID(ctx context.Context, id string) (*domain.Order, error)
	Update(ctx context.Context, order *domain.Order) error
	Delete(ctx context.Context, id string) error
	ListByTable(ctx context.Context, tableID string) ([]*domain.Order, error)
}

// OrderLogRepository stores the immutable audit trail of order operations.
type OrderLogRepository interface {
	Create(ctx context.Context, log *domain.OrderLog) error
	ListByTable(ctx context.Context, tableID string) ([]*domain.OrderLog, error)
}

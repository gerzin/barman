package service

import (
	"barman/internal/domain"
	"barman/internal/repository"
	"context"
	"log/slog"
	"time"
)

// OrderService manages the order line items placed on tables, keeping an
// audit trail of every add/update/remove operation.
type OrderService struct {
	orderRepo    repository.OrderRepository
	orderLogRepo repository.OrderLogRepository
	tableRepo    repository.TableRepository
	productRepo  repository.ProductRepository
}

func NewOrderService(
	orderRepo repository.OrderRepository,
	orderLogRepo repository.OrderLogRepository,
	tableRepo repository.TableRepository,
	productRepo repository.ProductRepository,
) *OrderService {
	return &OrderService{
		orderRepo:    orderRepo,
		orderLogRepo: orderLogRepo,
		tableRepo:    tableRepo,
		productRepo:  productRepo,
	}
}

// AddOrder appends a new line item to a table's bill. performedBy is the
// acting employee's user ID, or nil when the customer placed it themselves
// through the QR self-order page.
func (s *OrderService) AddOrder(ctx context.Context, tableID, productID string, quantity int, note string, performedBy *string) (*domain.Order, error) {
	if quantity <= 0 {
		return nil, domain.ErrInvalidQuantity
	}

	table, err := s.tableRepo.GetByID(ctx, tableID)
	if err != nil {
		return nil, err
	}
	if table.Closed {
		return nil, domain.ErrTableClosed
	}

	product, err := s.productRepo.GetByID(ctx, productID)
	if err != nil {
		return nil, err
	}

	order := &domain.Order{
		TableID:     tableID,
		ProductID:   &product.ID,
		ProductName: product.Name,
		UnitPrice:   product.Price,
		Quantity:    quantity,
		Note:        note,
		CreatedBy:   performedBy,
	}

	if err := s.orderRepo.Create(ctx, order); err != nil {
		return nil, err
	}

	s.log(ctx, order, domain.OrderActionCreated, performedBy)
	return order, nil
}

// UpdateOrder changes the quantity and/or note of an existing line item.
func (s *OrderService) UpdateOrder(ctx context.Context, orderID string, quantity int, note string, performedBy *string) (*domain.Order, error) {
	if quantity <= 0 {
		return nil, domain.ErrInvalidQuantity
	}

	order, err := s.orderRepo.GetByID(ctx, orderID)
	if err != nil {
		return nil, err
	}

	table, err := s.tableRepo.GetByID(ctx, order.TableID)
	if err != nil {
		return nil, err
	}
	if table.Closed {
		return nil, domain.ErrTableClosed
	}

	order.Quantity = quantity
	order.Note = note
	if err := s.orderRepo.Update(ctx, order); err != nil {
		return nil, err
	}

	s.log(ctx, order, domain.OrderActionUpdated, performedBy)
	return order, nil
}

// RemoveOrder deletes a line item from a table's bill.
func (s *OrderService) RemoveOrder(ctx context.Context, orderID string, performedBy *string) error {
	order, err := s.orderRepo.GetByID(ctx, orderID)
	if err != nil {
		return err
	}

	if err := s.orderRepo.Delete(ctx, orderID); err != nil {
		return err
	}

	s.log(ctx, order, domain.OrderActionRemoved, performedBy)
	return nil
}

// ListOrders returns the current line items for a table.
func (s *OrderService) ListOrders(ctx context.Context, tableID string) ([]*domain.Order, error) {
	return s.orderRepo.ListByTable(ctx, tableID)
}

// ListLogs returns the full audit trail of order operations for a table.
func (s *OrderService) ListLogs(ctx context.Context, tableID string) ([]*domain.OrderLog, error) {
	return s.orderLogRepo.ListByTable(ctx, tableID)
}

// GetTableWithOrders returns a table together with its current orders and
// the total amount due - what staff dashboards and the QR page both need.
func (s *OrderService) GetTableWithOrders(ctx context.Context, tableID string) (*domain.TableWithOrders, error) {
	table, err := s.tableRepo.GetByID(ctx, tableID)
	if err != nil {
		return nil, err
	}

	orders, err := s.orderRepo.ListByTable(ctx, tableID)
	if err != nil {
		return nil, err
	}

	var total float64
	for _, o := range orders {
		total += o.Total()
	}

	return &domain.TableWithOrders{Table: *table, Orders: orders, Total: total}, nil
}

// log records an audit entry for an order operation. Logging failures are
// reported via slog but never fail the caller's order operation, since the
// order change itself already succeeded.
func (s *OrderService) log(ctx context.Context, order *domain.Order, action domain.OrderAction, performedBy *string) {
	entry := &domain.OrderLog{
		OrderID:     &order.ID,
		TableID:     order.TableID,
		Action:      action,
		ProductName: order.ProductName,
		Quantity:    order.Quantity,
		UnitPrice:   order.UnitPrice,
		Note:        order.Note,
		PerformedBy: performedBy,
		PerformedAt: time.Now().UTC(),
	}

	if err := s.orderLogRepo.Create(ctx, entry); err != nil {
		slog.Error("failed to write order log", "error", err, "order_id", order.ID, "action", action)
	}
}

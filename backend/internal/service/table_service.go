package service

import (
	"barman/internal/domain"
	"barman/internal/repository"
	"context"
	"time"
)

// TableService manages the lifecycle of physical bar tables.
type TableService struct {
	tableRepo repository.TableRepository
}

func NewTableService(tableRepo repository.TableRepository) *TableService {
	return &TableService{tableRepo: tableRepo}
}

func (s *TableService) CreateTable(ctx context.Context, table *domain.Table) error {
	return s.tableRepo.Create(ctx, table)
}

func (s *TableService) GetTableByID(ctx context.Context, id string) (*domain.Table, error) {
	return s.tableRepo.GetByID(ctx, id)
}

func (s *TableService) GetTableByQRToken(ctx context.Context, token string) (*domain.Table, error) {
	return s.tableRepo.GetByQRToken(ctx, token)
}

func (s *TableService) UpdateTable(ctx context.Context, table *domain.Table) error {
	return s.tableRepo.Update(ctx, table)
}

func (s *TableService) DeleteTable(ctx context.Context, id string) error {
	return s.tableRepo.Delete(ctx, id)
}

func (s *TableService) ListTables(ctx context.Context) ([]*domain.Table, error) {
	return s.tableRepo.List(ctx)
}

// CloseTable marks a table as closed once its bill has been paid. Closed
// tables are read-only (no more orders can be added) and become eligible
// for automatic deletion after the configured retention period.
func (s *TableService) CloseTable(ctx context.Context, id string) error {
	table, err := s.tableRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}
	if table.Closed {
		return domain.ErrTableAlreadyClosed
	}

	now := time.Now().UTC()
	table.Closed = true
	table.ClosedAt = &now
	return s.tableRepo.Update(ctx, table)
}

// ReopenTable undoes an accidental close.
func (s *TableService) ReopenTable(ctx context.Context, id string) error {
	table, err := s.tableRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	table.Closed = false
	table.ClosedAt = nil
	return s.tableRepo.Update(ctx, table)
}

// PurgeClosedTables permanently deletes tables that have been closed for
// longer than retention (cascading to their orders and order logs). It is
// meant to be called periodically by a background job.
func (s *TableService) PurgeClosedTables(ctx context.Context, retention time.Duration) (int64, error) {
	cutoff := time.Now().UTC().Add(-retention)
	return s.tableRepo.DeleteClosedBefore(ctx, cutoff)
}

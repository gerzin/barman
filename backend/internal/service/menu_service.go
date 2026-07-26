package service

import (
	"barman/internal/domain"
	"barman/internal/repository"
	"context"
)

type MenuService struct {
	menuSectionRepo repository.MenuSectionRepository
}

func NewMenuService(menuSectionRepo repository.MenuSectionRepository) *MenuService {
	return &MenuService{
		menuSectionRepo: menuSectionRepo,
	}
}

func (s *MenuService) CreateSection(ctx context.Context, section *domain.MenuSection) error {
	return s.menuSectionRepo.Create(ctx, section)
}

func (s *MenuService) GetSectionByID(ctx context.Context, id string) (*domain.MenuSection, error) {
	return s.menuSectionRepo.GetByID(ctx, id)
}

func (s *MenuService) UpdateSection(ctx context.Context, section *domain.MenuSection) error {
	return s.menuSectionRepo.Update(ctx, section)
}

func (s *MenuService) DeleteSection(ctx context.Context, id string) error {
	return s.menuSectionRepo.Delete(ctx, id)
}

func (s *MenuService) ListSections(ctx context.Context) ([]*domain.MenuSection, error) {
	return s.menuSectionRepo.List(ctx)
}

// GetMenu returns the full menu: every section with its products nested
// underneath, ready to be rendered by the frontend.
func (s *MenuService) GetMenu(ctx context.Context) ([]*domain.MenuSectionWithProducts, error) {
	return s.menuSectionRepo.GetMenu(ctx)
}

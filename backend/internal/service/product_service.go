package service

import (
	"barman/internal/domain"
	"barman/internal/repository"
	"context"
)

type ProductService struct {
	productRepo repository.ProductRepository
}

func NewProductService(productRepo repository.ProductRepository) *ProductService {
	return &ProductService{
		productRepo: productRepo,
	}
}

func (s *ProductService) CreateProduct(ctx context.Context, product *domain.Product) error {
	return s.productRepo.Create(ctx, product)
}

func (s *ProductService) GetProductByID(ctx context.Context, id string) (*domain.Product, error) {
	return s.productRepo.GetByID(ctx, id)
}

func (s *ProductService) UpdateProduct(ctx context.Context, product *domain.Product) error {
	return s.productRepo.Update(ctx, product)
}

func (s *ProductService) DeleteProduct(ctx context.Context, id string) error {
	return s.productRepo.Delete(ctx, id)
}

func (s *ProductService) ListProducts(ctx context.Context, limit, offset int) ([]*domain.Product, error) {
	return s.productRepo.List(ctx, limit, offset)
}

func (s *ProductService) SetProductAvailability(ctx context.Context, id string, available bool) error {
	product, err := s.productRepo.GetByID(ctx, id)
	if err != nil {
		return err
	}

	product.Available = available
	return s.productRepo.Update(ctx, product)
}

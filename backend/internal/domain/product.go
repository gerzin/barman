package domain

import (
	"errors"
	"time"
)

type Product struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Price       float64   `json:"price"`
	Available   bool      `json:"available"`
	SectionID   *string   `json:"section_id,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

var (
	ErrProductNotFound = errors.New("product not found")
	ErrInvalidPrice    = errors.New("invalid price")
)

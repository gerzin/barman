package domain

import (
	"errors"
	"time"
)

// MenuSection is a named group of products on the menu, e.g. "Food" or
// "Drinks". Sections are ordered by Position.
type MenuSection struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	Position    int       `json:"position"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// MenuSectionWithProducts is a menu section together with the products
// currently assigned to it. Used to render the full menu in one call.
type MenuSectionWithProducts struct {
	MenuSection
	Products []*Product `json:"products"`
}

var (
	ErrMenuSectionNotFound      = errors.New("menu section not found")
	ErrDuplicateMenuSectionName = errors.New("menu section name already exists")
)

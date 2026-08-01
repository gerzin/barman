package domain

import (
	"errors"
	"time"
)

// Table represents a physical table in the bar that collects the orders
// placed by its customers until the bill is paid and the table is closed.
// QRToken identifies the table in the public, unauthenticated QR endpoints
// - it is intentionally separate from ID so it can be rotated without
// changing the table's identity.
type Table struct {
	ID        string     `json:"id"`
	Name      string     `json:"name"`
	Notes     string     `json:"notes"`
	QRToken   string     `json:"qr_token"`
	Closed    bool       `json:"closed"`
	ClosedAt  *time.Time `json:"closed_at,omitempty"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

// TableWithOrders bundles a table with its current orders and the total
// amount due. This is what staff dashboards and the customer QR page both
// need to render the bill.
type TableWithOrders struct {
	Table
	Orders []*Order `json:"orders"`
	Total  float64  `json:"total"`
}

var (
	ErrTableNotFound      = errors.New("table not found")
	ErrDuplicateTableName = errors.New("table name already exists")
	ErrTableAlreadyClosed = errors.New("table is already closed")
	ErrTableClosed        = errors.New("table is closed")
)

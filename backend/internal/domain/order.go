package domain

import (
	"errors"
	"time"
)

// OrderAction identifies which operation an OrderLog entry records.
type OrderAction string

const (
	OrderActionCreated OrderAction = "created"
	OrderActionUpdated OrderAction = "updated"
	OrderActionRemoved OrderAction = "removed"
)

// Order is a single line item on a table's bill, e.g. "2x Coke". ProductName
// and UnitPrice are snapshotted at creation time so that later changes to
// the product (price change, rename, deletion) never alter an already
// placed order.
type Order struct {
	ID          string    `json:"id"`
	TableID     string    `json:"table_id"`
	ProductID   *string   `json:"product_id,omitempty"`
	ProductName string    `json:"product_name"`
	UnitPrice   float64   `json:"unit_price"`
	Quantity    int       `json:"quantity"`
	Note        string    `json:"note,omitempty"`
	CreatedBy   *string   `json:"created_by,omitempty"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

// Total returns the line total for this order (unit price * quantity).
func (o *Order) Total() float64 {
	return o.UnitPrice * float64(o.Quantity)
}

// OrderLog is an immutable audit entry recording who changed a table's
// orders, what the change was, and when. PerformedBy is nil when the order
// was placed by a customer themselves through the QR self-order page.
type OrderLog struct {
	ID          string      `json:"id"`
	OrderID     *string     `json:"order_id,omitempty"`
	TableID     string      `json:"table_id"`
	Action      OrderAction `json:"action"`
	ProductName string      `json:"product_name"`
	Quantity    int         `json:"quantity"`
	UnitPrice   float64     `json:"unit_price"`
	Note        string      `json:"note,omitempty"`
	PerformedBy *string     `json:"performed_by,omitempty"`
	PerformedAt time.Time   `json:"performed_at"`
}

var (
	ErrOrderNotFound   = errors.New("order not found")
	ErrInvalidQuantity = errors.New("quantity must be greater than zero")
)

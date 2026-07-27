CREATE TABLE IF NOT EXISTS order_logs (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id     UUID REFERENCES orders(id) ON DELETE SET NULL,
    table_id     UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
    action       VARCHAR(20) NOT NULL CHECK (action IN ('created', 'updated', 'removed')),
    product_name VARCHAR(255) NOT NULL,
    quantity     INTEGER NOT NULL,
    unit_price   NUMERIC(10,2) NOT NULL,
    note         TEXT,
    performed_by UUID REFERENCES users(id) ON DELETE SET NULL,
    performed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_order_logs_table_id ON order_logs(table_id);
CREATE INDEX idx_order_logs_order_id ON order_logs(order_id);

COMMENT ON TABLE order_logs IS 'Immutable audit trail of add/update/remove operations performed on table orders';

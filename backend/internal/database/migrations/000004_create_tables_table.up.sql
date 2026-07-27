CREATE TABLE IF NOT EXISTS tables (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name       VARCHAR(100) NOT NULL UNIQUE,
    qr_token   UUID NOT NULL DEFAULT gen_random_uuid(),
    closed     BOOLEAN NOT NULL DEFAULT false,
    closed_at  TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_tables_qr_token ON tables(qr_token);
CREATE INDEX idx_tables_closed_closed_at ON tables(closed, closed_at);

CREATE TRIGGER update_tables_updated_at
    BEFORE UPDATE ON tables
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE tables IS 'Physical bar tables that collect customer orders until the bill is paid';

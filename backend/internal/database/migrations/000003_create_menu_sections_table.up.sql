CREATE TABLE IF NOT EXISTS menu_sections (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    position    INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER update_menu_sections_updated_at
    BEFORE UPDATE ON menu_sections
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE products ADD COLUMN section_id UUID REFERENCES menu_sections(id) ON DELETE SET NULL;
CREATE INDEX idx_products_section_id ON products(section_id);

COMMENT ON TABLE menu_sections IS 'Menu sections grouping products (e.g. Food, Drinks)';

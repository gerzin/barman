DROP INDEX IF EXISTS idx_products_section_id;
ALTER TABLE products DROP COLUMN IF EXISTS section_id;
DROP TRIGGER IF EXISTS update_menu_sections_updated_at ON menu_sections;
DROP TABLE IF EXISTS menu_sections;

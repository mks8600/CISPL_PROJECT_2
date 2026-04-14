CREATE TABLE IF NOT EXISTS vendor_film_sizes (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id   UUID REFERENCES vendors(id) ON DELETE CASCADE NOT NULL,
    size_label  VARCHAR(100) NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(vendor_id, size_label)
);
CREATE INDEX IF NOT EXISTS idx_vendor_film_sizes_vendor ON vendor_film_sizes(vendor_id);

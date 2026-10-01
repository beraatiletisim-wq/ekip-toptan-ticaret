
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  created_at TEXT NOT NULL,
  type TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  brand TEXT,
  model TEXT,
  item TEXT NOT NULL,
  note TEXT,
  appointment INTEGER DEFAULT 0,
  appointment_date TEXT,
  appointment_time TEXT,
  city TEXT,
  district TEXT,
  neighborhood TEXT,
  postal_code TEXT,
  address TEXT,
  payment TEXT,
  receipt_key TEXT,
  status TEXT DEFAULT 'Yeni'
);

CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

INSERT OR IGNORE INTO settings(key,value) VALUES
('iban','IBAN henüz tanımlanmadı.');

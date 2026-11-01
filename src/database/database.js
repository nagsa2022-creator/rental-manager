import * as SQLite from 'expo-sqlite';

let db = null;

export async function getDatabase() {
  if (db) return db;
  db = await SQLite.openDatabaseAsync('rentalmanager_v2.db');
  await db.execAsync('PRAGMA journal_mode=WAL;');
  await db.execAsync('PRAGMA foreign_keys=ON;');
  await initTables();
  await seedCategories();
  return db;
}

async function initTables() {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS owners (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      upi_id TEXT,
      bank_info TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'flat',
      address TEXT,
      has_floors INTEGER DEFAULT 0,
      main_meter_name TEXT DEFAULT 'Main Meter',
      electricity_rate REAL DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS floors (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      has_submeter INTEGER DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS rooms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      floor_id INTEGER,
      name TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0,
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
      FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS tenants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      room_id INTEGER,
      name TEXT NOT NULL,
      phone TEXT,
      monthly_rent REAL DEFAULT 0,
      rent_due_day INTEGER DEFAULT 1,
      move_in_date TEXT,
      is_active INTEGER DEFAULT 1,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
      FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS security_deposits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      amount_collected REAL DEFAULT 0,
      date_collected TEXT,
      amount_refunded REAL DEFAULT 0,
      date_refunded TEXT,
      deduction_reason TEXT,
      status TEXT DEFAULT 'held',
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS monthly_bills (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      month INTEGER NOT NULL,
      year INTEGER NOT NULL,
      main_meter_opening REAL DEFAULT 0,
      main_meter_closing REAL DEFAULT 0,
      main_meter_bill REAL DEFAULT 0,
      water_total REAL DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      UNIQUE(property_id, month, year),
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS submeter_readings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      monthly_bill_id INTEGER NOT NULL,
      floor_id INTEGER NOT NULL,
      opening_reading REAL DEFAULT 0,
      closing_reading REAL DEFAULT 0,
      units_used REAL DEFAULT 0,
      FOREIGN KEY (monthly_bill_id) REFERENCES monthly_bills(id) ON DELETE CASCADE,
      FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tenant_dues (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      monthly_bill_id INTEGER NOT NULL,
      tenant_id INTEGER NOT NULL,
      rent REAL DEFAULT 0,
      electricity_share REAL DEFAULT 0,
      total_due REAL DEFAULT 0,
      amount_received REAL DEFAULT 0,
      balance REAL DEFAULT 0,
      payment_date TEXT,
      is_advance INTEGER DEFAULT 0,
      advance_for_month INTEGER,
      advance_for_year INTEGER,
      status TEXT DEFAULT 'pending',
      FOREIGN KEY (monthly_bill_id) REFERENCES monthly_bills(id) ON DELETE CASCADE,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS owner_payouts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      monthly_bill_id INTEGER NOT NULL,
      owner_id INTEGER NOT NULL,
      total_rent REAL DEFAULT 0,
      electricity_paid REAL DEFAULT 0,
      water_paid REAL DEFAULT 0,
      other_expenses REAL DEFAULT 0,
      net_payout REAL DEFAULT 0,
      is_paid INTEGER DEFAULT 0,
      payment_date TEXT,
      notes TEXT,
      FOREIGN KEY (monthly_bill_id) REFERENCES monthly_bills(id) ON DELETE CASCADE,
      FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      property_id INTEGER NOT NULL,
      owner_id INTEGER NOT NULL,
      date TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      amount REAL NOT NULL,
      paid_by TEXT,
      is_reimbursed INTEGER DEFAULT 0,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE,
      FOREIGN KEY (owner_id) REFERENCES owners(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS expense_categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      is_custom INTEGER DEFAULT 0
    );
  `);
}

async function seedCategories() {
  const count = await db.getFirstAsync('SELECT COUNT(*) as c FROM expense_categories');
  if (count.c === 0) {
    const cats = ['Plumbing','Electrical','Painting','Carpentry','Cleaning',
                  'Security','Insurance','Tax','Society Charges','Other'];
    for (const c of cats) {
      await db.runAsync('INSERT OR IGNORE INTO expense_categories (name, is_custom) VALUES (?, 0)', c);
    }
  }
}

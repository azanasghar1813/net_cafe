const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'netcafe.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // 1. Settings Table
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      shop_name TEXT,
      address TEXT,
      phone TEXT,
      owner_name TEXT,
      receipt_footer TEXT,
      currency TEXT,
      printer_settings TEXT,
      admin_password TEXT DEFAULT 'admin'
    )
  `);

  // Initialize default settings if empty
  db.get("SELECT COUNT(*) AS count FROM settings", (err, row) => {
    if (row && row.count === 0) {
      db.run(`
        INSERT INTO settings (shop_name, address, phone, owner_name, receipt_footer, currency, printer_settings)
        VALUES ('GREEN WAY NET ZONE', 'SHOP NO. 07 WAHLA MARKET LAYYAH RD. CHOWK AZAM', '0349 1726553 / 0302 2080486 / 0606 381963', 'Sohail', 'FOR VISITING OUR GREEN WAY NET ZONE\\nwww.travelwithsohail.site', 'Rs.', 'Default Printer')
      `);
    }
  });

  // 2. Services Table
  db.run(`
    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT,
      name TEXT,
      price REAL
    )
  `);

  // Initialize default services if empty
  db.get("SELECT COUNT(*) AS count FROM services", (err, row) => {
    if (row && row.count === 0) {
      const defaultServices = [
        ['Gaming', '1 Hour', 120],
        ['Gaming', '2 Hour', 240],
        ['Gaming', '5 Hour', 500],
        ['Gaming', '5.5 Hour', 550],
        ['Gaming', '10 Hour', 1000],
        ['Online Services', 'JOBS APPLY', 100],
        ['Online Services', 'UNIVERSITY APPLY', 100],
        ['Online Services', 'EDUCATION', 100],
        ['Online Services', 'NADRA / CNIC', 100],
        ['Online Services', 'DRIVING LICENSE', 100],
        ['Online Services', 'FBR TAX', 100],
        ['Online Services', 'VEHICLE / EXCISE', 100],
        ['Online Services', 'BANKING / PAYMENTS', 100],
        ['Online Services', 'AGRICULTURE / FARMERS', 100],
        ['Online Services', 'HEALTH / COVID CARD', 100],
        ['Online Services', 'CERTIFICATES / DOCUMENTS', 100],
        ['Online Services', 'WAPDA BILL', 100],
        ['Online Services', 'PUBG UC', 100],
        ['Online Services', 'FREE FIRE DIAMOND', 100],
        ['Online Services', 'NETFLIX', 100],
        ['Online Services', 'AMAZON', 100]
      ];
      const stmt = db.prepare("INSERT INTO services (category, name, price) VALUES (?, ?, ?)");
      defaultServices.forEach(s => stmt.run(s));
      stmt.finalize();
    }
  });

  // 3. Transactions Table (Updated for Phase 2)
  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATETIME DEFAULT CURRENT_TIMESTAMP,
      type TEXT, -- 'SALE', 'PAYMENT', 'EXPENSE'
      category TEXT,
      amount REAL,
      description TEXT,
      customer_id INTEGER,
      paid_amount REAL,
      discount REAL,
      status TEXT DEFAULT 'ACTIVE', -- 'ACTIVE', 'VOIDED'
      void_reason TEXT,
      FOREIGN KEY(customer_id) REFERENCES customers(id)
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS cash_register (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATE DEFAULT (date('now', 'localtime')),
      opening_cash REAL DEFAULT 0,
      expected_cash REAL DEFAULT 0,
      actual_cash REAL DEFAULT 0,
      difference REAL DEFAULT 0,
      status TEXT DEFAULT 'OPEN' -- 'OPEN', 'CLOSED'
    )
  `);

  // Attempt to add new columns to transactions if they don't exist (for existing Phase 1 DB)
  db.run("ALTER TABLE transactions ADD COLUMN customer_id INTEGER", (err) => {});
  db.run("ALTER TABLE transactions ADD COLUMN paid_amount REAL", (err) => {});
  db.run("ALTER TABLE transactions ADD COLUMN discount REAL", (err) => {});

  // 5. Customers Table
  db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      phone TEXT,
      cnic TEXT,
      address TEXT,
      balance REAL DEFAULT 0,
      total_spent REAL DEFAULT 0,
      last_visit DATETIME
    )
  `);

  // 6. Gaming Sessions Table
  db.run(`
    CREATE TABLE IF NOT EXISTS gaming_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pc_id INTEGER,
      customer_id INTEGER,
      package_name TEXT,
      start_time DATETIME,
      end_time DATETIME,
      amount REAL,
      status TEXT, -- 'ACTIVE', 'FINISHED', 'CANCELLED'
      category TEXT
    )
  `);
  db.run("ALTER TABLE gaming_sessions ADD COLUMN category TEXT", (err) => {});

  // 4. Gaming PCs Table
  db.run(`
    CREATE TABLE IF NOT EXISTS gaming_pcs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      pc_number TEXT,
      status TEXT -- 'AVAILABLE', 'IN_USE', 'OFFLINE'
    )
  `);

  // Initialize default PCs if empty
  db.get("SELECT COUNT(*) AS count FROM gaming_pcs", (err, row) => {
    if (row && row.count === 0) {
      const stmt = db.prepare("INSERT INTO gaming_pcs (pc_number, status) VALUES (?, ?)");
      for (let i = 1; i <= 15; i++) {
        stmt.run([`PC-${i.toString().padStart(2, '0')}`, 'AVAILABLE']);
      }
      stmt.finalize();
    }
  });
});

module.exports = db;

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const db = require('./database');

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

// --- MIDDLEWARE ---
// Password authentication has been completely disabled as requested
app.use((req, res, next) => {
  next();
});

// --- PHASE 5: AUTH & GLOBAL SEARCH ---
app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  db.get("SELECT admin_password FROM settings LIMIT 1", (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    const bcrypt = require('bcryptjs');
    if (row && (row.admin_password === password || (row.admin_password.startsWith('$2') && bcrypt.compareSync(password, row.admin_password)))) {
      res.json({ success: true, token: 'admin-token' });
    } else {
      res.status(401).json({ error: 'Invalid password' });
    }
  });
});

app.get('/api/search', (req, res) => {
  const q = req.query.q ? req.query.q.toLowerCase() : '';
  if (!q) return res.json({ customers: [], transactions: [] });
  
  db.serialize(() => {
    const results = {};
    db.all("SELECT * FROM customers WHERE LOWER(name) LIKE ? OR phone LIKE ? OR cnic LIKE ?", [`%${q}%`, `%${q}%`, `%${q}%`], (err, cust) => {
      results.customers = cust || [];
      db.all(`
        SELECT t.*, c.name as customer_name 
        FROM transactions t 
        LEFT JOIN customers c ON t.customer_id = c.id
        WHERE t.id LIKE ? OR LOWER(c.name) LIKE ? OR LOWER(t.description) LIKE ?
        ORDER BY t.date DESC LIMIT 20
      `, [`%${q}%`, `%${q}%`, `%${q}%`], (err, trans) => {
        results.transactions = trans || [];
        res.json(results);
      });
    });
  });
});


// --- SETTINGS API ---
app.get('/api/settings', (req, res) => {
  db.get("SELECT * FROM settings LIMIT 1", (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || {});
  });
});

app.put('/api/settings', (req, res) => {
  const { shop_name, address, phone, owner_name, receipt_footer, currency, printer_settings, admin_password } = req.body;
  
  if (admin_password) {
    const bcrypt = require('bcryptjs');
    const hash = bcrypt.hashSync(admin_password, 10);
    const stmt = db.prepare(`
      UPDATE settings SET 
        shop_name = ?, address = ?, phone = ?, owner_name = ?, receipt_footer = ?, currency = ?, printer_settings = ?, admin_password = ?
      WHERE id = (SELECT id FROM settings LIMIT 1)
    `);
    stmt.run([shop_name, address, phone, owner_name, receipt_footer, currency, printer_settings, hash], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, message: "Settings and password updated" });
    });
    stmt.finalize();
  } else {
    const stmt = db.prepare(`
      UPDATE settings SET 
        shop_name = ?, address = ?, phone = ?, owner_name = ?, receipt_footer = ?, currency = ?, printer_settings = ?
      WHERE id = (SELECT id FROM settings LIMIT 1)
    `);
    stmt.run([shop_name, address, phone, owner_name, receipt_footer, currency, printer_settings], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, message: "Settings updated" });
    });
    stmt.finalize();
  }
});

// --- SERVICES API ---
app.get('/api/services', (req, res) => {
  db.all("SELECT * FROM services", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.put('/api/services/:id', (req, res) => {
  const { price, name, category } = req.body;
  db.run("UPDATE services SET price = ?, name = ?, category = ? WHERE id = ?", [price, name, category, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.post('/api/services', (req, res) => {
  const { price, name, category } = req.body;
  db.run("INSERT INTO services (category, name, price) VALUES (?, ?, ?)", [category, name, price], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, id: this.lastID });
  });
});

app.delete('/api/services/:id', (req, res) => {
  db.run("DELETE FROM services WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// --- TRANSACTIONS API ---
app.post('/api/transactions', (req, res) => {
  const { type, category, amount, description } = req.body;
  db.run("INSERT INTO transactions (type, category, amount, description) VALUES (?, ?, ?, ?)", [type, category, amount, description], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, id: this.lastID });
  });
});

// --- GAMING PCs API ---
app.put('/api/gaming-pcs/:id', (req, res) => {
  const { status } = req.body;
  db.run("UPDATE gaming_pcs SET status = ? WHERE id = ?", [status, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

// --- BACKUP & RESTORE API ---
app.get('/api/backup', (req, res) => {
  const file = path.resolve(__dirname, 'netcafe.sqlite');
  res.download(file, `backup_${new Date().toISOString().split('T')[0]}.sqlite`);
});

const multer = require('multer');
const upload = multer({ dest: 'uploads/' });

app.post('/api/restore', upload.single('dbfile'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  
  const targetPath = path.resolve(__dirname, 'netcafe.sqlite');
  
  // Verify SQLite header
  const header = fs.readFileSync(req.file.path, { encoding: null });
  if (header.length < 16 || header.toString('utf8', 0, 15) !== 'SQLite format 3') {
    fs.unlink(req.file.path, () => {});
    return res.status(400).json({ error: "Invalid SQLite file" });
  }

  // Auto-copy to backup
  const backupPath = path.resolve(__dirname, `backup_before_restore_${Date.now()}.sqlite`);
  fs.copyFile(targetPath, backupPath, (err) => {
    if (err) return res.status(500).json({ error: "Failed to create backup: " + err.message });
    fs.copyFile(req.file.path, targetPath, (err) => {
      if (err) return res.status(500).json({ error: err.message });
      fs.unlink(req.file.path, () => {}); // cleanup temp file
      res.json({ success: true, message: "Database restored successfully. Please restart the backend." });
    });
  });
});

app.get('/api/transactions/today', (req, res) => {
  db.all(`SELECT t.*, c.name as customer_name FROM transactions t
          LEFT JOIN customers c ON t.customer_id = c.id
          WHERE date(t.date,'localtime') = date('now','localtime')
          ORDER BY t.date DESC`, (err, rows) => res.json(rows || []));
});

// --- CUSTOMERS API ---
app.get('/api/customers', (req, res) => {
  db.all("SELECT * FROM customers ORDER BY name", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/customers', (req, res) => {
  const { name, phone, cnic, address } = req.body;
  db.run("INSERT INTO customers (name, phone, cnic, address, balance, total_spent, last_visit) VALUES (?, ?, ?, ?, 0, 0, ?)", 
    [name, phone, cnic, address, new Date().toISOString()], 
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
  });
});

app.delete('/api/customers/:id', (req, res) => {
  db.run("DELETE FROM customers WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.put('/api/customers/:id', (req, res) => {
  const { name, phone, cnic, address } = req.body;
  db.run("UPDATE customers SET name = ?, phone = ?, cnic = ?, address = ? WHERE id = ?", 
    [name, phone, cnic, address, req.params.id], 
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true });
  });
});

app.get('/api/customers/:id/history', (req, res) => {
  db.all("SELECT * FROM transactions WHERE customer_id = ? AND status = 'ACTIVE' ORDER BY date DESC", [req.params.id], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/customers/:id/pay', (req, res) => {
  const { amount } = req.body;
  
  db.get("SELECT id FROM customers WHERE id = ?", [req.params.id], (err, row) => {
    if (err || !row) return res.status(404).json({ error: "Customer not found" });
    
    db.run("UPDATE customers SET balance = balance - ? WHERE id = ?", [amount, req.params.id], function(err) {
      if (err) return res.status(500).json({ error: err.message });
      
      // Record payment transaction
      db.run("INSERT INTO transactions (type, category, amount, description, customer_id, paid_amount) VALUES (?, ?, ?, ?, ?, ?)", 
        ['PAYMENT', 'Udhaar Payment', amount, 'Udhaar Payment Received', req.params.id, amount]);
        
      res.json({ success: true });
    });
  });
});

// --- GAMING SESSIONS API ---
app.get('/api/gaming-sessions', (req, res) => {
  db.all(`
    SELECT gs.*, c.name as customer_name, p.pc_number 
    FROM gaming_sessions gs 
    LEFT JOIN customers c ON gs.customer_id = c.id
    LEFT JOIN gaming_pcs p ON gs.pc_id = p.id
    WHERE gs.status = 'ACTIVE'
  `, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/gaming-sessions/start', (req, res) => {
  const { pc_id, customer_id, package_name, amount, duration_minutes, category } = req.body;
  const sessionCategory = category || 'Gaming Revenue';
  
  const start_time = new Date();
  let end_time_str = null;
  if (duration_minutes) {
    const end_time = new Date(start_time.getTime() + duration_minutes * 60000);
    end_time_str = end_time.toISOString();
  }
  
  db.get("SELECT status FROM gaming_pcs WHERE id = ?", [pc_id], (err, pc) => {
    if (err || !pc || pc.status !== 'AVAILABLE') return res.status(400).json({ error: "PC is not available" });
    
    db.serialize(() => {
      db.run("INSERT INTO gaming_sessions (pc_id, customer_id, package_name, start_time, end_time, amount, status, category) VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?)", 
        [pc_id, customer_id || null, package_name, start_time.toISOString(), end_time_str, amount || 0, sessionCategory], function(err) {
          if (err) return res.status(500).json({ error: err.message });
          
          const sessionId = this.lastID;
          db.run("UPDATE gaming_pcs SET status = 'IN_USE' WHERE id = ?", [pc_id]);
          if (customer_id) {
            db.run("UPDATE customers SET last_visit = ? WHERE id = ?", [start_time.toISOString(), customer_id]);
          }
          
          res.json({ success: true, id: sessionId });
      });
    });
  });
});

app.put('/api/gaming-sessions/:id/add-time', (req, res) => {
  const { additional_minutes, additional_amount } = req.body;
  
  db.get("SELECT end_time, amount FROM gaming_sessions WHERE id = ? AND status = 'ACTIVE'", [req.params.id], (err, row) => {
    if (err || !row) return res.status(500).json({ error: err ? err.message : 'Not found' });
    
    const new_end_time = new Date(new Date(row.end_time).getTime() + additional_minutes * 60000);
    const new_amount = row.amount + additional_amount;
    
    db.run("UPDATE gaming_sessions SET end_time = ?, amount = ? WHERE id = ?", 
      [new_end_time.toISOString(), new_amount, req.params.id], function(err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true });
    });
  });
});

app.post('/api/gaming-sessions/:id/stop', (req, res) => {
  const { paid_amount, discount } = req.body;
  
  db.get("SELECT * FROM gaming_sessions WHERE id = ? AND status = 'ACTIVE'", [req.params.id], (err, session) => {
    if (err || !session) return res.status(500).json({ error: err ? err.message : 'Not found' });
    
    const finalAmount = session.amount - discount;
    const remainingBalance = finalAmount - paid_amount;
    const category = session.category || 'Gaming Revenue';
    
    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      // 1. Update session status
      db.run("UPDATE gaming_sessions SET status = 'FINISHED' WHERE id = ? AND status = 'ACTIVE'", [session.id], function(err) {
        if (err || this.changes === 0) {
          db.run("ROLLBACK");
          return res.status(400).json({ error: "Session already stopped or failed" });
        }
      
        // 2. Free up PC
        db.run("UPDATE gaming_pcs SET status = 'AVAILABLE' WHERE id = ?", [session.pc_id], function(err) {
          if (err) { db.run("ROLLBACK"); return res.status(500).json({error: err.message}); }
          
          // 3. Record transaction
          db.run("INSERT INTO transactions (type, category, amount, description, customer_id, paid_amount, discount) VALUES (?, ?, ?, ?, ?, ?, ?)", 
            ['SALE', category, finalAmount, `Gaming Session: ${session.package_name}`, session.customer_id, paid_amount, discount], function(err) {
              if (err) { db.run("ROLLBACK"); return res.status(500).json({error: err.message}); }
              const transactionId = this.lastID;
              
              // 4. Update Udhaar
              if (session.customer_id) {
                db.run("UPDATE customers SET balance = balance + ?, total_spent = total_spent + ? WHERE id = ?", 
                  [remainingBalance, paid_amount, session.customer_id], function(err) {
                    if (err) { db.run("ROLLBACK"); return res.status(500).json({error: err.message}); }
                    db.run("COMMIT");
                    res.json({ 
                      success: true, 
                      remainingBalance, 
                      transactionId, 
                      total: finalAmount,
                      description: `Gaming Session: ${session.package_name}`
                    });
                });
              } else {
                db.run("COMMIT");
                res.json({ 
                  success: true, 
                  remainingBalance, 
                  transactionId, 
                  total: finalAmount,
                  description: `Gaming Session: ${session.package_name}`
                });
              }
          });
        });
      });
    });
  });
});

// --- UNIFIED BILLING API ---
app.post('/api/bill', (req, res) => {
  const { customer_id, category, description, total_amount, paid_amount, discount } = req.body;
  
  db.serialize(() => {
    db.run("BEGIN TRANSACTION");
    // 1. Record transaction
    db.run("INSERT INTO transactions (type, category, amount, description, customer_id, paid_amount, discount) VALUES (?, ?, ?, ?, ?, ?, ?)", 
      ['SALE', category, total_amount, description, customer_id || null, paid_amount, discount], function(err) {
        if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: err.message }); }
        const transactionId = this.lastID;
        
        // 2. Update Udhaar if customer exists
        if (customer_id) {
          const remainingBalance = total_amount - paid_amount;
          db.run("UPDATE customers SET balance = balance + ?, total_spent = total_spent + ? WHERE id = ?", 
            [remainingBalance, paid_amount, customer_id], function(err) {
              if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: err.message }); }
              db.run("COMMIT");
              res.json({ success: true, transactionId });
          });
        } else {
          db.run("COMMIT");
          res.json({ success: true, transactionId });
        }
    });
  });
});

// --- PHASE 4: CASH REGISTER API ---
app.get('/api/cash-register/today', (req, res) => {
  db.get("SELECT * FROM cash_register WHERE date = date('now', 'localtime')", (err, row) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(row || { status: 'NONE' });
  });
});

app.post('/api/cash-register/open', (req, res) => {
  const { opening_cash } = req.body;
  db.run("INSERT INTO cash_register (opening_cash) VALUES (?)", [opening_cash], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, id: this.lastID });
  });
});

app.post('/api/cash-register/close', (req, res) => {
  const { actual_cash } = req.body;
  
  // Calculate expected cash: Opening Cash + Total Cash Received (Sales paid amount + Payments) - Total Expenses
  // We need to look at transactions for today
  db.get("SELECT opening_cash FROM cash_register WHERE date = date('now', 'localtime') AND status = 'OPEN'", (err, reg) => {
    if (err || !reg) return res.status(500).json({ error: "No open register found for today." });
    
    db.get(`
      SELECT 
        SUM(CASE WHEN type = 'SALE' OR type = 'PAYMENT' THEN paid_amount ELSE 0 END) as total_in,
        SUM(CASE WHEN type = 'EXPENSE' THEN amount ELSE 0 END) as total_out
      FROM transactions 
      WHERE date(date, 'localtime') = date('now', 'localtime') AND status = 'ACTIVE'
    `, (err, trans) => {
      if (err) return res.status(500).json({ error: err.message });
      
      const expected_cash = reg.opening_cash + (trans.total_in || 0) - (trans.total_out || 0);
      const difference = actual_cash - expected_cash;
      
      db.run(`UPDATE cash_register SET expected_cash = ?, actual_cash = ?, difference = ?, status = 'CLOSED' 
              WHERE date = date('now', 'localtime') AND status = 'OPEN'`,
        [expected_cash, actual_cash, difference], function(err) {
          if (err) return res.status(500).json({ error: err.message });
          res.json({ success: true, expected_cash, difference });
        }
      );
    });
  });
});

// --- EXPENSES API ---
app.post('/api/expenses', (req, res) => {
  const { category, description, amount } = req.body;
  db.run("INSERT INTO transactions (type, category, amount, description, paid_amount, discount) VALUES ('EXPENSE', ?, ?, ?, ?, 0)",
    [category, amount, description, amount], function(err) { // paid_amount = amount for expenses to affect cash
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: this.lastID });
  });
});

app.get('/api/expenses/today', (req, res) => {
  db.all("SELECT * FROM transactions WHERE type = 'EXPENSE' AND status = 'ACTIVE' AND date(date, 'localtime') = date('now', 'localtime') ORDER BY id DESC", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// --- REPORTS API ---
app.get('/api/reports/monthly', (req, res) => {
  const { month } = req.query; // YYYY-MM
  
  db.all(`
    SELECT type, category, amount, paid_amount 
    FROM transactions 
    WHERE strftime('%Y-%m', datetime(date, 'localtime')) = ? AND status = 'ACTIVE'
  `, [month], (err, transactions) => {
    if (err) return res.status(500).json({ error: err.message });
    
    let totalSales = 0;
    let totalExpenses = 0;
    let udhaarCollected = 0;
    let udhaarGiven = 0;
    const categoryRevenue = {};

    transactions.forEach(t => {
      if (t.type === 'SALE') {
        totalSales += t.amount;
        udhaarGiven += (t.amount - (t.paid_amount || 0));
        categoryRevenue[t.category] = (categoryRevenue[t.category] || 0) + t.amount;
      } else if (t.type === 'EXPENSE') {
        totalExpenses += t.amount;
      } else if (t.type === 'PAYMENT') {
        udhaarCollected += t.paid_amount;
      }
    });

    const netProfit = totalSales - totalExpenses;

    // Get unique customers count
    db.get(`SELECT COUNT(DISTINCT customer_id) as c FROM transactions WHERE strftime('%Y-%m', datetime(date, 'localtime')) = ? AND status = 'ACTIVE' AND customer_id IS NOT NULL`, [month], (err, rowCust) => {
      db.get(`SELECT COUNT(*) as c FROM transactions WHERE strftime('%Y-%m', datetime(date, 'localtime')) = ? AND status = 'ACTIVE' AND type = 'SALE'`, [month], (err, rowTrans) => {
        res.json({
          totalSales,
          totalExpenses,
          netProfit,
          udhaarGiven,
          udhaarCollected,
          categoryRevenue,
          totalCustomers: rowCust ? rowCust.c : 0,
          totalTransactions: rowTrans ? rowTrans.c : 0
        });
      });
    });
  });
});

app.get('/api/reports/custom', (req, res) => {
  const { start, end } = req.query; // YYYY-MM-DD
  
  db.all(`
    SELECT type, category, amount, paid_amount 
    FROM transactions 
    WHERE date(date, 'localtime') >= ? AND date(date, 'localtime') <= ? AND status = 'ACTIVE'
  `, [start, end], (err, transactions) => {
    if (err) return res.status(500).json({ error: err.message });
    
    let totalSales = 0;
    let totalExpenses = 0;
    let udhaarCollected = 0;
    let udhaarGiven = 0;
    const categoryRevenue = {};

    transactions.forEach(t => {
      if (t.type === 'SALE') {
        totalSales += t.amount;
        udhaarGiven += (t.amount - (t.paid_amount || 0));
        categoryRevenue[t.category] = (categoryRevenue[t.category] || 0) + t.amount;
      } else if (t.type === 'EXPENSE') {
        totalExpenses += t.amount;
      } else if (t.type === 'PAYMENT') {
        udhaarCollected += t.paid_amount;
      }
    });

    const netProfit = totalSales - totalExpenses;

    db.get(`SELECT COUNT(DISTINCT customer_id) as c FROM transactions WHERE date(date, 'localtime') >= ? AND date(date, 'localtime') <= ? AND status = 'ACTIVE' AND customer_id IS NOT NULL`, [start, end], (err, rowCust) => {
      db.get(`SELECT COUNT(*) as c FROM transactions WHERE date(date, 'localtime') >= ? AND date(date, 'localtime') <= ? AND status = 'ACTIVE' AND type = 'SALE'`, [start, end], (err, rowTrans) => {
        res.json({
          totalSales,
          totalExpenses,
          netProfit,
          udhaarGiven,
          udhaarCollected,
          categoryRevenue,
          totalCustomers: rowCust ? rowCust.c : 0,
          totalTransactions: rowTrans ? rowTrans.c : 0
        });
      });
    });
  });
});

app.get('/api/dashboard', (req, res) => {
  db.serialize(() => {
    let dashboardData = {
      todaySales: 0,
      expenses: 0,
      netProfit: 0,
      revenueByCategory: {},
      pcs: [],
      pcsInUse: 0,
      totalCustomers: 0,
      transactionsCount: 0
    };

    db.all("SELECT * FROM transactions WHERE date(date, 'localtime') = date('now', 'localtime') AND status = 'ACTIVE'", (err, transactions) => {
      if (!err && transactions) {
        dashboardData.transactionsCount = transactions.length;
        transactions.forEach(t => {
          if (t.type === 'SALE') {
            dashboardData.todaySales += t.amount;
            dashboardData.revenueByCategory[t.category] = (dashboardData.revenueByCategory[t.category] || 0) + t.amount;
          } else if (t.type === 'EXPENSE') {
            dashboardData.expenses += t.amount;
          }
        });
        dashboardData.netProfit = dashboardData.todaySales - dashboardData.expenses;
      }

      db.all("SELECT * FROM gaming_pcs", (err, pcs) => {
        if (!err && pcs) {
          dashboardData.pcs = pcs;
          dashboardData.pcsInUse = pcs.filter(p => p.status === 'IN_USE').length;
        }

        db.get("SELECT COUNT(*) as count FROM customers", (err, row) => {
          if (!err && row) {
            dashboardData.totalCustomers = row.count;
          }

          res.json(dashboardData);
        });
      });
    });
  });
});

// --- TRANSACTIONS API (PHASE 5) ---
app.get('/api/transactions', (req, res) => {
  db.all(`
    SELECT t.*, c.name as customer_name 
    FROM transactions t 
    LEFT JOIN customers c ON t.customer_id = c.id
    ORDER BY t.date DESC LIMIT 100
  `, (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/transactions/:id/void', (req, res) => {
  const { reason } = req.body;
  const transactionId = req.params.id;

  db.get("SELECT * FROM transactions WHERE id = ?", [transactionId], (err, t) => {
    if (err || !t) return res.status(500).json({ error: "Transaction not found" });
    if (t.status === 'VOIDED') return res.status(400).json({ error: "Already voided" });

    db.serialize(() => {
      db.run("BEGIN TRANSACTION");
      // Void the transaction
      db.run("UPDATE transactions SET status = 'VOIDED', void_reason = ? WHERE id = ?", [reason, transactionId], function(err) {
        if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: err.message }); }
        
        // Reverse Customer Udhaar/Total Spent if it was a SALE or PAYMENT
        if (t.customer_id) {
          if (t.type === 'SALE') {
            // A sale increased total_spent by 'amount' and balance by (amount - paid_amount)
            const remaining = t.amount - (t.paid_amount || 0);
            db.run("UPDATE customers SET balance = balance - ?, total_spent = total_spent - ? WHERE id = ?", [remaining, t.amount, t.customer_id], function(err) {
              if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: err.message }); }
              db.run("COMMIT");
              res.json({ success: true });
            });
          } else if (t.type === 'PAYMENT') {
            // A payment decreased balance by paid_amount
            db.run("UPDATE customers SET balance = balance + ? WHERE id = ?", [t.paid_amount, t.customer_id], function(err) {
              if (err) { db.run("ROLLBACK"); return res.status(500).json({ error: err.message }); }
              db.run("COMMIT");
              res.json({ success: true });
            });
          } else {
            db.run("COMMIT");
            res.json({ success: true });
          }
        } else {
          db.run("COMMIT");
          res.json({ success: true });
        }
      });
    });
  });
});

// --- SERVICES API ---
app.get('/api/services', (req, res) => {
  db.all("SELECT * FROM services ORDER BY category, name", (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

app.post('/api/services', (req, res) => {
  const { category, name, price } = req.body;
  db.run("INSERT INTO services (category, name, price) VALUES (?, ?, ?)", [category, name, price], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ id: this.lastID, category, name, price });
  });
});

app.put('/api/services/:id', (req, res) => {
  const { category, name, price } = req.body;
  db.run("UPDATE services SET category = ?, name = ?, price = ? WHERE id = ?", [category, name, price, req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.delete('/api/services/:id', (req, res) => {
  db.run("DELETE FROM services WHERE id = ?", [req.params.id], function(err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});

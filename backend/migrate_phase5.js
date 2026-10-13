const db = require('./database');

db.serialize(() => {
  console.log("Starting Phase 5 Migration Step 2...");

  // Seed admin password
  db.run("ALTER TABLE settings ADD COLUMN admin_password TEXT DEFAULT 'admin'", (err) => {
    if (err && !err.message.includes("duplicate column name")) {
      console.log("Error adding admin_password to settings:", err.message);
    } else {
      console.log("admin_password added to settings.");
    }
  });

  // Wait a second for queries to finish then exit
  setTimeout(() => {
    console.log("Migration Complete.");
    process.exit(0);
  }, 1000);
});

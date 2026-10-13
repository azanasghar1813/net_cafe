const db = require('./database');

const newServices = [
  ['Printing', 'Black & White', 20],
  ['Printing', 'Color', 30],
  ['Scanning', '1 Page', 30],
  ['Scanning', '2 Pages', 50],
  ['Scanning', '5 Pages', 100],
  ['Online Services', 'PPSC', 300],
  ['Online Services', 'FPSC', 300],
  ['Online Services', 'NTS', 300],
  ['Online Services', 'NJP', 400],
  ['Online Services', 'CSS', 300],
  ['Online Services', 'PTS', 300],
  ['Online Services', 'OTS', 300],
  ['Online Services', 'CTS', 300],
  ['Online Services', 'ETEA', 300],
  ['Online Services', 'STS', 300],
  ['Online Services', 'UTS', 300],
  ['Online Services', 'KPPSC', 400],
  ['Online Services', 'BPSC', 400],
  ['Online Services', 'Govt Jobs', 300],
  ['Email', 'Email Service', 50],
  ['CV', 'CV without printing', 200],
  ['CV', 'CV with printing', 250]
];

db.serialize(() => {
  const stmt = db.prepare("INSERT INTO services (category, name, price) SELECT ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM services WHERE name = ?)");
  
  newServices.forEach(s => {
    stmt.run([s[0], s[1], s[2], s[1]]);
  });
  
  stmt.finalize(() => {
    console.log("Services seeded successfully.");
    process.exit(0);
  });
});

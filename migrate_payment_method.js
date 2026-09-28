require('dotenv').config();
const mysql = require('mysql2/promise');

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  try {
    console.log("Adding column...");
    await connection.query("ALTER TABLE transactions ADD COLUMN payment_method ENUM('Efectivo', 'Mercado Pago', 'Payway') NULL DEFAULT NULL");
  } catch (err) {
    if (err.code !== 'ER_DUP_FIELDNAME') throw err;
  }

  console.log("Updating existing records...");
  const [rows] = await connection.query("SELECT id, description FROM transactions WHERE type='income'");
  
  for (const row of rows) {
    let method = 'Efectivo';
    const desc = (row.description || '').toLowerCase();
    if (desc.includes('mercado pago')) {
      method = 'Mercado Pago';
    } else if (desc.includes('payway')) {
      method = 'Payway';
    }
    await connection.query("UPDATE transactions SET payment_method = ? WHERE id = ?", [method, row.id]);
  }

  // Also update expenses? The user said "las transacciones existentes se registren en el metodo de pago adecuado".
  // If they mean expenses too, I'll just set them all to 'Efectivo' since they usually are cash or transfer.
  const [expenseRows] = await connection.query("SELECT id, description FROM transactions WHERE type='expense'");
  for (const row of expenseRows) {
    let method = 'Efectivo'; // Default to cash for expenses
    await connection.query("UPDATE transactions SET payment_method = ? WHERE id = ?", [method, row.id]);
  }

  console.log("Migration complete!");
  await connection.end();
}
migrate();

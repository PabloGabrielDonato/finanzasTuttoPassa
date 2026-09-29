const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  try {
    console.log("Updating ENUMs...");
    await connection.query("ALTER TABLE transactions MODIFY COLUMN payment_method ENUM('Efectivo', 'Mercado Pago', 'Payway', 'Payway Tarjeta', 'Cupones') NULL DEFAULT NULL");
    
    // Some setups might have created daily_transactions with the old enum
    await connection.query("ALTER TABLE daily_transactions MODIFY COLUMN payment_method ENUM('Efectivo', 'Mercado Pago', 'Payway', 'Payway Tarjeta', 'Cupones') NOT NULL");
  } catch(e) {
    console.error("Warning altering tables:", e.message);
  }

  console.log("Updating existing records to Cupones...");
  // Convert any "Payway Tarjeta" or empty strings that were meant to be Payway Tarjeta to "Cupones"
  await connection.query("UPDATE transactions SET payment_method = 'Cupones' WHERE payment_method = 'Payway Tarjeta' OR (payment_method = '' AND description LIKE '%Payway Tarjeta%')");
  
  try {
    await connection.query("UPDATE daily_transactions SET payment_method = 'Cupones' WHERE payment_method = 'Payway Tarjeta' OR payment_method = ''");
  } catch(e) {}
  
  // Clean up ENUM to just Cupones
  try {
    await connection.query("ALTER TABLE transactions MODIFY COLUMN payment_method ENUM('Efectivo', 'Mercado Pago', 'Payway', 'Cupones') NULL DEFAULT NULL");
    await connection.query("ALTER TABLE daily_transactions MODIFY COLUMN payment_method ENUM('Efectivo', 'Mercado Pago', 'Payway', 'Cupones') NOT NULL");
  } catch(e) {
     console.error("Warning cleaning enums:", e.message);
  }
  
  console.log("Done!");
  process.exit(0);
}
migrate();

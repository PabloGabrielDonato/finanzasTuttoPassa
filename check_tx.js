require('dotenv').config();
const mysql = require('mysql2/promise');

async function check() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT || 3306
  });

  const [rows] = await connection.execute("SELECT id, description, category, type FROM transactions WHERE type='income' LIMIT 50");
  console.log(JSON.stringify(rows, null, 2));
  await connection.end();
}
check();

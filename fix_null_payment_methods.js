const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runFix() {
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const database = process.env.DB_NAME;
  
  const useMySQL = !!(host && user && database);
  let connection;
  let db;

  if (useMySQL) {
    const mysql = require('mysql2/promise');
    connection = await mysql.createConnection({
      host,
      user,
      password: process.env.DB_PASSWORD,
      database,
      port: process.env.DB_PORT || 3306
    });
    db = {
      query: (sql, params) => connection.query(sql, params)
    };
  } else {
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = path.join(__dirname, 'database.sqlite');
    const sqliteDb = new sqlite3.Database(dbPath);
    db = {
      query(sql, params = []) {
        return new Promise((resolve, reject) => {
          sqliteDb.run(sql, params, function(err) {
            if (err) return reject(err);
            resolve([{ affectedRows: this.changes }]);
          });
        });
      },
      close: () => sqliteDb.close()
    };
  }

  try {
    console.log('Fijando Mercado Pago...');
    await db.query(`UPDATE transactions SET payment_method = 'Mercado Pago' WHERE payment_method IS NULL AND description LIKE '%Mercado Pago%'`);
    
    console.log('Fijando Payway Tarjeta...');
    await db.query(`UPDATE transactions SET payment_method = 'Payway Tarjeta' WHERE payment_method IS NULL AND description LIKE '%Payway Tarjeta%'`);
    
    console.log('Fijando Payway...');
    await db.query(`UPDATE transactions SET payment_method = 'Payway' WHERE payment_method IS NULL AND description LIKE '%Payway%' AND payment_method != 'Payway Tarjeta'`);
    
    console.log('Fijando Efectivo por defecto (y cajas de seguridad)...');
    await db.query(`UPDATE transactions SET payment_method = 'Efectivo' WHERE payment_method IS NULL`);

    console.log('¡Transacciones arregladas!');
  } catch(e) {
    console.error(e);
  } finally {
    if (useMySQL) {
      await connection.end();
    } else {
      db.close();
    }
  }
}

runFix();

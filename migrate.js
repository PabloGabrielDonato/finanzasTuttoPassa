const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigrations() {
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const database = process.env.DB_NAME;
  
  const useMySQL = !!(host && user && database);
  let connection;
  let db;

  if (useMySQL) {
    console.log('Conectando a MySQL para ejecutar migraciones...');
    const mysql = require('mysql2');
    const dbConfig = {
      host,
      user,
      password: process.env.DB_PASSWORD,
      database,
      port: process.env.DB_PORT || 3306,
      multipleStatements: true
    };
    connection = mysql.createConnection(dbConfig);
    db = {
      isMySQL: true,
      query(sql, params = []) {
        return new Promise((resolve, reject) => {
          connection.query(sql, params, (err, results) => {
            if (err) return reject(err);
            resolve(results);
          });
        });
      }
    };
    await new Promise((resolve, reject) => {
      connection.connect((err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    console.log('Conectado a MySQL con éxito.');
  } else {
    console.log('No se detectó MySQL local. Usando SQLite para desarrollo local...');
    const sqlite3 = require('sqlite3').verbose();
    const dbPath = path.join(__dirname, 'database.sqlite');
    const sqliteDb = new sqlite3.Database(dbPath);
    db = {
      isMySQL: false,
      query(sql, params = []) {
        const sqliteSql = mysqlToSqlite(sql);
        return new Promise((resolve, reject) => {
          const cleanSql = sqliteSql.trim();
          const isSelect = cleanSql.toLowerCase().startsWith('select');
          if (isSelect) {
            sqliteDb.all(cleanSql, params, (err, rows) => {
              if (err) return reject(err);
              resolve(rows);
            });
          } else {
            sqliteDb.run(cleanSql, params, function(err) {
              if (err) return reject(err);
              // Devolver formato compatible para mysql insertId / count
              resolve([{ count: this.changes, insertId: this.lastID }]);
            });
          }
        });
      },
      close() {
        sqliteDb.close();
      }
    };
  }

  try {
    // Crear tabla de migraciones si no existe
    await db.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Leer migraciones ejecutadas
    const executedRows = await db.query('SELECT name FROM migrations');
    const executedMigrations = new Set(executedRows.map(row => row.name));

    // Leer archivos de migración
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.js'))
      .sort();

    let executedCount = 0;

    for (const file of files) {
      if (!executedMigrations.has(file)) {
        console.log(`Corriendo migración: ${file}...`);
        const migration = require(path.join(migrationsDir, file));
        
        await migration.up(db);
        
        await db.query('INSERT INTO migrations (name) VALUES (?)', [file]);
        console.log(`✅ Migración ${file} completada con éxito.`);
        executedCount++;
      }
    }

    if (executedCount === 0) {
      console.log('No hay migraciones nuevas para ejecutar. Todo está al día.');
    } else {
      console.log(`Total de migraciones ejecutadas: ${executedCount}`);
    }

    if (useMySQL) {
      connection.end();
    } else {
      db.close();
    }
  } catch (err) {
    console.error('❌ ERROR al ejecutar las migraciones:', err.message);
    if (useMySQL) connection.end();
    process.exit(1);
  }
}

function mysqlToSqlite(sql) {
  return sql
    .replace(/INT AUTO_INCREMENT PRIMARY KEY/gi, 'INTEGER PRIMARY KEY AUTOINCREMENT')
    .replace(/DECIMAL\(\d+,\s*\d+\)/gi, 'REAL')
    .replace(/VARCHAR\(\d+\)/gi, 'TEXT')
    .replace(/TIMESTAMP DEFAULT CURRENT_TIMESTAMP/gi, 'DATETIME DEFAULT CURRENT_TIMESTAMP')
    .replace(/TIMESTAMP NULL/gi, 'DATETIME')
    .replace(/TIMESTAMP/gi, 'DATETIME')
    .replace(/BOOLEAN/gi, 'INTEGER');
}

if (require.main === module) {
  runMigrations();
} else {
  module.exports = runMigrations;
}

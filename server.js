const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'tuttopassa_secret_key_2026';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Interfaz unificada de Base de Datos para soportar MySQL y SQLite
let db = {
  isMySQL: false,
  connection: null,
  sqliteDb: null,
  
  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (this.isMySQL) {
        // En mysql2, query toma params y devuelve [rows, fields]
        this.connection.query(sql, params, (err, results) => {
          if (err) return reject(err);
          resolve(results);
        });
      } else {
        // En sqlite3, usamos run para write o all para read
        const isSelect = sql.trim().toLowerCase().startsWith('select');
        if (isSelect) {
          this.sqliteDb.all(sql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
          });
        } else {
          this.sqliteDb.run(sql, params, function(err) {
            if (err) return reject(err);
            // Simular comportamiento de mysql (insertId, affectedRows)
            resolve({ insertId: this.lastID, affectedRows: this.changes });
          });
        }
      }
    });
  }
};

// Inicializar Base de Datos
async function initDatabase() {
  const useMySQL = !!(process.env.DB_HOST && process.env.DB_USER && process.env.DB_NAME);
  
  if (useMySQL) {
    console.log('Intentando conectar a base de datos MySQL...');
    try {
      const mysql = require('mysql2');
      const connection = mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306,
        multipleStatements: true
      });

      await new Promise((resolve, reject) => {
        connection.connect((err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      db.isMySQL = true;
      db.connection = connection;
      console.log('Conectado a MySQL con éxito.');

      // Crear Tablas
      await db.query(`
        CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(50) NOT NULL UNIQUE,
          password VARCHAR(255) NOT NULL,
          name VARCHAR(100) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      await db.query(`
        CREATE TABLE IF NOT EXISTS transactions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          type VARCHAR(10) NOT NULL,
          amount DECIMAL(12, 2) NOT NULL,
          category VARCHAR(100) NOT NULL,
          description TEXT,
          date DATE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS categories (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          type VARCHAR(10) NOT NULL,
          UNIQUE(name, type)
        )
      `);

      await db.query(`
        CREATE TABLE IF NOT EXISTS employees (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL UNIQUE,
          base_salary DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
          is_partner BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      try {
        await db.query('ALTER TABLE transactions ADD COLUMN employee_id INT NULL');
        await db.query('ALTER TABLE transactions ADD FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE SET NULL');
      } catch (e) {
        // Ignorar si la columna ya existe
      }

    } catch (err) {
      console.error('Error al conectar a MySQL, se usará SQLite local:', err.message);
      setupSQLite();
    }
  } else {
    console.log('No se configuró MySQL en .env. Usando SQLite local por defecto.');
    setupSQLite();
  }

  // Sembrar usuarios, categorías y empleados iniciales si no existen
  await seedUsers();
  await seedCategories();
  await seedEmployees();
}

function setupSQLite() {
  const sqlite3 = require('sqlite3').verbose();
  const dbPath = path.join(__dirname, 'database.sqlite');
  console.log(`Inicializando base de datos SQLite en: ${dbPath}`);
  
  db.isMySQL = false;
  db.sqliteDb = new sqlite3.Database(dbPath);

  // Crear tablas en SQLite
  db.sqliteDb.serialize(() => {
    db.sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        date TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    db.sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        UNIQUE(name, type)
      )
    `);

    db.sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS employees (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        base_salary REAL NOT NULL DEFAULT 0.0,
        is_partner INTEGER NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    db.sqliteDb.run('ALTER TABLE transactions ADD COLUMN employee_id INTEGER', (err) => {
      // Ignorar si la columna ya existe
    });
  });
}

async function seedUsers() {
  try {
    const existingUsers = await db.query('SELECT COUNT(*) as count FROM users');
    const count = db.isMySQL ? existingUsers[0].count : existingUsers[0].count;

    if (count === 0) {
      console.log('Sembrando usuarios por defecto (Luca, Thiago, Pablo)...');
      const usersToInsert = [
        { username: 'luca', name: 'Luca', pass: 'luca123' },
        { username: 'thiago', name: 'Thiago', pass: 'thiago123' },
        { username: 'pablo', name: 'Pablo', pass: 'pablo123' }
      ];

      for (const u of usersToInsert) {
        const hashedPassword = await bcrypt.hash(u.pass, 10);
        await db.query(
          'INSERT INTO users (username, password, name) VALUES (?, ?, ?)',
          [u.username, hashedPassword, u.name]
        );
      }
      console.log('Usuarios iniciales creados.');
    }
  } catch (err) {
    console.error('Error al sembrar usuarios:', err);
  }
}

async function seedCategories() {
  try {
    const existingCats = await db.query('SELECT COUNT(*) as count FROM categories');
    const count = db.isMySQL ? existingCats[0].count : existingCats[0].count;

    if (count === 0) {
      console.log('Sembrando categorías por defecto...');
      const catsToInsert = [
        { name: 'Ventas Cafetería/Panadería', type: 'income' },
        { name: 'Otros Ingresos', type: 'income' },
        { name: 'Materia Prima / Harina / Café', type: 'expense' },
        { name: 'Sueldos y Retiros', type: 'expense' },
        { name: 'Servicios (Luz, Agua, Gas, Internet)', type: 'expense' },
        { name: 'Mantenimiento y Limpieza', type: 'expense' },
        { name: 'Otros Gastos', type: 'expense' }
      ];

      for (const c of catsToInsert) {
        await db.query(
          'INSERT INTO categories (name, type) VALUES (?, ?)',
          [c.name, c.type]
        );
      }
      console.log('Categorías iniciales creadas.');
    }
  } catch (err) {
    console.error('Error al sembrar categorías:', err);
  }
}

async function seedEmployees() {
  try {
    const existingEmp = await db.query('SELECT COUNT(*) as count FROM employees');
    const count = db.isMySQL ? existingEmp[0].count : existingEmp[0].count;

    if (count === 0) {
      console.log('Sembrando empleados por defecto (Luca, Thiago, Pablo)...');
      const empsToInsert = [
        { name: 'Luca', base_salary: 150000.00, is_partner: 1 },
        { name: 'Thiago', base_salary: 150000.00, is_partner: 1 },
        { name: 'Pablo', base_salary: 150000.00, is_partner: 1 }
      ];

      for (const e of empsToInsert) {
        await db.query(
          'INSERT INTO employees (name, base_salary, is_partner) VALUES (?, ?, ?)',
          [e.name, e.base_salary, e.is_partner]
        );
      }
      console.log('Empleados iniciales creados.');
    }
  } catch (err) {
    console.error('Error al sembrar empleados:', err);
  }
}

// Middleware de Autenticación JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Acceso denegado. Token no suministrado.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido o expirado.' });
    req.user = user;
    next();
  });
}

// --- RUTAS DE API ---

// Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos.' });
  }

  try {
    const cleanUsername = username.toLowerCase().trim();
    const rows = await db.query('SELECT * FROM users WHERE username = ?', [cleanUsername]);
    
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }

    const user = rows[0];
    const validPass = await bcrypt.compare(password, user.password);
    if (!validPass) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos.' });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: user.id, username: user.username, name: user.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: { id: user.id, username: user.username, name: user.name }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  }
});

// Obtener detalles del usuario autenticado
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// Listar transacciones (con filtros opcionales de fecha, tipo, categoría)
app.get('/api/transactions', authenticateToken, async (req, res) => {
  const { month, type, category } = req.query; // month en formato YYYY-MM
  
  let queryStr = `
    SELECT t.*, u.name as user_name, e.name as employee_name 
    FROM transactions t 
    JOIN users u ON t.user_id = u.id 
    LEFT JOIN employees e ON t.employee_id = e.id
    WHERE 1=1
  `;
  const params = [];

  if (month) {
    if (db.isMySQL) {
      queryStr += ' AND DATE_FORMAT(t.date, "%Y-%m") = ?';
    } else {
      queryStr += ' AND strftime("%Y-%m", t.date) = ?';
    }
    params.push(month);
  }

  if (type) {
    queryStr += ' AND t.type = ?';
    params.push(type);
  }

  if (category) {
    queryStr += ' AND t.category = ?';
    params.push(category);
  }

  queryStr += ' ORDER BY t.date DESC, t.id DESC';

  try {
    const transactions = await db.query(queryStr, params);
    res.json(transactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al consultar transacciones.' });
  }
});

// Crear transacción
app.post('/api/transactions', authenticateToken, async (req, res) => {
  const { type, amount, category, description, date, employee_id } = req.body;

  if (!type || !amount || !category || !date) {
    return res.status(400).json({ error: 'Todos los campos excepto la descripción son obligatorios.' });
  }

  if (amount <= 0) {
    return res.status(400).json({ error: 'El monto debe ser mayor que cero.' });
  }

  try {
    const result = await db.query(
      'INSERT INTO transactions (user_id, type, amount, category, description, date, employee_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, type, amount, category, description || '', date, employee_id || null]
    );

    const newId = result.insertId;
    res.status(201).json({
      message: 'Transacción registrada con éxito.',
      transaction: {
        id: newId,
        user_id: req.user.id,
        user_name: req.user.name,
        type,
        amount,
        category,
        description,
        date,
        employee_id: employee_id || null
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar la transacción.' });
  }
});

// Eliminar transacción
app.delete('/api/transactions/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM transactions WHERE id = ?', [id]);
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Transacción no encontrada.' });
    }

    res.json({ message: 'Transacción eliminada correctamente.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar la transacción.' });
  }
});

// --- RUTAS DE CATEGORÍAS ---

// Obtener todas las categorías
app.get('/api/categories', authenticateToken, async (req, res) => {
  try {
    const categories = await db.query('SELECT * FROM categories ORDER BY name ASC');
    res.json(categories);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al consultar categorías.' });
  }
});

// Crear categoría
app.post('/api/categories', authenticateToken, async (req, res) => {
  const { name, type } = req.body;

  if (!name || !type) {
    return res.status(400).json({ error: 'El nombre y el tipo de categoría son obligatorios.' });
  }

  if (type !== 'income' && type !== 'expense') {
    return res.status(400).json({ error: 'Tipo de categoría inválido (debe ser income o expense).' });
  }

  try {
    const cleanName = name.trim();
    const existing = await db.query('SELECT * FROM categories WHERE LOWER(name) = LOWER(?) AND type = ?', [cleanName, type]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Esta categoría ya existe para este tipo.' });
    }

    const result = await db.query('INSERT INTO categories (name, type) VALUES (?, ?)', [cleanName, type]);
    res.status(201).json({
      message: 'Categoría agregada con éxito.',
      category: {
        id: result.insertId || null,
        name: cleanName,
        type
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear la categoría.' });
  }
});

// Eliminar categoría
app.delete('/api/categories/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await db.query('DELETE FROM categories WHERE id = ?', [id]);
    
    if (result.affectedRows === 0 && !db.isMySQL) {
      // Si es SQLite, result no tiene affectedRows directamente del query de la misma forma,
      // pero devolvimos un objeto con { affectedRows: this.changes } en la query() helper.
    }

    res.json({ message: 'Categoría eliminada correctamente.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar la categoría.' });
  }
});

// --- RUTAS DE EMPLEADOS ---

// Listar empleados
app.get('/api/employees', authenticateToken, async (req, res) => {
  try {
    const employees = await db.query('SELECT * FROM employees ORDER BY name ASC');
    res.json(employees);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al consultar empleados.' });
  }
});

// Registrar o actualizar empleado
app.post('/api/employees', authenticateToken, async (req, res) => {
  const { name, base_salary, is_partner } = req.body;

  if (!name || base_salary === undefined) {
    return res.status(400).json({ error: 'El nombre y el sueldo base son obligatorios.' });
  }

  try {
    const cleanName = name.trim();
    const existing = await db.query('SELECT * FROM employees WHERE LOWER(name) = LOWER(?)', [cleanName]);
    if (existing.length > 0) {
      await db.query(
        'UPDATE employees SET base_salary = ?, is_partner = ? WHERE LOWER(name) = LOWER(?)',
        [base_salary, is_partner ? 1 : 0, cleanName]
      );
      return res.json({ message: 'Empleado actualizado con éxito.' });
    }

    const result = await db.query(
      'INSERT INTO employees (name, base_salary, is_partner) VALUES (?, ?, ?)',
      [cleanName, base_salary, is_partner ? 1 : 0]
    );

    res.status(201).json({
      message: 'Empleado registrado con éxito.',
      employee: {
        id: result.insertId || null,
        name: cleanName,
        base_salary,
        is_partner: !!is_partner
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar el empleado.' });
  }
});

// Eliminar empleado
app.delete('/api/employees/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    await db.query('DELETE FROM employees WHERE id = ?', [id]);
    res.json({ message: 'Empleado eliminado con éxito.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar el empleado.' });
  }
});

// --- RUTAS DE LIQUIDACIONES ---
app.get('/api/settlements', authenticateToken, async (req, res) => {
  const { month } = req.query; // Formato YYYY-MM
  if (!month) {
    return res.status(400).json({ error: 'El mes es obligatorio (formato YYYY-MM).' });
  }

  try {
    const employees = await db.query('SELECT * FROM employees ORDER BY name ASC');

    let txQuery = `SELECT * FROM transactions WHERE 1=1`;
    const txParams = [];
    if (db.isMySQL) {
      txQuery += ' AND DATE_FORMAT(date, "%Y-%m") = ?';
    } else {
      txQuery += ' AND strftime("%Y-%m", date) = ?';
    }
    txParams.push(month);
    
    const monthTransactions = await db.query(txQuery, txParams);

    let totalIncome = 0;
    let totalOperatingExpenses = 0;

    monthTransactions.forEach(t => {
      const amt = parseFloat(t.amount);
      if (t.type === 'income') {
        totalIncome += amt;
      } else {
        const emp = employees.find(e => e.id === t.employee_id);
        const isPartnerWithdrawal = emp && emp.is_partner;
        if (!isPartnerWithdrawal) {
          totalOperatingExpenses += amt;
        }
      }
    });

    const netProfitToDistribute = Math.max(0, totalIncome - totalOperatingExpenses);
    const profitSharePerPartner = netProfitToDistribute / 3;

    const settlements = employees.map(emp => {
      let advances = 0;
      monthTransactions.forEach(t => {
        if (t.type === 'expense' && t.employee_id === emp.id) {
          advances += parseFloat(t.amount);
        }
      });

      const baseSalary = parseFloat(emp.base_salary);
      const profitShare = emp.is_partner ? profitSharePerPartner : 0;
      const finalSettlement = baseSalary + profitShare - advances;

      return {
        employee_id: emp.id,
        name: emp.name,
        base_salary: baseSalary,
        is_partner: !!emp.is_partner,
        profit_share: profitShare,
        advances: advances,
        final_settlement: finalSettlement
      };
    });

    res.json({
      month,
      total_income: totalIncome,
      total_operating_expenses: totalOperatingExpenses,
      net_profit_to_distribute: netProfitToDistribute,
      profit_share_per_partner: profitSharePerPartner,
      settlements
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al calcular liquidaciones.' });
  }
});

// Fallback para servir el Frontend en cualquier otra ruta (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Iniciar base de datos y luego el servidor
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(`Servidor de Finanzas corriendo en http://localhost:${PORT}`);
    console.log(`Credenciales iniciales: luca/luca123, thiago/thiago123, pablo/pablo123`);
    console.log(`==================================================`);
  });
}).catch(err => {
  console.error('Error catastrófico al iniciar base de datos:', err);
});

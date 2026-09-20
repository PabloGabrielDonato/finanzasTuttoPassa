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

// Configurar multer para subida de comprobantes y facturas
const multer = require('multer');
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});
const upload = multer({ storage: storage });

// Interfaz unificada de Base de Datos para MySQL y SQLite (Desarrollo local)
let db = {
  isMySQL: false,
  connection: null,
  sqliteDb: null,
  
  query(sql, params = []) {
    return new Promise((resolve, reject) => {
      if (this.isMySQL) {
        if (!this.connection) return reject(new Error('Base de datos MySQL no inicializada.'));
        this.connection.query(sql, params, (err, results) => {
          if (err) return reject(err);
          resolve(results);
        });
      } else {
        if (!this.sqliteDb) return reject(new Error('Base de datos SQLite no inicializada.'));
        const sqliteSql = mysqlToSqlite(sql);
        const cleanSql = sqliteSql.trim();
        const isSelect = cleanSql.toLowerCase().startsWith('select');
        if (isSelect) {
          this.sqliteDb.all(cleanSql, params, (err, rows) => {
            if (err) return reject(err);
            resolve(rows);
          });
        } else {
          this.sqliteDb.run(cleanSql, params, function(err) {
            if (err) return reject(err);
            resolve({ insertId: this.lastID, affectedRows: this.changes });
          });
        }
      }
    });
  }
};

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

// Inicializar Base de Datos y ejecutar migraciones automáticas
async function initDatabase() {
  const host = process.env.DB_HOST;
  const user = process.env.DB_USER;
  const database = process.env.DB_NAME;

  const useMySQL = !!(host && user && database);

  if (useMySQL) {
    console.log('Intentando conectar a base de datos MySQL...');
    try {
      const mysql = require('mysql2');
      const connection = mysql.createConnection({
        host: host,
        user: user,
        password: process.env.DB_PASSWORD,
        database: database,
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
    } catch (err) {
      console.error('Error al conectar a MySQL:', err.message);
      process.exit(1);
    }
  } else {
    console.log('No se configuró MySQL en el archivo .env local. Usando SQLite para pruebas locales...');
    const sqlite3 = require('sqlite3').verbose();
    const path = require('path');
    const dbPath = path.join(__dirname, 'database.sqlite');
    db.isMySQL = false;
    db.sqliteDb = new sqlite3.Database(dbPath);
  }

  // Ejecutar migraciones automáticas estilo Laravel
  const runMigrations = require('./migrate');
  await runMigrations();
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

// --- RUTAS DE CUOTAS DE TARJETA ---

// Obtener todas las tarjetas (con conteo dinámico de cuotas pagadas)
app.get('/api/credit-cards', authenticateToken, async (req, res) => {
  try {
    const cards = await db.query(`
      SELECT c.*, COUNT(cp.id) as installments_paid
      FROM credit_cards c
      LEFT JOIN credit_card_payments cp ON c.id = cp.credit_card_id
      GROUP BY c.id
      ORDER BY c.created_at DESC
    `);
    res.json(cards);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al consultar tarjetas de crédito.' });
  }
});

// Registrar nueva tarjeta
app.post('/api/credit-cards', authenticateToken, async (req, res) => {
  const { cardholder, total_amount, installments, start_month } = req.body;

  if (!cardholder || !total_amount || !installments || !start_month) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  const numTotalAmount = parseFloat(total_amount);
  const numInstallments = parseInt(installments);

  if (isNaN(numTotalAmount) || numTotalAmount <= 0) {
    return res.status(400).json({ error: 'El monto total debe ser mayor a cero.' });
  }
  if (isNaN(numInstallments) || numInstallments <= 0) {
    return res.status(400).json({ error: 'La cantidad de cuotas debe ser mayor a cero.' });
  }

  const numInstallmentAmount = numTotalAmount / numInstallments;

  try {
    const result = await db.query(
      'INSERT INTO credit_cards (cardholder, total_amount, installments, installment_amount, start_month) VALUES (?, ?, ?, ?, ?)',
      [cardholder.trim(), numTotalAmount, numInstallments, numInstallmentAmount, start_month]
    );

    res.status(201).json({
      message: 'Tarjeta registrada con éxito.',
      credit_card: {
        id: result.insertId,
        cardholder: cardholder.trim(),
        total_amount: numTotalAmount,
        installments: numInstallments,
        installment_amount: numInstallmentAmount,
        start_month: start_month,
        installments_paid: 0
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar la tarjeta.' });
  }
});

// Obtener historial de cuotas pagadas de una tarjeta
app.get('/api/credit-cards/:id/payments', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const payments = await db.query('SELECT * FROM credit_card_payments WHERE credit_card_id = ? ORDER BY installment_number ASC', [id]);
    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al consultar historial de cuotas.' });
  }
});

// Pagar la siguiente cuota de una tarjeta
app.post('/api/credit-cards/:id/pay-installment', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { payment_date } = req.body;

  if (!payment_date) {
    return res.status(400).json({ error: 'La fecha de pago es obligatoria.' });
  }

  try {
    const cards = await db.query('SELECT * FROM credit_cards WHERE id = ?', [id]);
    if (cards.length === 0) {
      return res.status(404).json({ error: 'Tarjeta no encontrada.' });
    }
    const card = cards[0];

    const paidCountRows = await db.query('SELECT COUNT(*) as count FROM credit_card_payments WHERE credit_card_id = ?', [id]);
    const paidCount = paidCountRows[0].count;

    if (paidCount >= card.installments) {
      return res.status(400).json({ error: 'Esta tarjeta ya está totalmente pagada.' });
    }

    const nextInstallmentNum = paidCount + 1;

    // Crear transacción de egreso asociada
    const category = 'Otros'; // Or 'Pago de Tarjeta' if added to categories
    const description = `Cuota ${nextInstallmentNum}/${card.installments} - Tarjeta ${card.cardholder}`;
    
    const txResult = await db.query(
      'INSERT INTO transactions (user_id, type, amount, category, description, date, employee_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, 'expense', card.installment_amount, category, description, payment_date, null]
    );
    const transactionId = txResult.insertId;

    // Crear registro de pago
    await db.query(
      'INSERT INTO credit_card_payments (credit_card_id, transaction_id, installment_number, amount, payment_date) VALUES (?, ?, ?, ?, ?)',
      [id, transactionId, nextInstallmentNum, card.installment_amount, payment_date]
    );

    res.status(201).json({ message: 'Cuota de tarjeta pagada con éxito.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar el pago de la cuota de la tarjeta.' });
  }
});

// Eliminar tarjeta
app.delete('/api/credit-cards/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const payments = await db.query('SELECT * FROM credit_card_payments WHERE credit_card_id = ?', [id]);
    for (const p of payments) {
      if (p.transaction_id) {
        await db.query('DELETE FROM transactions WHERE id = ?', [p.transaction_id]);
      }
    }
    await db.query('DELETE FROM credit_cards WHERE id = ?', [id]);
    res.json({ message: 'Tarjeta eliminada correctamente.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar la tarjeta.' });
  }
});

// --- RUTAS DE APORTES DE SOCIOS ---

// Obtener todos los aportes
app.get('/api/contributions', authenticateToken, async (req, res) => {
  try {
    const contributions = await db.query('SELECT * FROM partner_contributions ORDER BY date DESC, id DESC');
    res.json(contributions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener los aportes.' });
  }
});

// Registrar aporte
app.post('/api/contributions', authenticateToken, async (req, res) => {
  const { partner_name, amount, currency, date, reason } = req.body;
  if (!partner_name || !amount || !currency || !date) {
    return res.status(400).json({ error: 'El socio, monto, divisa y fecha son obligatorios.' });
  }
  try {
    const result = await db.query(
      'INSERT INTO partner_contributions (partner_name, amount, currency, date, reason) VALUES (?, ?, ?, ?, ?)',
      [partner_name.trim(), amount, currency.trim(), date, reason ? reason.trim() : null]
    );
    res.status(201).json({
      message: 'Aporte registrado con éxito.',
      contribution: {
        id: result.insertId || null,
        partner_name,
        amount,
        currency,
        date,
        reason
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar el aporte.' });
  }
});

// Eliminar aporte
app.delete('/api/contributions/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM partner_contributions WHERE id = ?', [id]);
    res.json({ message: 'Aporte eliminado correctamente.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar el aporte.' });
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

// Actualizar empleado por ID
app.put('/api/employees/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, base_salary, is_partner } = req.body;

  if (!name || base_salary === undefined) {
    return res.status(400).json({ error: 'El nombre y el sueldo base son obligatorios.' });
  }

  try {
    const cleanName = name.trim();
    await db.query(
      'UPDATE employees SET name = ?, base_salary = ?, is_partner = ? WHERE id = ?',
      [cleanName, parseFloat(base_salary), is_partner ? 1 : 0, id]
    );
    res.json({ message: 'Empleado actualizado con éxito.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar el empleado.' });
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

// --- RUTAS DE SERVICIOS ---

// Obtener tipos de servicio
app.get('/api/services', authenticateToken, async (req, res) => {
  try {
    const services = await db.query('SELECT * FROM service_types ORDER BY name ASC');
    res.json(services);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al consultar tipos de servicios.' });
  }
});

// Crear tipo de servicio
app.post('/api/services', authenticateToken, async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'El nombre del tipo de servicio es obligatorio.' });
  }

  try {
    const cleanName = name.trim();
    const existing = await db.query('SELECT * FROM service_types WHERE LOWER(name) = LOWER(?)', [cleanName]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Este tipo de servicio ya existe.' });
    }

    const result = await db.query('INSERT INTO service_types (name) VALUES (?)', [cleanName]);
    res.status(201).json({
      message: 'Tipo de servicio agregado con éxito.',
      service: {
        id: result.insertId || null,
        name: cleanName
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al crear el tipo de servicio.' });
  }
});

// Eliminar tipo de servicio
app.delete('/api/services/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM service_types WHERE id = ?', [id]);
    res.json({ message: 'Tipo de servicio eliminado con éxito.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar el tipo de servicio.' });
  }
});

// Obtener pagos de servicios (filtrado opcional por mes)
app.get('/api/service-payments', authenticateToken, async (req, res) => {
  const { month } = req.query; // YYYY-MM
  let queryStr = `
    SELECT sp.*, st.name as service_name, t.description as tx_description 
    FROM service_payments sp
    JOIN service_types st ON sp.service_type_id = st.id
    LEFT JOIN transactions t ON sp.transaction_id = t.id
  `;
  const params = [];
  if (month) {
    queryStr += ' WHERE sp.month = ?';
    params.push(month);
  }
  queryStr += ' ORDER BY sp.payment_date DESC, sp.id DESC';

  try {
    const payments = await db.query(queryStr, params);
    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener pagos de servicios.' });
  }
});

// Registrar pago de servicio (soporta subida de archivos)
app.post('/api/service-payments', authenticateToken, upload.fields([
  { name: 'ticket', maxCount: 1 },
  { name: 'invoice', maxCount: 1 }
]), async (req, res) => {
  const { service_type_id, month, amount, payment_date } = req.body;

  if (!service_type_id || !month || !amount || !payment_date) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ error: 'El monto debe ser un número mayor a cero.' });
  }

  try {
    // 1. Obtener información del tipo de servicio para la descripción del egreso
    const services = await db.query('SELECT name FROM service_types WHERE id = ?', [service_type_id]);
    if (services.length === 0) {
      return res.status(404).json({ error: 'Tipo de servicio no encontrado.' });
    }
    const serviceName = services[0].name;

    // 2. Crear transacción asociada en la tabla transactions
    const category = 'Servicios (Luz, Agua, Gas, Internet)';
    const description = `Pago de ${serviceName} - Mes: ${month}`;
    
    const txResult = await db.query(
      'INSERT INTO transactions (user_id, type, amount, category, description, date, employee_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, 'expense', numericAmount, category, description, payment_date, null]
    );
    const transactionId = txResult.insertId;

    // 3. Procesar rutas de archivos subidos
    const ticketPath = req.files && req.files['ticket'] ? '/uploads/' + req.files['ticket'][0].filename : null;
    const invoicePath = req.files && req.files['invoice'] ? '/uploads/' + req.files['invoice'][0].filename : null;

    // 4. Guardar el pago del servicio
    const spResult = await db.query(
      'INSERT INTO service_payments (service_type_id, transaction_id, month, amount, payment_date, ticket_path, invoice_path) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [service_type_id, transactionId, month, numericAmount, payment_date, ticketPath, invoicePath]
    );

    res.status(201).json({
      message: 'Pago de servicio registrado con éxito.',
      payment: {
        id: spResult.insertId,
        service_type_id,
        transaction_id: transactionId,
        month,
        amount: numericAmount,
        payment_date,
        ticket_path: ticketPath,
        invoice_path: invoicePath
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar el pago de servicio.' });
  }
});

// Eliminar pago de servicio
app.delete('/api/service-payments/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Obtener detalles del pago para borrar los archivos físicos y la transacción
    const payments = await db.query('SELECT * FROM service_payments WHERE id = ?', [id]);
    if (payments.length === 0) {
      return res.status(404).json({ error: 'Pago de servicio no encontrado.' });
    }
    const payment = payments[0];

    // Borrar transacción vinculada
    if (payment.transaction_id) {
      await db.query('DELETE FROM transactions WHERE id = ?', [payment.transaction_id]);
    }

    // Borrar archivos físicos
    if (payment.ticket_path) {
      const fullTicketPath = path.join(__dirname, 'public', payment.ticket_path);
      if (fs.existsSync(fullTicketPath)) {
        fs.unlinkSync(fullTicketPath);
      }
    }
    if (payment.invoice_path) {
      const fullInvoicePath = path.join(__dirname, 'public', payment.invoice_path);
      if (fs.existsSync(fullInvoicePath)) {
        fs.unlinkSync(fullInvoicePath);
      }
    }

    // Borrar registro del pago
    await db.query('DELETE FROM service_payments WHERE id = ?', [id]);

    res.json({ message: 'Pago de servicio eliminado con éxito.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar el pago de servicio.' });
  }
});

// --- RUTAS DE DEUDAS ---

// Obtener todas las deudas (con conteo dinámico de cuotas pagadas)
app.get('/api/debts', authenticateToken, async (req, res) => {
  try {
    const debts = await db.query(`
      SELECT d.*, COUNT(dp.id) as installments_paid
      FROM debts d
      LEFT JOIN debt_payments dp ON d.id = dp.debt_id
      GROUP BY d.id
      ORDER BY d.created_at DESC
    `);
    
    // Si la consulta agrupada por id en SQLite o MySQL no devuelve todos los campos correctamente, 
    // nos aseguramos de dar formato limpio. En SQLite/MySQL estándar, el GROUP BY d.id funciona.
    res.json(debts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al consultar deudas.' });
  }
});

// Registrar nueva deuda
app.post('/api/debts', authenticateToken, async (req, res) => {
  const { name, total_amount, installments, installment_amount, due_day } = req.body;

  if (!name || !total_amount || !installments || !installment_amount || !due_day) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios.' });
  }

  const numTotalAmount = parseFloat(total_amount);
  const numInstallments = parseInt(installments);
  const numInstallmentAmount = parseFloat(installment_amount);
  const numDueDay = parseInt(due_day);

  if (isNaN(numTotalAmount) || numTotalAmount <= 0) {
    return res.status(400).json({ error: 'El monto total debe ser mayor a cero.' });
  }
  if (isNaN(numInstallments) || numInstallments <= 0) {
    return res.status(400).json({ error: 'La cantidad de cuotas debe ser mayor a cero.' });
  }
  if (isNaN(numInstallmentAmount) || numInstallmentAmount <= 0) {
    return res.status(400).json({ error: 'El dinero por cuota debe ser mayor a cero.' });
  }
  if (isNaN(numDueDay) || numDueDay < 1 || numDueDay > 31) {
    return res.status(400).json({ error: 'El día de vencimiento debe estar entre 1 y 31.' });
  }

  try {
    const result = await db.query(
      'INSERT INTO debts (name, total_amount, installments, installment_amount, installments_paid, due_day) VALUES (?, ?, ?, ?, 0, ?)',
      [name.trim(), numTotalAmount, numInstallments, numInstallmentAmount, numDueDay]
    );

    res.status(201).json({
      message: 'Deuda registrada con éxito.',
      debt: {
        id: result.insertId,
        name: name.trim(),
        total_amount: numTotalAmount,
        installments: numInstallments,
        installment_amount: numInstallmentAmount,
        installments_paid: 0,
        due_day: numDueDay
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar la deuda.' });
  }
});

// Obtener historial de cuotas pagadas de una deuda
app.get('/api/debts/:id/payments', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const payments = await db.query('SELECT * FROM debt_payments WHERE debt_id = ? ORDER BY installment_number ASC', [id]);
    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al consultar historial de cuotas.' });
  }
});

// Pagar la siguiente cuota de una deuda (soporta comprobante opcional)
app.post('/api/debts/:id/pay-installment', authenticateToken, upload.single('ticket'), async (req, res) => {
  const { id } = req.params;
  const { payment_date } = req.body;

  if (!payment_date) {
    return res.status(400).json({ error: 'La fecha de pago es obligatoria.' });
  }

  try {
    const debts = await db.query('SELECT * FROM debts WHERE id = ?', [id]);
    if (debts.length === 0) {
      return res.status(404).json({ error: 'Deuda no encontrada.' });
    }
    const debt = debts[0];

    // Contar cuántas cuotas se pagaron realmente
    const paidCountRows = await db.query('SELECT COUNT(*) as count FROM debt_payments WHERE debt_id = ?', [id]);
    const paidCount = paidCountRows[0].count;

    if (paidCount >= debt.installments) {
      return res.status(400).json({ error: 'Esta deuda ya está totalmente pagada.' });
    }

    const nextInstallmentNum = paidCount + 1;

    // 1. Crear transacción de egreso asociada
    const category = 'Pago de Deuda';
    const description = `Cuota ${nextInstallmentNum}/${debt.installments} - ${debt.name}`;
    
    const txResult = await db.query(
      'INSERT INTO transactions (user_id, type, amount, category, description, date, employee_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [req.user.id, 'expense', debt.installment_amount, category, description, payment_date, null]
    );
    const transactionId = txResult.insertId;

    // 2. Procesar ticket si se adjuntó
    const ticketPath = req.file ? '/uploads/' + req.file.filename : null;

    // 3. Crear registro en debt_payments
    await db.query(
      'INSERT INTO debt_payments (debt_id, transaction_id, installment_number, amount, payment_date, ticket_path) VALUES (?, ?, ?, ?, ?, ?)',
      [id, transactionId, nextInstallmentNum, debt.installment_amount, payment_date, ticketPath]
    );

    // 4. Actualizar el contador de cuotas en la tabla principal de debts para retrocompatibilidad
    await db.query('UPDATE debts SET installments_paid = ? WHERE id = ?', [nextInstallmentNum, id]);

    res.status(201).json({
      message: `Cuota ${nextInstallmentNum} pagada con éxito.`,
      installment_number: nextInstallmentNum
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar el pago de la cuota.' });
  }
});

// Eliminar deuda
app.delete('/api/debts/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    // 1. Buscar pagos asociados para borrar sus archivos físicos
    const payments = await db.query('SELECT * FROM debt_payments WHERE debt_id = ?', [id]);
    for (const p of payments) {
      if (p.ticket_path) {
        const fullPath = path.join(__dirname, 'public', p.ticket_path);
        if (fs.existsSync(fullPath)) {
          fs.unlinkSync(fullPath);
        }
      }
      if (p.transaction_id) {
        await db.query('DELETE FROM transactions WHERE id = ?', [p.transaction_id]);
      }
    }

    // 2. Eliminar deuda (borra en cascada los pagos gracias al ON DELETE CASCADE)
    await db.query('DELETE FROM debts WHERE id = ?', [id]);
    res.json({ message: 'Deuda eliminada con éxito.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar la deuda.' });
  }
});

// Eliminar un pago de cuota específico (revertir pago)
app.delete('/api/debt-payments/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const payments = await db.query('SELECT * FROM debt_payments WHERE id = ?', [id]);
    if (payments.length === 0) {
      return res.status(404).json({ error: 'Pago de cuota no encontrado.' });
    }
    const payment = payments[0];

    // Borrar la transacción asociada en transactions
    if (payment.transaction_id) {
      await db.query('DELETE FROM transactions WHERE id = ?', [payment.transaction_id]);
    }

    // Borrar el archivo físico si existía
    if (payment.ticket_path) {
      const fullTicketPath = path.join(__dirname, 'public', payment.ticket_path);
      if (fs.existsSync(fullTicketPath)) {
        fs.unlinkSync(fullTicketPath);
      }
    }

    // Eliminar el registro del pago de cuota
    await db.query('DELETE FROM debt_payments WHERE id = ?', [id]);

    // Recalcular installments_paid para la deuda
    const remainingPayments = await db.query('SELECT COUNT(*) as count FROM debt_payments WHERE debt_id = ?', [payment.debt_id]);
    const nextCount = remainingPayments[0].count;
    await db.query('UPDATE debts SET installments_paid = ? WHERE id = ?', [nextCount, payment.debt_id]);

    res.json({ message: 'Pago de cuota revertido con éxito.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al revertir el pago de la cuota.' });
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

// --- ESTADO DE CAJA (ARQUEO) ---
app.get('/api/daily-registers/:date', authenticateToken, async (req, res) => {
  const { date } = req.params;
  try {
    const registers = await db.query('SELECT * FROM daily_registers WHERE date = ?', [date]);
    if (registers.length === 0) {
      return res.json({ status: 'unopened' });
    }
    res.json(registers[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al consultar estado de caja.' });
  }
});

app.post('/api/daily-registers/open', authenticateToken, async (req, res) => {
  const { date, initial_cash } = req.body;
  if (!date || initial_cash === undefined) {
    return res.status(400).json({ error: 'Faltan datos para abrir la caja.' });
  }
  
  try {
    const existing = await db.query('SELECT * FROM daily_registers WHERE date = ?', [date]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'La caja ya fue abierta para esta fecha.' });
    }
    
    await db.query('INSERT INTO daily_registers (date, initial_cash, status) VALUES (?, ?, ?)', [date, parseFloat(initial_cash), 'open']);
    res.status(201).json({ message: 'Caja abierta con éxito.', initial_cash: parseFloat(initial_cash) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al abrir la caja.' });
  }
});

app.post('/api/daily-registers/close', authenticateToken, async (req, res) => {
  const { date, final_cash_counted, difference, next_day_cash } = req.body;
  if (!date || final_cash_counted === undefined) {
    return res.status(400).json({ error: 'Faltan datos para cerrar la caja.' });
  }
  
  try {
    const existing = await db.query('SELECT * FROM daily_registers WHERE date = ?', [date]);
    if (existing.length === 0 || existing[0].status === 'closed') {
      return res.status(400).json({ error: 'La caja no está abierta para esta fecha.' });
    }
    
    await db.query('UPDATE daily_registers SET final_cash_counted = ?, next_day_cash = ?, status = ? WHERE date = ?', 
      [parseFloat(final_cash_counted), next_day_cash !== undefined ? parseFloat(next_day_cash) : null, 'closed', date]);
    
    // Registrar el sobrante o faltante en transacciones generales si hay diferencia
    if (difference && Math.abs(parseFloat(difference)) > 0) {
      const diff = parseFloat(difference);
      const type = diff > 0 ? 'income' : 'expense';
      const absDiff = Math.abs(diff);
      const category = 'Otros'; // O una específica
      const desc = diff > 0 ? `Sobrante de Caja Arqueo (${date})` : `Faltante de Caja Arqueo (${date})`;
      
      await db.query(
        'INSERT INTO transactions (user_id, type, amount, category, description, date, employee_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [req.user.id, type, absDiff, category, desc, date, null]
      );
    }
    
    res.json({ message: 'Caja cerrada y arqueada con éxito.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al cerrar la caja.' });
  }
});

// --- RUTAS DE CAJA DIARIA ---
app.get('/api/daily-transactions', authenticateToken, async (req, res) => {
  const { date } = req.query; // Formato YYYY-MM-DD
  if (!date) {
    return res.status(400).json({ error: 'La fecha es obligatoria (formato YYYY-MM-DD).' });
  }
  try {
    const transactions = await db.query('SELECT * FROM daily_transactions WHERE date = ? ORDER BY id DESC', [date]);
    res.json(transactions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al consultar caja diaria.' });
  }
});

app.post('/api/daily-transactions', authenticateToken, upload.single('photo'), async (req, res) => {
  const { type, amount, payment_method, description, date, employee_id } = req.body;
  if (!type || !amount || !payment_method || !date) {
    return res.status(400).json({ error: 'Tipo, monto, método y fecha son obligatorios.' });
  }
  
  const numericAmount = parseFloat(amount);
  if (isNaN(numericAmount) || numericAmount <= 0) {
    return res.status(400).json({ error: 'El monto debe ser un número mayor a cero.' });
  }

  try {
    const register = await db.query('SELECT status FROM daily_registers WHERE date = ?', [date]);
    if (register.length === 0 || register[0].status === 'closed') {
      return res.status(400).json({ error: 'La caja no está abierta para esta fecha. No puedes agregar movimientos.' });
    }

    const photoPath = req.file ? '/uploads/' + req.file.filename : null;
    let globalTxId = null;

    // Si es un adelanto de sueldo (tiene employee_id y es egreso), registrarlo en la tabla general
    if (type === 'expense' && employee_id) {
      const globalTx = await db.query(
        'INSERT INTO transactions (user_id, type, amount, category, description, date, employee_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [req.user.id, type, numericAmount, 'Sueldos', description || 'Adelanto de sueldo desde Caja', date, employee_id]
      );
      globalTxId = globalTx.insertId;
    }

    const result = await db.query(
      'INSERT INTO daily_transactions (type, amount, payment_method, description, photo_path, global_transaction_id, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [type, numericAmount, payment_method, description || '', photoPath, globalTxId, date]
    );

    res.status(201).json({
      message: 'Transacción diaria registrada con éxito.',
      transaction: {
        id: result.insertId,
        type,
        amount: numericAmount,
        payment_method,
        description,
        photo_path: photoPath,
        global_transaction_id: globalTxId,
        date
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar la transacción diaria.' });
  }
});

app.delete('/api/daily-transactions/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const tx = await db.query('SELECT photo_path, date, global_transaction_id FROM daily_transactions WHERE id = ?', [id]);
    if (tx.length === 0) {
      return res.status(404).json({ error: 'Transacción no encontrada.' });
    }
    
    const register = await db.query('SELECT status FROM daily_registers WHERE date = ?', [tx[0].date]);
    if (register.length > 0 && register[0].status === 'closed') {
      return res.status(400).json({ error: 'La caja ya fue cerrada para esta fecha. No puedes eliminar movimientos.' });
    }
    
    if (tx[0].photo_path) {
      const fullPhotoPath = path.join(__dirname, 'public', tx[0].photo_path);
      if (fs.existsSync(fullPhotoPath)) {
        fs.unlinkSync(fullPhotoPath);
      }
    }
    
    // Si tenía un adelanto global asociado, eliminarlo
    if (tx[0].global_transaction_id) {
      await db.query('DELETE FROM transactions WHERE id = ?', [tx[0].global_transaction_id]);
    }
    
    await db.query('DELETE FROM daily_transactions WHERE id = ?', [id]);
    res.json({ message: 'Transacción diaria eliminada.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar la transacción.' });
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

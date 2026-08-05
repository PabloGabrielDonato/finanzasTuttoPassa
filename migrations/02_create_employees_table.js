module.exports = {
  name: '02_create_employees_table.js',
  async up(db) {
    await db.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        base_salary DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
        is_partner BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed default employees if empty
    const existing = await db.query('SELECT COUNT(*) as count FROM employees');
    if (existing[0].count === 0) {
      const empsToInsert = [
        { name: 'Luca', base_salary: 1200000.00, is_partner: 1 },
        { name: 'Thiago', base_salary: 1200000.00, is_partner: 1 },
        { name: 'Pablo', base_salary: 1200000.00, is_partner: 1 }
      ];
      for (const e of empsToInsert) {
        await db.query(
          'INSERT INTO employees (name, base_salary, is_partner) VALUES (?, ?, ?)',
          [e.name, e.base_salary, e.is_partner]
        );
      }
      console.log('  -> Empleados sembrados.');
    }
  }
};

module.exports = {
  name: '03_create_categories_table.js',
  async up(db) {
    await db.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type VARCHAR(10) NOT NULL,
        UNIQUE(name, type)
      )
    `);

    // Seed default categories if empty
    const existing = await db.query('SELECT COUNT(*) as count FROM categories');
    if (existing[0].count === 0) {
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
      console.log('  -> Categorías sembradas.');
    }
  }
};

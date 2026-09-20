module.exports = {
  name: '13_create_daily_registers_table.js',
  async up(db) {
    await db.query(`
      CREATE TABLE IF NOT EXISTS daily_registers (
        date DATE PRIMARY KEY,
        initial_cash DECIMAL(12, 2) NOT NULL DEFAULT 0,
        final_cash_counted DECIMAL(12, 2) NULL,
        status ENUM('open', 'closed') NOT NULL DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
  }
};

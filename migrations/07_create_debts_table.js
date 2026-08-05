module.exports = {
  name: '07_create_debts_table.js',
  async up(db) {
    await db.query(`
      CREATE TABLE IF NOT EXISTS debts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        total_amount DECIMAL(12, 2) NOT NULL,
        installments INT NOT NULL,
        installment_amount DECIMAL(12, 2) NOT NULL,
        installments_paid INT NOT NULL DEFAULT 0,
        due_day INT NOT NULL DEFAULT 10,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
};

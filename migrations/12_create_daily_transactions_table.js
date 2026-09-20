module.exports = {
  name: '12_create_daily_transactions_table.js',
  async up(db) {
    await db.query(`
      CREATE TABLE IF NOT EXISTS daily_transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        type VARCHAR(20) NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        payment_method VARCHAR(50) NOT NULL,
        description TEXT,
        photo_path VARCHAR(255) NULL,
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
};

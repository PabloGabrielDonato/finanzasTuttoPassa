module.exports = {
  name: '08_create_debt_payments_table.js',
  async up(db) {
    await db.query(`
      CREATE TABLE IF NOT EXISTS debt_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        debt_id INT NOT NULL,
        transaction_id INT NULL,
        installment_number INT NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        payment_date DATE NOT NULL,
        ticket_path VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (debt_id) REFERENCES debts(id) ON DELETE CASCADE,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
      )
    `);
  }
};

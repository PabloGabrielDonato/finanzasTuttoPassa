module.exports = {
  name: '10_create_credit_cards_table.js',
  async up(db) {
    await db.query(`
      CREATE TABLE IF NOT EXISTS credit_cards (
        id INT AUTO_INCREMENT PRIMARY KEY,
        cardholder VARCHAR(100) NOT NULL,
        total_amount DECIMAL(12, 2) NOT NULL,
        installments INT NOT NULL,
        installment_amount DECIMAL(12, 2) NOT NULL,
        start_month VARCHAR(7) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
};

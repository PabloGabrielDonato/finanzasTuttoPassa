module.exports = {
  name: '11_create_credit_card_payments_table.js',
  async up(db) {
    await db.query(`
      CREATE TABLE IF NOT EXISTS credit_card_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        credit_card_id INT NOT NULL,
        transaction_id INT NULL,
        installment_number INT NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        payment_date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (credit_card_id) REFERENCES credit_cards(id) ON DELETE CASCADE,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
      )
    `);
  }
};

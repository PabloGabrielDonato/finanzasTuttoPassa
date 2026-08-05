module.exports = {
  name: '06_create_service_payments_table.js',
  async up(db) {
    await db.query(`
      CREATE TABLE IF NOT EXISTS service_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        service_type_id INT NOT NULL,
        transaction_id INT NULL,
        month VARCHAR(7) NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        payment_date DATE NOT NULL,
        ticket_path VARCHAR(255) NULL,
        invoice_path VARCHAR(255) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (service_type_id) REFERENCES service_types(id) ON DELETE CASCADE,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
      )
    `);
  }
};

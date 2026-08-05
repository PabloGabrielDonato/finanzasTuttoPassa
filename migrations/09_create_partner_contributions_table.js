module.exports = {
  name: '09_create_partner_contributions_table.js',
  async up(db) {
    await db.query(`
      CREATE TABLE IF NOT EXISTS partner_contributions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        partner_name VARCHAR(100) NOT NULL,
        amount DECIMAL(12, 2) NOT NULL,
        currency VARCHAR(50) NOT NULL,
        date DATE NOT NULL,
        reason TEXT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }
};

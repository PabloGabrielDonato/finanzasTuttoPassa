module.exports = {
  name: '18_add_payment_method_to_orders.js',
  async up(db) {
    try {
      await db.query('ALTER TABLE orders ADD COLUMN payment_method VARCHAR(255) NULL');
    } catch (e) {
      // Ignore if column already exists
    }
  }
};

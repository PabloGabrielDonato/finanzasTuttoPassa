module.exports = {
  name: '20_add_payment_method_to_service_payments.js',
  async up(db) {
    try {
      await db.query('ALTER TABLE service_payments ADD COLUMN payment_method VARCHAR(255) NULL');
    } catch (e) {
      console.log('Migration 20 notice:', e.message);
    }
  }
};

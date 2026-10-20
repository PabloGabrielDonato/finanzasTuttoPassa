module.exports = {
  name: '26_add_payment_method_to_transactions.js',
  async up(db) {
    try {
      await db.query("ALTER TABLE transactions ADD COLUMN payment_method VARCHAR(100) NULL");
      console.log('✅ Columna payment_method añadida a transactions');
    } catch (e) {
      console.log('Notice migration 26:', e.message);
    }
  }
};

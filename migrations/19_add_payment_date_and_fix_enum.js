module.exports = {
  name: '19_add_payment_date_and_fix_enum.js',
  async up(db) {
    try {
      if (db.isMySQL) {
        await db.query("ALTER TABLE transactions MODIFY COLUMN payment_method VARCHAR(100) NULL DEFAULT NULL");
        await db.query("ALTER TABLE daily_transactions MODIFY COLUMN payment_method VARCHAR(100) NOT NULL");
        await db.query("ALTER TABLE orders ADD COLUMN payment_date DATE NULL");
      } else {
        await db.query("ALTER TABLE orders ADD COLUMN payment_date DATE NULL");
      }
    } catch (e) {
      console.log("Migration 19 executed with notice:", e.message);
    }
  }
};

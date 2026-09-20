module.exports = {
  name: '14_add_next_day_cash_to_daily_registers.js',
  async up(db) {
    await db.query(`
      ALTER TABLE daily_registers 
      ADD COLUMN next_day_cash DECIMAL(12, 2) NULL AFTER final_cash_counted
    `);
  }
};

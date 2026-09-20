module.exports = {
  name: '15_add_global_tx_to_daily_transactions.js',
  async up(db) {
    await db.query(`
      ALTER TABLE daily_transactions 
      ADD COLUMN global_transaction_id INT NULL AFTER photo_path
    `);
    
    // Add foreign key
    await db.query(`
      ALTER TABLE daily_transactions
      ADD CONSTRAINT fk_dt_global_tx
      FOREIGN KEY (global_transaction_id) REFERENCES transactions(id) ON DELETE SET NULL
    `);
  }
};

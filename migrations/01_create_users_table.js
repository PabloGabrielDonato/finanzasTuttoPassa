const bcrypt = require('bcryptjs');

module.exports = {
  name: '01_create_users_table.js',
  async up(db) {
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(100) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Seed default users if empty
    const existing = await db.query('SELECT COUNT(*) as count FROM users');
    if (existing[0].count === 0) {
      const users = [
        { username: 'luca', name: 'Luca', pass: 'luca123' },
        { username: 'thiago', name: 'Thiago', pass: 'thiago123' },
        { username: 'pablo', name: 'Pablo', pass: 'pablo123' }
      ];
      for (const u of users) {
        const hash = await bcrypt.hash(u.pass, 10);
        await db.query('INSERT INTO users (username, password, name) VALUES (?, ?, ?)', [u.username, hash, u.name]);
      }
      console.log('  -> Usuarios sembrados.');
    }
  }
};

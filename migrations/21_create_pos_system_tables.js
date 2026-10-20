module.exports = {
  name: '21_create_pos_system_tables.js',
  async up(db) {
    try {
      // 1. Ampliar tabla products
      const alterQueries = [
        "ALTER TABLE products ADD COLUMN description TEXT NULL",
        "ALTER TABLE products ADD COLUMN price REAL NOT NULL DEFAULT 0.00",
        "ALTER TABLE products ADD COLUMN unit_measure TEXT NOT NULL DEFAULT 'unidad'",
        "ALTER TABLE products ADD COLUMN iva_rate REAL NOT NULL DEFAULT 10.50",
        "ALTER TABLE products ADD COLUMN image_url TEXT NULL",
        "ALTER TABLE products ADD COLUMN is_promo INTEGER NOT NULL DEFAULT 0",
        "ALTER TABLE products ADD COLUMN is_quick_access INTEGER NOT NULL DEFAULT 0",
        "ALTER TABLE products ADD COLUMN quick_access_order INTEGER NOT NULL DEFAULT 0",
        "ALTER TABLE products ADD COLUMN auto_deduct_stock INTEGER NOT NULL DEFAULT 1",
        "ALTER TABLE products ADD COLUMN is_active INTEGER NOT NULL DEFAULT 1"
      ];

      for (const q of alterQueries) {
        try {
          await db.query(q);
        } catch (e) {
          // Ignorar si la columna ya existe
        }
      }

      // 2. Tabla de Mesas de Salón
      await db.query(`
        CREATE TABLE IF NOT EXISTS pos_tables (
          id INT AUTO_INCREMENT PRIMARY KEY,
          table_number INT NOT NULL UNIQUE,
          name VARCHAR(50) NOT NULL,
          status ENUM('closed', 'open') NOT NULL DEFAULT 'closed',
          current_order_id INT NULL,
          opened_at DATETIME NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // 3. Tabla de Cabecera de Ventas / Comandas
      await db.query(`
        CREATE TABLE IF NOT EXISTS pos_orders (
          id INT AUTO_INCREMENT PRIMARY KEY,
          order_number INT NOT NULL,
          user_id INT NOT NULL,
          daily_register_id INT NULL,
          table_id INT NULL,
          date DATE NOT NULL,
          time TIME NOT NULL,
          
          neto_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
          iva_105_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
          iva_21_amount DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
          total_amount DECIMAL(12, 2) NOT NULL,
          
          payment_method VARCHAR(50) NOT NULL,
          cash_received DECIMAL(12, 2) NULL,
          cash_change DECIMAL(12, 2) NULL,
          
          is_invoiced BOOLEAN NOT NULL DEFAULT 0,
          invoice_type INT NULL,
          punto_venta INT NULL,
          invoice_number INT NULL,
          cae VARCHAR(20) NULL,
          cae_due_date DATE NULL,
          afip_qr_url TEXT NULL,
          
          client_doc_type INT NULL DEFAULT 99,
          client_doc_number VARCHAR(20) NULL,
          client_name VARCHAR(150) NULL,
          notes TEXT NULL,
          
          status ENUM('completed', 'cancelled') NOT NULL DEFAULT 'completed',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          
          FOREIGN KEY (user_id) REFERENCES users(id),
          FOREIGN KEY (daily_register_id) REFERENCES daily_registers(id),
          FOREIGN KEY (table_id) REFERENCES pos_tables(id)
        )
      `);

      // 4. Detalle de Ítems Vendidos
      await db.query(`
        CREATE TABLE IF NOT EXISTS pos_order_items (
          id INT AUTO_INCREMENT PRIMARY KEY,
          order_id INT NOT NULL,
          product_id INT NULL,
          code VARCHAR(50) NULL,
          description VARCHAR(255) NOT NULL,
          quantity DECIMAL(10, 2) NOT NULL,
          unit_measure VARCHAR(20) NOT NULL,
          unit_price DECIMAL(12, 2) NOT NULL,
          iva_rate DECIMAL(4, 2) NOT NULL,
          subtotal DECIMAL(12, 2) NOT NULL,
          FOREIGN KEY (order_id) REFERENCES pos_orders(id) ON DELETE CASCADE,
          FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
        )
      `);

      // 5. Pagos Múltiples
      await db.query(`
        CREATE TABLE IF NOT EXISTS pos_order_payments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          order_id INT NOT NULL,
          payment_method VARCHAR(50) NOT NULL,
          amount DECIMAL(12, 2) NOT NULL,
          FOREIGN KEY (order_id) REFERENCES pos_orders(id) ON DELETE CASCADE
        )
      `);

      // 6. Configuración General del POS y Comandera
      await db.query(`
        CREATE TABLE IF NOT EXISTS pos_config (
          id INT PRIMARY KEY DEFAULT 1,
          trade_name VARCHAR(100) NOT NULL DEFAULT 'Dulce Hora Villa Pueyrredon',
          business_owner VARCHAR(150) NOT NULL DEFAULT 'DONATO PABLO GABRIEL',
          cuit VARCHAR(20) NOT NULL DEFAULT '20443621033',
          gross_income VARCHAR(50) NOT NULL DEFAULT '20443621033',
          address VARCHAR(255) NOT NULL DEFAULT 'MOSCONI GRAL AV. 2268',
          activity_start DATE NOT NULL DEFAULT '2024-06-01',
          iva_condition VARCHAR(100) NOT NULL DEFAULT 'Monotributista',
          default_punto_venta INT NOT NULL DEFAULT 2,
          printer_paper_width INT NOT NULL DEFAULT 80
        )
      `);

      // Insertar configuración inicial por defecto si está vacía
      const confRows = await db.query('SELECT COUNT(*) as cnt FROM pos_config');
      const confCnt = confRows && confRows[0] ? (confRows[0].cnt || confRows[0]['COUNT(*)']) : 0;
      if (confCnt === 0) {
        await db.query(`
          INSERT INTO pos_config (id, trade_name, business_owner, cuit, gross_income, address, activity_start, iva_condition, default_punto_venta, printer_paper_width)
          VALUES (1, 'Dulce Hora Villa Pueyrredon', 'DONATO PABLO GABRIEL', '20443621033', '20443621033', 'MOSCONI GRAL AV. 2268', '2024-06-01', 'Monotributista', 2, 80)
        `);
      }

      // Insertar Mesas iniciales 1 a 10 si no existen
      const tableRows = await db.query('SELECT COUNT(*) as cnt FROM pos_tables');
      const tableCnt = tableRows && tableRows[0] ? (tableRows[0].cnt || tableRows[0]['COUNT(*)']) : 0;
      if (tableCnt === 0) {
        for (let i = 1; i <= 10; i++) {
          await db.query("INSERT INTO pos_tables (table_number, name, status) VALUES (?, ?, 'closed')", [i, `Mesa ${i}`]);
        }
      }

    } catch (e) {
      console.log('Migration 21 notice:', e.message);
      throw e;
    }
  }
};

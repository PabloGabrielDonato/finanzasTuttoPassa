module.exports = {
  name: '23_update_factureria_products.js',
  async up(db) {
    try {
      // 1. Desactivar y remover de acceso rápido todos los productos existentes en Facturería
      await db.query("UPDATE products SET is_active = 0, is_quick_access = 0 WHERE category = 'Facturería'");

      // 2. Definir las 3 únicas opciones de venta para Facturería
      const targetProducts = [
        {
          code: '100',
          name: 'Docena medialunas',
          description: 'Docena de medialunas',
          category: 'Facturería',
          price: 7000,
          unit_measure: 'docena',
          iva_rate: 10.5,
          auto_deduct_stock: 0,
          is_promo: 0,
          is_quick_access: 1,
          quick_access_order: 5
        },
        {
          code: '102',
          name: 'Docena surtidas',
          description: 'Docena de facturas surtidas',
          category: 'Facturería',
          price: 8500,
          unit_measure: 'docena',
          iva_rate: 10.5,
          auto_deduct_stock: 0,
          is_promo: 0,
          is_quick_access: 1,
          quick_access_order: 6
        },
        {
          code: '100-M',
          name: 'Media docena',
          description: 'Media docena de facturas / medialunas',
          category: 'Facturería',
          price: 4500,
          unit_measure: '1/2 docena',
          iva_rate: 10.5,
          auto_deduct_stock: 0,
          is_promo: 0,
          is_quick_access: 1,
          quick_access_order: 7
        }
      ];

      for (const p of targetProducts) {
        // Buscar si ya existe por código o por nombre
        const existing = await db.query(
          "SELECT id FROM products WHERE code = ? OR name = ?",
          [p.code, p.name]
        );

        if (existing.length === 0) {
          await db.query(`
            INSERT INTO products (
              code, name, description, category, price,
              unit_measure, iva_rate, auto_deduct_stock,
              is_promo, is_quick_access, quick_access_order, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
          `, [
            p.code,
            p.name,
            p.description,
            p.category,
            p.price,
            p.unit_measure,
            p.iva_rate,
            p.auto_deduct_stock,
            p.is_promo,
            p.is_quick_access,
            p.quick_access_order
          ]);
        } else {
          await db.query(`
            UPDATE products 
            SET code = ?, name = ?, description = ?, category = ?, price = ?,
                unit_measure = ?, iva_rate = ?, auto_deduct_stock = ?,
                is_promo = ?, is_quick_access = ?, quick_access_order = ?, is_active = 1
            WHERE id = ?
          `, [
            p.code,
            p.name,
            p.description,
            p.category,
            p.price,
            p.unit_measure,
            p.iva_rate,
            p.auto_deduct_stock,
            p.is_promo,
            p.is_quick_access,
            p.quick_access_order,
            existing[0].id
          ]);
        }
      }

      // 3. Actualizar Pan Francés para que se venda por unidad
      await db.query("UPDATE products SET unit_measure = 'unidad' WHERE code = '200' OR name LIKE '%Pan Francés%'");
      console.log('✅ Migración 23: Pan Francés configurado por unidad.');

      console.log('✅ Migración 23: Productos de Facturería actualizados con éxito (solo 3 opciones).');
    } catch (e) {
      console.error('❌ Error en migración 23:', e.message);
      throw e;
    }
  }
};

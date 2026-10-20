module.exports = {
  name: '24_seed_user_current_products.js',
  async up(db) {
    try {
      const catalog = [
        // --- CAFETERÍA ---
        { code: '1', name: 'Pocillo', description: 'espresso', price: 2800, iva_rate: 21.0, category: 'Cafetería', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 1, quick_access_order: 1 },
        { code: '2', name: 'Jarrito', description: 'cafe en Jarrito', price: 3800, iva_rate: 21.0, category: 'Cafetería', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 1, quick_access_order: 2 },
        { code: '3', name: 'desayuno', description: 'cafe desayuno', price: 4800, iva_rate: 21.0, category: 'Cafetería', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '5', name: 'MOCCA', description: 'MOCCA', price: 5300, iva_rate: 21.0, category: 'Cafetería', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '6', name: 'CAPUCCINO', description: 'CAPUCCINO', price: 5300, iva_rate: 21.0, category: 'Cafetería', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 1, quick_access_order: 3 },
        { code: '7', name: 'ESPECIAL', description: 'CAFE ESPECIAL CON JARABES', price: 6000, iva_rate: 21.0, category: 'Cafetería', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '8', name: 'TÉ', description: 'TE EN HEBRAS A ELECCION', price: 4500, iva_rate: 21.0, category: 'Cafetería', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '9', name: 'TÉ CON LECHE', description: 'TE EN HEBRAS A ELECCION CON LECHE', price: 5000, iva_rate: 21.0, category: 'Cafetería', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '10', name: 'MATECOCIDO', description: 'MATECOCIDO', price: 3000, iva_rate: 21.0, category: 'Cafetería', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '11', name: 'CHOCOLATADA', description: 'CHOCOLATADA', price: 4000, iva_rate: 21.0, category: 'Cafetería', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '29', name: 'SUBMARINO', description: 'submarino en taza capuccino', price: 5000, iva_rate: 21.0, category: 'Cafetería', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '30', name: 'CAFE AL PASO', description: 'CAFE AL PASO', price: 3800, iva_rate: 21.0, category: 'Cafetería', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '41', name: 'medialuna a la mesa', description: 'Medialuna individual servida en mesa', price: 1000, iva_rate: 21.0, category: 'Cafetería', unit_measure: 'unidad', auto_deduct_stock: 0, is_quick_access: 0, quick_access_order: 0 },
        { code: '48', name: 'especial para llevar', description: 'cafe para llevar con jarabe', price: 5000, iva_rate: 21.0, category: 'Cafetería', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '52', name: 'Cafe grande p llevar', description: 'Café grande para llevar', price: 5300, iva_rate: 21.0, category: 'Cafetería', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },

        // --- PROMOS & COMBOS ---
        { code: '12', name: 'CAFE MED + MEDI MESA', description: 'CAFE JARRITO CON 2 MEDIALUNAS', price: 5500, iva_rate: 21.0, category: 'Promos', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 1, quick_access_order: 4 },
        { code: '13', name: 'PORCION TOR + CAFE', description: 'PORCION DE TORTA A ELECCION + CAFE JARRITO', price: 13000, iva_rate: 21.0, category: 'Promos', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '14', name: 'CAFE + TOST AR', description: 'CAFE JARRITO+ TOSTADO ARABE', price: 8500, iva_rate: 21.0, category: 'Promos', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '16', name: 'CAFE + MEDIO TOST MIG', description: 'CAFE EN JARRITO + MEDIO TOSTADO DE MIGA', price: 7000, iva_rate: 21.0, category: 'Promos', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '19', name: 'jarrito + 2 chipa', description: 'cafe + 2 chipa', price: 5000, iva_rate: 21.0, category: 'Promos', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '21', name: 'cafe + porc budin', description: 'cafe + porcion de budin', price: 5000, iva_rate: 21.0, category: 'Promos', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '27', name: 'COOKIES X2', description: 'promo 2 cookies', price: 5000, iva_rate: 21.0, category: 'Promos', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '28', name: 'CAFE + MEDIALUNAS CON JYQ', description: 'CAFE EN JARRITO CON MEDIALUNAS CON JYQ', price: 7700, iva_rate: 21.0, category: 'Promos', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '31', name: 'Box desayuno para 2', description: 'Box de desayuno completa, incluye 2 porciones de torta, 2 chipa, 2 medialunas con jamon y queso, 6 facturas, 2 cafe para llevar, 1 caja', price: 35000, iva_rate: 21.0, category: 'Promos', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '32', name: 'brunch para 1', description: 'Brunch individual completo', price: 17000, iva_rate: 21.0, category: 'Promos', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '44', name: 'BRUNCH PARA 2', description: 'Brunch completo para 2 personas', price: 34000, iva_rate: 21.0, category: 'Promos', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '49', name: 'promo semana cafe', description: '2 cafe en jarrito + 4 medialunas', price: 7900, iva_rate: 21.0, category: 'Promos', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '51', name: 'PROMO DIA TORTA', description: 'Promo porción del día', price: 12000, iva_rate: 21.0, category: 'Promos', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '53', name: 'CAFE GRANDE PARA LLEVAR + MEDIALUNAS', description: 'Café grande para llevar con medialunas', price: 6500, iva_rate: 21.0, category: 'Promos', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '54', name: 'PROMO AMUERZO+BEBIDA+CAFE', description: 'TARTA DE JYQ + BEBIDA + CAFE EN JARRITO', price: 14900, iva_rate: 21.0, category: 'Promos', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '56', name: 'box dia de la madre', description: 'Box especial día de la madre', price: 35000, iva_rate: 21.0, category: 'Promos', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '57', name: '1/4 chipa + 2 cafe al paso', description: '1/4 chipa + 2 cafe al paso', price: 11500, iva_rate: 21.0, category: 'Promos', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '58', name: 'cafe + medialunas al paso', description: 'Café al paso con medialunas', price: 4900, iva_rate: 21.0, category: 'Promos', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '59', name: 'promo CAFE GRANDE MAS 250 DE CHIPA', description: 'PROMOCION NUMERO 2', price: 9900, iva_rate: 21.0, category: 'Promos', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '72', name: 'promo 2 chico', description: 'Promo 2 cafés chicos', price: 8300, iva_rate: 21.0, category: 'Promos', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },

        // --- SALADO ---
        { code: '15', name: 'TOSTADO MIGA', description: 'TOSTADO DE MIGA', price: 9000, iva_rate: 21.0, category: 'Salado', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '36', name: 'medialuna con jyq x2', description: 'medialuna con jyq x2', price: 3900, iva_rate: 21.0, category: 'Salado', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '38', name: 'TOSTADAS CON QUESO Y DULCE', description: 'TOSTADAS CON QUESO Y DULCE', price: 5500, iva_rate: 21.0, category: 'Salado', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '39', name: 'PASTEL DE PAPA MESA', description: 'PASTEL DE PAPA SERVIDO EN LA MESA', price: 12000, iva_rate: 21.0, category: 'Salado', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '47', name: 'ALMUERZO', description: 'Wrap + gaseosa', price: 12800, iva_rate: 21.0, category: 'Salado', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '50', name: 'AVOCADO TOAST', description: 'Tostón de palta y huevo', price: 8500, iva_rate: 21.0, category: 'Salado', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '55', name: 'medio miga', description: 'Medio tostado de miga', price: 4500, iva_rate: 21.0, category: 'Salado', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },

        // --- PASTELERÍA ---
        { code: '18', name: 'PORCION LEMON PIE', description: 'PORCION LEMON PIE', price: 6200, iva_rate: 21.0, category: 'Pastelería', unit_measure: 'porción', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '25', name: 'porcion red velvet', description: 'porcion de red velvet de torta entera', price: 9000, iva_rate: 21.0, category: 'Pastelería', unit_measure: 'porción', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '34', name: 'porcion de rogel', description: 'Porción de rogel con dulce de leche y merengue', price: 5625, iva_rate: 21.0, category: 'Pastelería', unit_measure: 'porción', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '37', name: 'porcion de mousse', description: 'Porción de mousse', price: 6675, iva_rate: 21.0, category: 'Pastelería', unit_measure: 'porción', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '40', name: 'porcion de chocotorta bizcochuelo', description: 'Porción de chocotorta con bizcochuelo', price: 7675, iva_rate: 21.0, category: 'Pastelería', unit_measure: 'porción', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '45', name: 'porcion cheescake oreo', description: 'Porción cheesecake de oreo', price: 7200, iva_rate: 21.0, category: 'Pastelería', unit_measure: 'porción', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '46', name: 'porcion de balcarce', description: 'Porción de postre balcarce', price: 9625, iva_rate: 21.0, category: 'Pastelería', unit_measure: 'porción', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },

        // --- BEBIDAS ---
        { code: '20', name: 'Exprimido de naranja', description: 'exprimido de naranja natural', price: 4500, iva_rate: 21.0, category: 'Bebidas', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '23', name: 'Agua Ivess', description: 'agua con o sin gas en botella de vidrio', price: 1800, iva_rate: 21.0, category: 'Bebidas', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '24', name: 'licuado', description: 'licuado de frutas de estacion', price: 5500, iva_rate: 21.0, category: 'Bebidas', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '33', name: 'sprite', description: 'gaseosa sprite', price: 3300, iva_rate: 21.0, category: 'Bebidas', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '35', name: 'agua saborizada', description: 'aquarius', price: 3000, iva_rate: 21.0, category: 'Bebidas', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '42', name: 'COCA COLA', description: 'gaseosa coca cola', price: 3300, iva_rate: 21.0, category: 'Bebidas', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '43', name: 'LIMONADA', description: 'limonada con menta y jengibre', price: 5000, iva_rate: 21.0, category: 'Bebidas', unit_measure: 'unidad', auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },

        // --- PANADERÍA ---
        { code: '22', name: 'surtido grasa', description: 'surtido grasa (libritos y bizcochos)', price: 3000, iva_rate: 21.0, category: 'Panadería', unit_measure: '250grs', auto_deduct_stock: 0, is_quick_access: 0, quick_access_order: 0 }
      ];

      for (const p of catalog) {
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
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, 1)
          `, [
            p.code,
            p.name,
            p.description || '',
            p.category,
            p.price,
            p.unit_measure,
            p.iva_rate,
            p.auto_deduct_stock,
            p.is_quick_access,
            p.quick_access_order
          ]);
        } else {
          await db.query(`
            UPDATE products 
            SET code = ?, name = ?, description = ?, category = ?, price = ?,
                unit_measure = ?, iva_rate = ?, auto_deduct_stock = ?,
                is_quick_access = ?, quick_access_order = ?, is_active = 1
            WHERE id = ?
          `, [
            p.code,
            p.name,
            p.description || '',
            p.category,
            p.price,
            p.unit_measure,
            p.iva_rate,
            p.auto_deduct_stock,
            p.is_quick_access,
            p.quick_access_order,
            existing[0].id
          ]);
        }
      }

      console.log('✅ Migración 24: Catálogo completo de 57 productos sincronizado con éxito.');
    } catch (e) {
      console.error('❌ Error en migración 24:', e.message);
      throw e;
    }
  }
};

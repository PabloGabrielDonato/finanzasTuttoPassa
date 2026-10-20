module.exports = {
  name: '22_seed_dulce_hora_products.js',
  async up(db) {
    try {
      const productsData = [
        // --- CAFETERÍA Y PROPIOS ---
        { code: '1', name: 'Pocillo', description: 'Espresso en pocillo', category: 'Cafetería', price: 2800, unit_measure: 'unidad', iva_rate: 21.0, auto_deduct_stock: 1, is_quick_access: 1, quick_access_order: 1 },
        { code: '2', name: 'Jarrito', description: 'Café en jarrito', category: 'Cafetería', price: 3800, unit_measure: 'unidad', iva_rate: 21.0, auto_deduct_stock: 1, is_quick_access: 1, quick_access_order: 2 },
        { code: '3', name: 'Desayuno', description: 'Café desayuno doble', category: 'Cafetería', price: 4800, unit_measure: 'unidad', iva_rate: 21.0, auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '5', name: 'MOCCA', description: 'Café mocca con chocolate', category: 'Cafetería', price: 5300, unit_measure: 'unidad', iva_rate: 21.0, auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '6', name: 'CAPUCCINO', description: 'Capuccino italiano', category: 'Cafetería', price: 5300, unit_measure: 'unidad', iva_rate: 21.0, auto_deduct_stock: 1, is_quick_access: 1, quick_access_order: 3 },
        { code: '7', name: 'ESPECIAL', description: 'Café especial con jarabes', category: 'Cafetería', price: 6000, unit_measure: 'unidad', iva_rate: 21.0, auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '8', name: 'TÉ', description: 'Té en hebras a elección', category: 'Cafetería', price: 4500, unit_measure: 'unidad', iva_rate: 21.0, auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '9', name: 'TÉ CON LECHE', description: 'Té en hebras con leche', category: 'Cafetería', price: 5000, unit_measure: 'unidad', iva_rate: 21.0, auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '10', name: 'MATECOCIDO', description: 'Matecocido clásico', category: 'Cafetería', price: 3000, unit_measure: 'unidad', iva_rate: 21.0, auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '11', name: 'CHOCOLATADA', description: 'Submarino / Chocolatada', category: 'Cafetería', price: 4000, unit_measure: 'unidad', iva_rate: 21.0, auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '12', name: 'CAFE MED + MEDI MESA', description: 'Café jarrito con 2 medialunas', category: 'Promos', price: 5500, unit_measure: 'unidad', iva_rate: 21.0, auto_deduct_stock: 1, is_promo: 1, is_quick_access: 1, quick_access_order: 4 },
        { code: '13', name: 'PORCION TOR + CAFE', description: 'Porción de torta a elección + café jarrito', category: 'Promos', price: 13000, unit_measure: 'unidad', iva_rate: 21.0, auto_deduct_stock: 1, is_promo: 1, is_quick_access: 0, quick_access_order: 0 },

        // --- FACTURERÍA (Stock Manual auto_deduct_stock: 0) ---
        { code: '100', name: 'Docena medialunas', description: 'Docena de medialunas', category: 'Facturería', price: 7000, unit_measure: 'docena', iva_rate: 10.5, auto_deduct_stock: 0, is_quick_access: 1, quick_access_order: 5 },
        { code: '102', name: 'Docena surtidas', description: 'Docena de facturas surtidas', category: 'Facturería', price: 8500, unit_measure: 'docena', iva_rate: 10.5, auto_deduct_stock: 0, is_quick_access: 1, quick_access_order: 6 },
        { code: '100-M', name: 'Media docena', description: 'Media docena de facturas / medialunas', category: 'Facturería', price: 4500, unit_measure: '1/2 docena', iva_rate: 10.5, auto_deduct_stock: 0, is_quick_access: 1, quick_access_order: 7 },


        // --- PANADERÍA Y BIZCOCHERÍA ---
        { code: '200', name: 'Pan Francés', description: 'Pan francés fresco', category: 'Panadería', price: 4000, unit_measure: 'unidad', iva_rate: 10.5, auto_deduct_stock: 0, is_quick_access: 1, quick_access_order: 9 },
        { code: '201', name: 'Pan de Salvado', description: 'Pan de salvado', category: 'Panadería', price: 4800, unit_measure: 'kilo', iva_rate: 10.5, auto_deduct_stock: 0, is_quick_access: 0, quick_access_order: 0 },
        { code: '202', name: 'Pan de Campo', description: 'Pan de campo artesanal', category: 'Panadería', price: 2530, unit_measure: 'unidad', iva_rate: 10.5, auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 }, // SÍ descuenta
        { code: '203', name: 'Figaza de Manteca (x250grs)', description: 'Figaza de manteca crocante', category: 'Panadería', price: 1100, unit_measure: '250grs', iva_rate: 10.5, auto_deduct_stock: 0, is_quick_access: 1, quick_access_order: 10 },
        { code: '206', name: 'Bizcocho Grasa (x250grs)', description: 'Bizcochitos de grasa por cuarto', category: 'Panadería', price: 3200, unit_measure: '250grs', iva_rate: 10.5, auto_deduct_stock: 0, is_quick_access: 1, quick_access_order: 11 },
        { code: '207', name: 'Criollo (x250grs)', description: 'Criollitos hojaldrados por cuarto', category: 'Panadería', price: 3600, unit_measure: '250grs', iva_rate: 10.5, auto_deduct_stock: 0, is_quick_access: 1, quick_access_order: 12 },
        { code: '208', name: 'Cremona (Unidad)', description: 'Cremona hojaldrada grande', category: 'Panadería', price: 2600, unit_measure: 'unidad', iva_rate: 10.5, auto_deduct_stock: 0, is_quick_access: 1, quick_access_order: 13 },
        { code: '209', name: 'Chipa (x250grs)', description: 'Chipá de queso recién horneado', category: 'Panadería', price: 5200, unit_measure: '250grs', iva_rate: 10.5, auto_deduct_stock: 0, is_quick_access: 1, quick_access_order: 14 },
        { code: '210', name: 'Prepizza', description: 'Prepizza de tomate al molde', category: 'Panadería', price: 2800, unit_measure: 'unidad', iva_rate: 10.5, auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 }, // SÍ descuenta
        { code: '213', name: 'Baguette Francés', description: 'Baguette tradicional', category: 'Panadería', price: 1000, unit_measure: 'unidad', iva_rate: 10.5, auto_deduct_stock: 0, is_quick_access: 0, quick_access_order: 0 }, // Manual
        { code: '214', name: 'Baguette Salvado', description: 'Baguette con salvado', category: 'Panadería', price: 1100, unit_measure: 'unidad', iva_rate: 10.5, auto_deduct_stock: 0, is_quick_access: 0, quick_access_order: 0 }, // Manual
        { code: '993', name: 'Pastelitos Membrillo', description: 'Pastelito hojaldrado de membrillo', category: 'Panadería', price: 1600, unit_measure: 'unidad', iva_rate: 10.5, auto_deduct_stock: 0, is_quick_access: 0, quick_access_order: 0 }, // Manual
        { code: '418', name: 'Scon de Queso', description: 'Scon de queso casero', category: 'Panadería', price: 4400, unit_measure: 'unidad', iva_rate: 10.5, auto_deduct_stock: 0, is_quick_access: 0, quick_access_order: 0 }, // Manual

        // --- PASTELERÍA (SÍ descuentan automático salvo cookies secas al peso) ---
        { code: '300', name: 'Pote Cheesecake Frutos Rojos', description: 'Postre individual cheesecake', category: 'Pastelería', price: 5600, unit_measure: 'unidad', iva_rate: 21.0, auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '301', name: 'Pote Chocotorta', description: 'Postre individual chocotorta clásica', category: 'Pastelería', price: 5600, unit_measure: 'unidad', iva_rate: 21.0, auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '303', name: 'Pote Oreo', description: 'Postre individual con crema oreo', category: 'Pastelería', price: 5600, unit_measure: 'unidad', iva_rate: 21.0, auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '307', name: 'Postre Tiramisú', description: 'Tiramisú italiano en pote', category: 'Pastelería', price: 5200, unit_measure: 'unidad', iva_rate: 21.0, auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '308', name: 'Pepa Membrillo (x250grs)', description: 'Pepas de membrillo caseras', category: 'Pastelería', price: 4800, unit_measure: '250grs', iva_rate: 21.0, auto_deduct_stock: 0, is_quick_access: 0, quick_access_order: 0 }, // Manual
        { code: '310', name: 'Cookies de Limón (x250grs)', description: 'Cookies secas de limón', category: 'Pastelería', price: 6200, unit_measure: '250grs', iva_rate: 21.0, auto_deduct_stock: 0, is_quick_access: 0, quick_access_order: 0 }, // Manual
        { code: '316', name: 'Conito Negro (x250grs)', description: 'Conitos de dulce de leche bañados', category: 'Pastelería', price: 6200, unit_measure: '250grs', iva_rate: 21.0, auto_deduct_stock: 0, is_quick_access: 0, quick_access_order: 0 }, // Manual
        { code: '322', name: 'Alfajor Maicena Grande', description: 'Alfajor grande de maicena con coco', category: 'Pastelería', price: 3500, unit_measure: 'unidad', iva_rate: 21.0, auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '323', name: 'Alfajor Chocolate Negro', description: 'Alfajor grande relleno con DDL bañado en chocolate', category: 'Pastelería', price: 3500, unit_measure: 'unidad', iva_rate: 21.0, auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '326', name: 'Budín Vainilla', description: 'Budín artesanal de vainilla', category: 'Pastelería', price: 7400, unit_measure: 'unidad', iva_rate: 21.0, auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '328', name: 'Budín Marmolado', description: 'Budín marmolado vainilla y chocolate', category: 'Pastelería', price: 8900, unit_measure: 'unidad', iva_rate: 21.0, auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '337', name: 'Tarta Frola de Membrillo', description: 'Pastafrola entera de membrillo', category: 'Pastelería', price: 17600, unit_measure: 'unidad', iva_rate: 21.0, auto_deduct_stock: 1, is_quick_access: 1, quick_access_order: 15 },
        { code: '338', name: 'Tarta Frola de Batata', description: 'Pastafrola entera de batata', category: 'Pastelería', price: 17600, unit_measure: 'unidad', iva_rate: 21.0, auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '340', name: 'Tarta de Ricota', description: 'Tarta tradicional de ricota', category: 'Pastelería', price: 18700, unit_measure: 'unidad', iva_rate: 21.0, auto_deduct_stock: 1, is_quick_access: 1, quick_access_order: 16 },
        { code: '346', name: 'Porción Brownie', description: 'Porción de brownie húmedo', category: 'Pastelería', price: 3700, unit_measure: 'unidad', iva_rate: 21.0, auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '352', name: 'Lemon Pie', description: 'Lemon pie artesanal con merengue', category: 'Pastelería', price: 20600, unit_measure: 'unidad', iva_rate: 21.0, auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },

        // --- SECTOR SALADO (SÍ descuentan automático) ---
        { code: '500', name: 'Sandwich Miga Blanco J&Q (Unidad)', description: 'Sandwich de miga pan blanco jamón y queso', category: 'Salado', price: 3100, unit_measure: 'unidad', iva_rate: 21.0, auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '501', name: 'Sandwich Miga Negro J&Q (Paquete x6)', description: 'Paquete de 6 sandwiches de miga pan negro J&Q', category: 'Salado', price: 18600, unit_measure: 'paquete', iva_rate: 21.0, auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '504', name: 'Tarta de Jamón y Queso', description: 'Tarta individual de jamón y queso', category: 'Salado', price: 8000, unit_measure: 'unidad', iva_rate: 21.0, auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '505', name: 'Tarta Caprese', description: 'Tarta individual de tomate, albahaca y queso', category: 'Salado', price: 8000, unit_measure: 'unidad', iva_rate: 21.0, auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '508', name: 'Wrap J&Q', description: 'Wrap caliente de jamón y queso', category: 'Salado', price: 8000, unit_measure: 'unidad', iva_rate: 21.0, auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '509', name: 'Wrap Carne & Criolla', description: 'Wrap de carne braseada con salsa criolla', category: 'Salado', price: 8600, unit_measure: 'unidad', iva_rate: 21.0, auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '513', name: 'Pastel de Papa', description: 'Pastel de papa tradicional', category: 'Salado', price: 10900, unit_measure: 'unidad', iva_rate: 21.0, auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 },
        { code: '516', name: 'Pizza Muzzarella Refrigerada', description: 'Pizza a la piedra con muzzarella lista para hornear', category: 'Salado', price: 10900, unit_measure: 'unidad', iva_rate: 21.0, auto_deduct_stock: 1, is_quick_access: 0, quick_access_order: 0 }
      ];

      for (const p of productsData) {
        // Verificar si el producto ya existe por código o nombre
        const existing = await db.query('SELECT id FROM products WHERE code = ? OR name = ?', [p.code, p.name]);
        if (existing.length === 0) {
          await db.query(`
            INSERT INTO products (code, name, description, category, price, unit_measure, iva_rate, auto_deduct_stock, is_promo, is_quick_access, quick_access_order, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
          `, [
            p.code,
            p.name,
            p.description || '',
            p.category,
            p.price,
            p.unit_measure,
            p.iva_rate,
            p.auto_deduct_stock,
            p.is_promo || 0,
            p.is_quick_access || 0,
            p.quick_access_order || 0
          ]);
        } else {
          // Actualizar atributos
          await db.query(`
            UPDATE products 
            SET code = ?, description = ?, category = ?, price = ?, unit_measure = ?, iva_rate = ?, auto_deduct_stock = ?, is_promo = ?, is_quick_access = ?, quick_access_order = ?
            WHERE id = ?
          `, [
            p.code,
            p.description || '',
            p.category,
            p.price,
            p.unit_measure,
            p.iva_rate,
            p.auto_deduct_stock,
            p.is_promo || 0,
            p.is_quick_access || 0,
            p.quick_access_order || 0,
            existing[0].id
          ]);
        }
      }

      console.log('Catálogo de Dulce Hora cargado con éxito.');
    } catch (e) {
      console.log('Migration 22 notice:', e.message);
      throw e;
    }
  }
};

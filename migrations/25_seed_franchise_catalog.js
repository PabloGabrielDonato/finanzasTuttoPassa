module.exports = {
  name: '25_seed_franchise_catalog.js',
  async up(db) {
    try {
      const franchiseProducts = [
        // --- ALFAJORES ---
        { code: '322', name: 'ALFAJOR DE MAICENA', description: 'Alfajor de maicena con coco', category: 'Pastelería', price: 3500, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '323', name: 'ALFAJOR CHOCOLATE NEGRO', description: 'Alfajor relleno con dulce de leche bañado en chocolate negro', category: 'Pastelería', price: 3500, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '324', name: 'ALFAJOR CHOCOLATE BLANCO', description: 'Alfajor relleno con dulce de leche bañado en chocolate blanco', category: 'Pastelería', price: 3500, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '325', name: 'ALFAJOR AZUCAR IMPALPABLE', description: 'Alfajor con azúcar impalpable', category: 'Pastelería', price: 3500, unit_measure: 'unidad', iva_rate: 21.0 },

        // --- BUDIN KILO ---
        { code: '335', name: 'BUDIN MARMOLADO 1KG', description: 'Budín marmolado por kilo', category: 'Pastelería', price: 5200, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '336', name: 'BUDIN DE AMAPOLA Y LIMON 1KG', description: 'Budín de amapola y limón por kilo', category: 'Pastelería', price: 5200, unit_measure: 'unidad', iva_rate: 21.0 },

        // --- BIZCOCHOS ---
        { code: '206', name: 'BIZCOCHO GRASA', description: 'Bizcochitos de grasa por kilo', category: 'Panadería', price: 12800, unit_measure: 'kilo', iva_rate: 10.5 },
        { code: '207', name: 'CRIOLLO', description: 'Criollitos hojaldrados por kilo', category: 'Panadería', price: 14400, unit_measure: 'kilo', iva_rate: 10.5 },
        { code: '208', name: 'CREMONA', description: 'Cremona hojaldrada', category: 'Panadería', price: 2600, unit_measure: 'unidad', iva_rate: 10.5 },
        { code: '209', name: 'CHIPA', description: 'Chipá de queso por kilo', category: 'Panadería', price: 20800, unit_measure: 'kilo', iva_rate: 10.5 },
        { code: '993', name: 'Pastelito', description: 'Pastelito hojaldrado individual', category: 'Panadería', price: 1600, unit_measure: 'unidad', iva_rate: 10.5 },

        // --- BUDINES ---
        { code: '326', name: 'BUDIN VAINILLA', description: 'Budín de vainilla', category: 'Pastelería', price: 7400, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '327', name: 'BUDIN CHOCOLATE', description: 'Budín de chocolate', category: 'Pastelería', price: 7400, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '328', name: 'BUDIN MARMOLADO', description: 'Budín marmolado', category: 'Pastelería', price: 8900, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '329', name: 'BUDIN LIMON', description: 'Budín de limón', category: 'Pastelería', price: 8900, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '330', name: 'BUDIN NARANJA', description: 'Budín de naranja', category: 'Pastelería', price: 8900, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '331', name: 'BUDIN VAINILLA CON CHIPS', description: 'Budín de vainilla con chips de chocolate', category: 'Pastelería', price: 9500, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '332', name: 'BUDIN VAINILLA CON DULCE DE LECHE', description: 'Budín de vainilla con dulce de leche', category: 'Pastelería', price: 9500, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '333', name: 'BUDIN CHOCOLATE CON DULCE DE LECHE', description: 'Budín de chocolate con dulce de leche', category: 'Pastelería', price: 9500, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '334', name: 'BUDIN ZANAHORIA', description: 'Budín de zanahoria (Carrot cake)', category: 'Pastelería', price: 7600, unit_measure: 'unidad', iva_rate: 21.0 },

        // --- CUARTOS (Secos x 250grs) ---
        { code: '308', name: 'PEPA MEMBRILLO', description: 'Pepas de membrillo x250grs', category: 'Pastelería', price: 4800, unit_measure: '250grs', iva_rate: 21.0 },
        { code: '309', name: 'PEPA BATATA', description: 'Pepas de batata x250grs', category: 'Pastelería', price: 4800, unit_measure: '250grs', iva_rate: 21.0 },
        { code: '310', name: 'COOKIES DE LIMON', description: 'Cookies secas de limón x250grs', category: 'Pastelería', price: 6200, unit_measure: '250grs', iva_rate: 21.0 },
        { code: '311', name: 'ROSQUITA MAICENA', description: 'Rosquitas de maicena x250grs', category: 'Pastelería', price: 6700, unit_measure: '250grs', iva_rate: 21.0 },
        { code: '312', name: 'ALFAJORCITO MAICENA', description: 'Alfajorcitos de maicena x250grs', category: 'Pastelería', price: 6200, unit_measure: '250grs', iva_rate: 21.0 },
        { code: '313', name: 'ALFAJORCITO AZUCAR IMPALPABLE', description: 'Alfajorcitos azúcar impalpable x250grs', category: 'Pastelería', price: 6200, unit_measure: '250grs', iva_rate: 21.0 },
        { code: '314', name: 'ALFAJORCITO CHOCO NEGRO', description: 'Alfajorcitos de chocolate negro x250grs', category: 'Pastelería', price: 6200, unit_measure: '250grs', iva_rate: 21.0 },
        { code: '315', name: 'ALFAJORCITO CHOCO BLANCO', description: 'Alfajorcitos de chocolate blanco x250grs', category: 'Pastelería', price: 6200, unit_measure: '250grs', iva_rate: 21.0 },
        { code: '316', name: 'CONITO NEGRO', description: 'Conitos de dulce de leche bañado en choco negro x250grs', category: 'Pastelería', price: 6200, unit_measure: '250grs', iva_rate: 21.0 },
        { code: '317', name: 'CONITO BLANCO', description: 'Conitos de dulce de leche bañado en choco blanco x250grs', category: 'Pastelería', price: 6200, unit_measure: '250grs', iva_rate: 21.0 },
        { code: '318', name: 'PEPA MEMBRILLO CON CHOCOLATE', description: 'Pepas de membrillo bañadas en chocolate x250grs', category: 'Pastelería', price: 6600, unit_measure: '250grs', iva_rate: 21.0 },
        { code: '319', name: 'PEPA DE CHOCO CON DULCE DE LECHE', description: 'Pepas de masa de choco con dulce de leche x250grs', category: 'Pastelería', price: 6600, unit_measure: '250grs', iva_rate: 21.0 },
        { code: '320', name: 'ARITO CON DULCE DE LECHE Y CHOCO NEGRO', description: 'Aritos con DDL y chocolate negro x250grs', category: 'Pastelería', price: 6600, unit_measure: '250grs', iva_rate: 21.0 },
        { code: '321', name: 'ALFAJOR SANTAFESINO', description: 'Alfajor santafesino glaseado', category: 'Pastelería', price: 6200, unit_measure: '250grs', iva_rate: 21.0 },
        { code: '603', name: 'COOKIES', description: 'Cookies secas variadas x250grs', category: 'Pastelería', price: 4800, unit_measure: '250grs', iva_rate: 21.0 },

        // --- DELICITY ---
        { code: '379', name: 'COOKIES DE CHOCOLATE', description: 'Cookies Delicity de chocolate', category: 'Pastelería', price: 3000, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '380', name: 'COOKIES DE ROCKLETS', description: 'Cookies Delicity con rocklets', category: 'Pastelería', price: 3000, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '381', name: 'COOKIES DE MANI', description: 'Cookies Delicity de maní', category: 'Pastelería', price: 3000, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '418', name: 'SCON DE QUESO DELICITY', description: 'Scon casero de queso Delicity', category: 'Panadería', price: 4400, unit_measure: 'unidad', iva_rate: 10.5 },

        // --- FACTURAS ---
        { code: '101', name: 'Medialunas', description: 'Medialuna individual de manteca o grasa', category: 'Facturería', price: 750, unit_measure: 'unidad', iva_rate: 10.5 },
        { code: '102', name: 'Surtidas', description: 'Factura surtida individual', category: 'Facturería', price: 750, unit_measure: 'unidad', iva_rate: 10.5 },

        // --- MASAS SECAS ---
        { code: '384', name: 'Box dia de la madre', description: 'Box masas secas día de la madre', category: 'Pastelería', price: 20000, unit_measure: 'unidad', iva_rate: 21.0 },

        // --- PREPIZZA ---
        { code: '210', name: 'PREPIZZA TOMATE', description: 'Prepizza casera de tomate al molde', category: 'Panadería', price: 2800, unit_measure: 'unidad', iva_rate: 10.5 },

        // --- PAN ---
        { code: '200', name: 'Pan Frances', description: 'Pan francés fresco por unidad', category: 'Panadería', price: 400, unit_measure: 'unidad', iva_rate: 10.5 },
        { code: '201', name: 'PAN DE SALVADO', description: 'Pan de salvado por unidad', category: 'Panadería', price: 500, unit_measure: 'unidad', iva_rate: 10.5 },
        { code: '202', name: 'PAN DE CAMPO', description: 'Pan de campo artesanal', category: 'Panadería', price: 2530, unit_measure: 'unidad', iva_rate: 10.5 },
        { code: '203', name: 'Figaza de manteca', description: 'Figaza de manteca crocante por kilo', category: 'Panadería', price: 4400, unit_measure: 'kilo', iva_rate: 10.5 },
        { code: '204', name: 'PAN MIÑON FRANCES', description: 'Pan miñón francés por kilo', category: 'Panadería', price: 4200, unit_measure: 'kilo', iva_rate: 10.5 },
        { code: '205', name: 'PAN MIÑON SALVADO', description: 'Pan miñón de salvado por kilo', category: 'Panadería', price: 4900, unit_measure: 'kilo', iva_rate: 10.5 },
        { code: '213', name: 'BAGUETTE FRANCES', description: 'Baguette tradicional francesa', category: 'Panadería', price: 1000, unit_measure: 'unidad', iva_rate: 10.5 },
        { code: '214', name: 'BAGUETTE SALVADO', description: 'Baguette con salvado', category: 'Panadería', price: 1100, unit_measure: 'unidad', iva_rate: 10.5 },
        { code: '994', name: 'PASTELITOS DULCE DE LECHE', description: 'Pastelitos de dulce de leche', category: 'Panadería', price: 1600, unit_measure: 'unidad', iva_rate: 10.5 },

        // --- PASCUA ---
        { code: '615', name: 'Rosca de pascuas', description: 'Rosca artesanal de pascuas', category: 'Pastelería', price: 0, unit_measure: 'unidad', iva_rate: 21.0 },

        // --- PORCIONES ---
        { code: '344', name: 'PORCION DE MEMBRILLO', description: 'Porción de pastafrola de membrillo', category: 'Pastelería', price: 4500, unit_measure: 'porción', iva_rate: 21.0 },
        { code: '345', name: 'PORCION BATATA', description: 'Porción de pastafrola de batata', category: 'Pastelería', price: 4500, unit_measure: 'porción', iva_rate: 21.0 },
        { code: '346', name: 'PORCION BROWNIE', description: 'Porción de brownie de chocolate', category: 'Pastelería', price: 3700, unit_measure: 'porción', iva_rate: 21.0 },
        { code: '347', name: 'PORCIO BROWNIE LIMON', description: 'Porción de brownie de limón (blondie)', category: 'Pastelería', price: 3700, unit_measure: 'porción', iva_rate: 21.0 },
        { code: '348', name: 'PORCION BROWNIE NARANJA', description: 'Porción de brownie de naranja', category: 'Pastelería', price: 3700, unit_measure: 'porción', iva_rate: 21.0 },
        { code: '349', name: 'PORCION RICOTTA', description: 'Porción de tarta de ricota', category: 'Pastelería', price: 6800, unit_measure: 'porción', iva_rate: 21.0 },
        { code: '350', name: 'PORCION MANZANA', description: 'Porción de tarta de manzana', category: 'Pastelería', price: 6800, unit_measure: 'porción', iva_rate: 21.0 },

        // --- POSTRES ---
        { code: '300', name: 'POTE CHEESECAKE FRUTOS ROJOS', description: 'Postre individual cheesecake frutos rojos', category: 'Pastelería', price: 5600, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '301', name: 'POTE CHOCOTORTA', description: 'Postre individual chocotorta clásica', category: 'Pastelería', price: 5600, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '302', name: 'POTE MOUSSE DE CHOCOLATE', description: 'Postre individual mousse de chocolate', category: 'Pastelería', price: 5200, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '303', name: 'POTE OREO', description: 'Postre individual con crema oreo', category: 'Pastelería', price: 5600, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '304', name: 'POSTE CHEESECAKE MARACUYA', description: 'Postre cheesecake maracuyá en pote', category: 'Pastelería', price: 5600, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '306', name: 'POSTRE DURAZNO', description: 'Postre individual de durazno', category: 'Pastelería', price: 5600, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '307', name: 'POSTRE TIRAMUZU', description: 'Postre tiramisú italiano en pote', category: 'Pastelería', price: 5200, unit_measure: 'unidad', iva_rate: 21.0 },

        // --- PRODUCTOS SALADOS ---
        { code: '500', name: 'SANDWICH DE MIGA BLANCO JYQ', description: 'Sándwich de miga blanco jamón y queso', category: 'Salado', price: 3100, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '501', name: 'SANDWICH DE MIGA NEGRO JYQ', description: 'Sándwich de miga negro jamón y queso', category: 'Salado', price: 3100, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '504', name: 'TARTA DE JyQ', description: 'Tarta individual de jamón y queso', category: 'Salado', price: 8000, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '505', name: 'TARTA CAPRESE', description: 'Tarta caprese (tomate, muzzarella y albahaca)', category: 'Salado', price: 8000, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '506', name: 'TARTA DE CALABAZAyQ', description: 'Tarta de calabaza y queso', category: 'Salado', price: 8000, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '507', name: 'TARTA CA,AC,CHyQ', description: 'Tarta combinada de verdura, choclo y queso', category: 'Salado', price: 8000, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '508', name: 'WRAP JyQ', description: 'Wrap de jamón y queso', category: 'Salado', price: 8000, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '509', name: 'WRAP CARNEyCRIOLLA', description: 'Wrap de carne y salsa criolla', category: 'Salado', price: 8600, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '510', name: 'WRAP CAPRESE', description: 'Wrap caprese', category: 'Salado', price: 8000, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '511', name: 'ENSALADA LECHUGA', description: 'Ensalada fresca base lechuga', category: 'Salado', price: 8300, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '512', name: 'ENSALADA RUCULA', description: 'Ensalada fresca base rúcula y parmesano', category: 'Salado', price: 8300, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '513', name: 'Pastel De Papa', description: 'Pastel de papa tradicional', category: 'Salado', price: 10900, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '514', name: 'Pastel De Calabaza', description: 'Pastel de calabaza vegetariano', category: 'Salado', price: 10900, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '515', name: 'ARABE CON JyQ', description: 'Sándwich pan árabe con jamón y queso', category: 'Salado', price: 5100, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '516', name: 'PIZZA MUZZARELLA', description: 'Pizza individual de muzzarella', category: 'Salado', price: 10900, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '517', name: 'PIZZA CEBOLLA', description: 'Pizza fugazzeta de cebolla y queso', category: 'Salado', price: 10900, unit_measure: 'unidad', iva_rate: 21.0 },

        // --- TARTA HUMEDA ---
        { code: '340', name: 'TARTA DE RICOTA', description: 'Tarta entera de ricota artesanal', category: 'Pastelería', price: 18700, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '341', name: 'TARTA RICOTA CON DULCE DE LECHE', description: 'Tarta de ricota con dulce de leche', category: 'Pastelería', price: 18700, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '342', name: 'TARTA DE MANZANA', description: 'Tarta crumble de manzana', category: 'Pastelería', price: 18700, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '343', name: 'TARTA DE COCO Y DULCE DE LECHE', description: 'Tarta de coco y dulce de leche', category: 'Pastelería', price: 18700, unit_measure: 'unidad', iva_rate: 21.0 },

        // --- TARTA SECA ---
        { code: '337', name: 'TARTA FROLA DE MEMBRILLO', description: 'Pastafrola entera de membrillo', category: 'Pastelería', price: 17600, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '338', name: 'TARTA FROLA DE BATATA', description: 'Pastafrola entera de batata', category: 'Pastelería', price: 17600, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '339', name: 'TARTA FROLA BATATA Y MEMBRILLO', description: 'Pastafrola mixta de batata y membrillo', category: 'Pastelería', price: 17600, unit_measure: 'unidad', iva_rate: 21.0 },

        // --- TORTAS ---
        { code: '351', name: 'TARTA DE BANANA', description: 'Tarta de banana y dulce de leche', category: 'Pastelería', price: 24600, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '352', name: 'LEMON PIE', description: 'Lemon pie clásico con merengue', category: 'Pastelería', price: 20600, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '353', name: 'COPITO NEGROS', description: 'Torta de copitos de dulce de leche y chocolate', category: 'Pastelería', price: 25100, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '354', name: 'CHOCOTORTA BIZCOCHUELO GRANDE', description: 'Chocotorta con bizcochuelo grande', category: 'Pastelería', price: 30700, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '355', name: 'TIRAMISU', description: 'Torta tiramisú entera', category: 'Pastelería', price: 30700, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '356', name: 'ROGEL GRANDE', description: 'Torta rogel grande con capas y merengue', category: 'Pastelería', price: 22500, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '357', name: 'TARTA DE FRUTILLA Y PASTELERA', description: 'Tarta fresca de frutillas con crema pastelera', category: 'Pastelería', price: 35000, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '358', name: 'DULCE HORA GRANDE', description: 'Torta especial Dulce Hora grande', category: 'Pastelería', price: 20500, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '359', name: 'BALCARCE', description: 'Postre balcarce entero artesanal', category: 'Pastelería', price: 38500, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '360', name: 'MOUSSE DE CHOCOLATE', description: 'Torta mousse de chocolate', category: 'Pastelería', price: 26700, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '361', name: 'MULATA', description: 'Torta mulata de chocolate', category: 'Pastelería', price: 29700, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '362', name: 'CHEESECAKE FRUTOS ROJOS', description: 'Cheesecake horneado con frutos rojos', category: 'Pastelería', price: 29700, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '363', name: 'CHEESECAKE OREO', description: 'Cheesecake de galletitas oreo', category: 'Pastelería', price: 28600, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '364', name: 'CHEESECAKE DE DULCE DE LECHE', description: 'Cheesecake con dulce de leche', category: 'Pastelería', price: 23700, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '365', name: 'CHEESECAKE DE MARACUYA', description: 'Cheesecake con salsa de maracuyá', category: 'Pastelería', price: 31900, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '366', name: 'TENTACION', description: 'Torta tentación', category: 'Pastelería', price: 29700, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '367', name: 'MATILDA', description: 'Torta Matilda super chocolate', category: 'Pastelería', price: 39000, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '368', name: 'RED VELVET', description: 'Torta Red Velvet entera', category: 'Pastelería', price: 34100, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '370', name: 'CHAJA', description: 'Postre chajá uruguayo con durazno y merengue', category: 'Pastelería', price: 29900, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '372', name: 'MINI ROGEL', description: 'Mini torta rogel individual', category: 'Pastelería', price: 10100, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '373', name: 'MINI DULCE HORA', description: 'Mini torta Dulce Hora individual', category: 'Pastelería', price: 10100, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '374', name: 'MINI RED VELVET', description: 'Mini torta Red Velvet individual', category: 'Pastelería', price: 10100, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '375', name: 'MINI MATILDA', description: 'Mini torta Matilda individual', category: 'Pastelería', price: 10100, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '376', name: 'Key Lime Pie', description: 'Torta Key Lime Pie de lima', category: 'Pastelería', price: 27500, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '377', name: 'Sambayon', description: 'Torta al sambayón', category: 'Pastelería', price: 27500, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '382', name: 'Carrot Cake', description: 'Torta Carrot Cake con frosting', category: 'Pastelería', price: 35000, unit_measure: 'unidad', iva_rate: 21.0 },
        { code: '383', name: 'Frutilla con arandanos', description: 'Tarta fresca de frutilla con arándanos', category: 'Pastelería', price: 30000, unit_measure: 'unidad', iva_rate: 21.0 },

        // --- VARIOS ---
        { code: '105', name: 'Varios 10.5%', description: 'Venta miscelánea alícuota 10.5%', category: 'Varios', price: 0, unit_measure: 'unidad', iva_rate: 10.5 },
        { code: '999', name: 'Varios 21%', description: 'Venta miscelánea alícuota 21.0%', category: 'Varios', price: 0, unit_measure: 'unidad', iva_rate: 21.0 }
      ];

      for (const p of franchiseProducts) {
        // Verificar por código o nombre
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
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 1, 0, 0, 0, 1)
          `, [
            p.code,
            p.name,
            p.description || '',
            p.category,
            p.price,
            p.unit_measure,
            p.iva_rate
          ]);
        } else {
          await db.query(`
            UPDATE products 
            SET code = ?, name = ?, description = ?, category = ?, price = ?,
                unit_measure = ?, iva_rate = ?, is_active = 1
            WHERE id = ?
          `, [
            p.code,
            p.name,
            p.description || '',
            p.category,
            p.price,
            p.unit_measure,
            p.iva_rate,
            existing[0].id
          ]);
        }
      }

      console.log('✅ Migración 25: Catálogo oficial de la franquicia verificado e incorporado con éxito.');
    } catch (e) {
      console.error('❌ Error en migración 25:', e.message);
      throw e;
    }
  }
};

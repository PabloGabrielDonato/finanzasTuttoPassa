# Guía de Implementación: Sistema de Cobros (POS) con Caja Diaria y Facturación Electrónica ARCA (ex-AFIP)

Este documento detalla paso a paso la arquitectura, requisitos fiscales, modelo de datos y diseño técnico para incorporar un **módulo de cobranzas en punto de venta (POS)** con actualización automática de la **Caja Diaria** y emisión opcional de **Factura Electrónica en ARCA**.

---

## 1. Visión General del Flujo

```mermaid
flowchart TD
    A[Terminal de Cobro: Seleccionar Productos] --> B[Calcular Total de la Orden]
    B --> C[Seleccionar Método de Pago:\nEfectivo / Transferencia / Billetera Virtual]
    C --> D{¿Emitir Factura Electrónica?\n(Por defecto: NO)}
    
    D -- NO (Opción Predeterminada) --> E[Registrar Venta Interna]
    E --> F[Impactar Ingreso en Caja Diaria]
    F --> G[Descontar Stock en Catálogo]
    G --> H[Finalizar Cobro]

    D -- SÍ (Activado por el usuario) --> I[Solicitar Datos de Cliente:\nConsumidor Final o DNI/CUIT]
    I --> J[Backend se conecta a ARCA WSFEv1]
    J --> K{¿ARCA aprueba?}
    K -- ERROR / TIMEOUT --> L[Avisar al Cajero:\n¿Reintentar o Cobrar sin Factura?]
    K -- OK --> M[Obtener CAE y Fecha de Vencimiento]
    M --> N[Generar Código QR Fiscal en Base64]
    N --> E
    H --> O[Opcional: Imprimir Ticket Fiscal con QR o PDF]
```

---

## 2. Marco Técnico y Normativo de ARCA (ex-AFIP)

Aunque la entidad recaudadora pasó a denominarse **ARCA** (Agencia de Recaudación y Control Aduanero), la plataforma de integración sigue los mismos protocolos y Web Services:

1. **WSAA (Web Service de Autenticación y Autorización):**
   - Es el gateway de seguridad.
   - Requiere un **Certificado Digital X.509 (.crt)** y su **Clave Privada (.key)**.
   - Emite un **Ticket de Acceso (Token + Sign)** firmado digitalmente en formato CMS/PKCS#7.
   - El token tiene una vigencia de **12 horas**. Debe mantenerse en caché (memoria o archivo) y no solicitarse en cada factura para evitar bloqueos por saturación.
2. **WSFEv1 (Web Service de Facturación Electrónica v1):**
   - Servicio SOAP con el cual se declaran los comprobantes.
   - Tipos de comprobante habituales:
     - `11`: Factura C (Régimen de Monotributo).
     - `1`: Factura A (Responsable Inscripto a Responsable Inscripto).
     - `6`: Factura B (Responsable Inscripto a Consumidor Final o Exento).
   - **Control de Correlatividad Estricto:** Antes de emitir cualquier factura, se debe consultar a ARCA el último número autorizado (`FECompUltimoAutorizado`). La nueva factura **debe ser exactamente el número siguiente (`último + 1`)**, caso contrario el servicio rechaza con *Error 10016*.
3. **Código QR Obligatorio (Resolución General 4892):**
   - Todo comprobante emitido por Web Service debe incluir un código QR.
   - La URL codificada en el QR es:
     ```text
     https://www.arca.gob.ar/fe/qr/?p={DATOS_BASE64}
     ```
   - El `{DATOS_BASE64}` es un objeto JSON codificado en Base64 con el siguiente formato:
     ```json
     {
       "ver": 1,
       "fecha": "YYYY-MM-DD",
       "cuit": 20123456789,
       "ptoVta": 2,
       "tipoCmp": 11,
       "nroCmp": 125,
       "importe": 15000.00,
       "moneda": "ARS",
       "ctz": 1,
       "tipoDocRec": 99,
       "nroDocRec": 0,
       "tipoCodAut": "E",
       "codAut": 74321234567890
     }
     ```

---

## 3. Trámites Previos Administrativos en ARCA (Clave Fiscal)

Para emitir facturas reales, el contribuyente debe seguir estos pasos en el portal oficial:

### Paso 3.1: Generación del Certificado Digital
1. Desde la consola del sistema (o mediante OpenSSL):
   ```bash
   # 1. Crear clave privada
   openssl genrsa -out privada.key 2048

   # 2. Crear solicitud de certificado (CSR)
   openssl req -new -key privada.key -subj "/C=AR/O=TuttoPassa/CN=tuttopassa/serialNumber=CUIT 20XXXXXXXXX" -out pedido.csr
   ```
2. Ingresar a la web de ARCA con Clave Fiscal (Nivel 3).
3. Entrar al servicio **"Administración de Certificados Digitales"**.
4. Agregar un alias (ej: `tuttopassa-pos`) y subir el archivo `pedido.csr`.
5. Descargar el certificado generado (`certificado.crt`).

### Paso 3.2: Delegación del Web Service
1. En ARCA, ingresar al **"Administrador de Relaciones de Clave Fiscal"**.
2. Seleccionar **"Nueva Relación"** -> Buscar el servicio **"Facturación Electrónica"** -> **"Web Service de Factura Electrónica (WSFEv1)"**.
3. Asociarlo al computador fiscal/alias creado en el paso anterior.

### Paso 3.3: Creación del Punto de Venta
1. Ingresar al servicio **"Comprobantes en Línea"** o **"ABM Puntos de Ventas"**.
2. Dar de alta un nuevo número de punto de venta (ej: `0002`).
3. **Tipo de sistema asociado:** Seleccionar obligatoriamente **"Factura Electrónica - Web Services"**.
   > *Nota: No utilizar puntos de venta existentes asignados a "Comprobantes en Línea" ni "Facturación Móvil", ya que ARCA los mantiene independientes.*

---

## 4. Modelo de Datos para la Base de Datos

Para soportar las ventas, el control de stock y el seguimiento fiscal sin alterar las transacciones existentes, se proponen las siguientes estructuras:

### Tabla `sales` (Cabecera de Ventas)
```sql
CREATE TABLE IF NOT EXISTS sales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    daily_register_id INT NULL,
    date DATE NOT NULL,
    time TIME NOT NULL,
    total_amount DECIMAL(12, 2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL, -- 'Efectivo', 'Transferencia', 'Billetera Virtual'
    
    -- Control de Facturación Electrónica
    is_invoiced BOOLEAN NOT NULL DEFAULT 0,
    invoice_type INT NULL,              -- 11 = Factura C, 6 = Factura B, etc.
    punto_venta INT NULL,               -- Ej: 2
    invoice_number INT NULL,            -- Número devuelto por ARCA
    cae VARCHAR(20) NULL,               -- CAE de 14 dígitos
    cae_due_date DATE NULL,             -- Vencimiento del CAE
    
    -- Datos del Comprador
    client_doc_type INT NULL DEFAULT 99,-- 99 = Consumidor Final, 96 = DNI, 80 = CUIT
    client_doc_number VARCHAR(20) NULL,
    client_name VARCHAR(150) NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (daily_register_id) REFERENCES daily_registers(id)
);
```

### Tabla `sale_items` (Detalle de Productos Cobrados)
```sql
CREATE TABLE IF NOT EXISTS sale_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sale_id INT NOT NULL,
    product_id INT NULL,
    description VARCHAR(150) NOT NULL,
    quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
    unit_price DECIMAL(12, 2) NOT NULL,
    subtotal DECIMAL(12, 2) NOT NULL,
    FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES inventory_products(id) ON DELETE SET NULL
);
```

---

## 5. Implementación en Backend (Node.js)

### 5.1 Dependencias Recomendadas
* **`@afipsdk/afip.js`**: SDK probado y actualizado para interactuar con WSAA y WSFEv1 sin lidiar manualmente con SOAP ni firmas complejas.
* **`qrcode`**: Librería ligera para generar el código QR fiscal en formato data URI (base64) para tickets o PDFs.

```bash
npm install --save @afipsdk/afip.js qrcode
```

### 5.2 Estructura del Servicio `services/afipService.js`
```javascript
const Afip = require('@afipsdk/afip.js');
const path = require('path');

// Inicializar el SDK con los certificados locales
const afip = new Afip({
    CUIT: parseInt(process.env.AFIP_CUIT),
    production: process.env.NODE_ENV === 'production',
    cert: path.join(__dirname, '../certs/certificado.crt'),
    key: path.join(__dirname, '../certs/privada.key'),
    res_folder: path.join(__dirname, '../certs/cache') // Guarda los tokens de 12hs
});

/**
 * Emite una Factura en ARCA y retorna el CAE y correlativo
 */
async function emitirFactura({ puntoVenta, tipoComprobante, total, docTipo = 99, docNro = 0 }) {
    // 1. Obtener último número autorizado
    const lastVoucher = await afip.ElectronicBilling.getLastVoucher(puntoVenta, tipoComprobante);
    const nextNumber = lastVoucher + 1;

    const fechaAAAAMMDD = parseInt(new Date().toISOString().slice(0, 10).replace(/-/g, ''));

    // 2. Construir payload para ARCA (WSFEv1)
    const payload = {
        CantReg: 1,
        PtoVta: puntoVenta,
        CbteTipo: tipoComprobante, // 11 para Factura C
        DocTipo: docTipo,          // 99: Consumidor Final
        DocNro: docNro,
        CbteDesde: nextNumber,
        CbteHasta: nextNumber,
        CbteFch: fechaAAAAMMDD,
        ImpTotal: total,
        ImpTotConc: 0,
        ImpNeto: total,            // En Factura C el neto coincide con el total
        ImpOpEx: 0,
        ImpIVA: 0,
        ImpTrib: 0,
        MonId: 'PES',
        MonCotiz: 1
    };

    // 3. Solicitar CAE
    const res = await afip.ElectronicBilling.createVoucher(payload);

    return {
        cae: res.CAE,
        caeDueDate: res.CAEFchVto,
        voucherNumber: nextNumber,
        tipoComprobante,
        puntoVenta
    };
}

module.exports = { afip, emitirFactura };
```

### 5.3 Helper para Generación del Código QR Fiscal
```javascript
const QRCode = require('qrcode');

async function generarQRURL({ cuit, puntoVenta, tipoComprobante, nroComprobante, total, fecha, docTipo, docNro, cae }) {
    const dataObj = {
        ver: 1,
        fecha: fecha, // YYYY-MM-DD
        cuit: parseInt(cuit),
        ptoVta: puntoVenta,
        tipoCmp: tipoComprobante,
        nroCmp: nroComprobante,
        importe: parseFloat(total),
        moneda: 'ARS',
        ctz: 1,
        tipoDocRec: docTipo || 99,
        nroDocRec: docNro || 0,
        tipoCodAut: 'E',
        codAut: parseInt(cae)
    };

    const base64Data = Buffer.from(JSON.stringify(dataObj)).toString('base64');
    const fullURL = `https://www.arca.gob.ar/fe/qr/?p=${base64Data}`;
    
    // Generar imagen QR en Base64 Data URL
    const qrImageBase64 = await QRCode.toDataURL(fullURL, { width: 160, margin: 1 });
    return { fullURL, qrImageBase64 };
}
```

### 5.4 Endpoint de Cobro en `server.js` (`POST /api/pos/checkout`)
1. Recibe los productos vendidos, el importe total, el método de pago (`Efectivo`, `Transferencia`, `Billetera Virtual`) y la bandera booleana `is_invoiced`.
2. Si `is_invoiced === true`:
   - Llama a `afipService.emitirFactura(...)`.
   - Si ARCA rechaza la factura, responde inmediatamente con el detalle del error para que el cajero resuelva sin comprometer los datos.
3. Inserta la venta en la tabla `sales` y el detalle en `sale_items`.
4. **Impacto en Caja Diaria:** Automáticamente inserta el registro en `daily_transactions` ligado a la caja del día con categoría `VENTA_MOSTRADOR` y el método de pago correspondiente.
5. Descuenta las cantidades del stock en la tabla de inventario.
6. Retorna confirmación con el CAE y datos del QR si se facturó.

---

## 6. Diseño de la Interfaz de Usuario (Frontend)

La pantalla del **Punto de Venta / Terminal de Cobros** se organiza en 3 paneles intuitivos:

### A. Catálogo Rápido y Carrito de Venta
* Grid de productos del catálogo con foto/icono, nombre y precio.
* Al hacer clic en un producto, se suma al carrito lateral.
* Contador de cantidad (+ / -) y subtotal en vivo.

### B. Opciones de Cobro
1. **Método de Pago:**
   - Botón 💵 **Efectivo** (con cálculo automático de vuelto: *"Paga con: $... | Cambio: $..."*).
   - Botón 🏦 **Transferencia**.
   - Botón 📱 **Billetera Virtual** (Mercado Pago / Payway).
2. **Switch de Facturación Electrónica:**
   - Un interruptor claro:
     ```
     [ ] ¿Emitir Factura Electrónica ARCA? (Default: DESMARCADO / NO)
     ```
   - **Si está en NO:** No pide ningún dato extra y procesa la venta en menos de 1 segundo.
   - **Si se activa en SÍ:** Despliega un panel deslizable:
     - Receptor: *Consumidor Final* (por defecto) o *DNI/CUIT*.
     - Campo de texto para DNI/CUIT (opcional salvo que supere el tope legal).
     - Nombre o Razón Social (opcional).

### C. Finalización y Comprobante
* Botón destacado: **`[ Cobrar $XX.XXX ]`**.
* Al finalizar:
  - Si no fue facturado: Alerta de éxito con sonido sutil y limpieza del carrito.
  - Si fue facturado: Se dispara automáticamente (o mediante botón) la orden de impresión para la **comandera / ticketera**, mostrando en pantalla la confirmación con el CAE y vista previa del ticket.

### D. Integración y Diseño para Comandera / Impresora de Tickets (80mm / 58mm)

Para que el ticket se imprima de forma rápida y legible en una impresora comandera (láser o térmica), el diseño se basa en un ancho fijo de bobina (80mm o 58mm) y reglas CSS `@media print`:

#### 1. Estructura visual del Ticket Fiscal:
* **Encabezado:**
  - Nombre del Comercio / Razón Social: **Tutto Passa**
  - CUIT del Emisor y Condición de IVA (ej: *Monotributista*)
  - Dirección del Local / Teléfono
  - **Tipo de Comprobante:** `FACTURA "C"` (o "B")
  - **Punto de Venta y Número:** `P.V. 0002 - Nro 00000125`
  - **Fecha y Hora de Emisión:** `19/10/2026 12:45`
* **Cuerpo:**
  - Tabla compacta: `Cant x Descripción ... Subtotal`
  - Línea divisoria de puntos o guiones
  - **TOTAL A PAGAR: $XX.XXX,XX**
  - Forma de pago: *Efectivo / Transferencia / Billetera Virtual*
* **Pie Fiscal (Exigencia ARCA):**
  - **CAE:** `74321234567890`
  - **Vencimiento CAE:** `29/10/2026`
  - **Código QR Fiscal centrado:** Generado en imagen de alto contraste (120px x 120px) para garantizar lectura con celulares o escáneres.
  - Leyenda oficial: *"Comprobante Autorizado por ARCA"*

#### 2. Código CSS `@media print` para Comandera:
```css
/* Estilos aplicables al ticket al momento de imprimir */
@page {
    size: 80mm auto; /* Se ajusta automáticamente al largo del rollo */
    margin: 0;       /* Elimina márgenes blancos del navegador */
}

@media print {
    body * {
        visibility: hidden; /* Oculta la interfaz del sistema */
    }
    #ticket-print-container, #ticket-print-container * {
        visibility: visible;
    }
    #ticket-print-container {
        position: absolute;
        left: 0;
        top: 0;
        width: 72mm; /* Ancho imprimible estándar para rollos de 80mm */
        font-family: 'Courier New', monospace, sans-serif;
        font-size: 11px;
        line-height: 1.25;
        color: #000;
        padding: 4mm;
    }
    .ticket-qr {
        display: block;
        margin: 8px auto;
        width: 120px;
        height: 120px;
    }
    .ticket-divider {
        border-top: 1px dashed #000;
        margin: 5px 0;
    }
}
```

#### 3. Mecanismo de Disparo desde JavaScript (Sin desarmar la pantalla):
Para que la pantalla del cajero no se cierre ni parpadee, la impresión se envía a través de un `<iframe>` invisible:
```javascript
function imprimirTicketFiscal(datosVenta, cae, qrBase64) {
    let iframe = document.getElementById('print-ticket-frame');
    if (!iframe) {
        iframe = document.createElement('iframe');
        iframe.id = 'print-ticket-frame';
        iframe.style.position = 'fixed';
        iframe.style.top = '-9999px';
        iframe.style.left = '-9999px';
        document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(`
        <html>
        <head>
            <style>
                @page { size: 80mm auto; margin: 0; }
                body { font-family: monospace; font-size: 11px; margin: 0; padding: 5mm; width: 70mm; color: #000; }
                .text-center { text-align: center; }
                .divider { border-bottom: 1px dashed #000; margin: 6px 0; }
                .row { display: flex; justify-content: space-between; }
                .qr-img { display: block; margin: 8px auto; width: 120px; height: 120px; }
            </style>
        </head>
        <body>
            <div class="text-center">
                <strong>TUTTO PASSA</strong><br>
                CUIT: 20-XXXXXXXX-X<br>
                FACTURA "C" - Consumidor Final<br>
                P.V. 0002 - Nro ${String(datosVenta.invoice_number).padStart(8, '0')}<br>
                Fecha: ${datosVenta.date} ${datosVenta.time}
            </div>
            <div class="divider"></div>
            ${datosVenta.items.map(it => `
                <div class="row">
                    <span>${it.quantity}x ${it.description}</span>
                    <span>$${it.subtotal.toFixed(2)}</span>
                </div>
            `).join('')}
            <div class="divider"></div>
            <div class="row" style="font-size: 13px; font-weight: bold;">
                <span>TOTAL:</span>
                <span>$${datosVenta.total.toFixed(2)}</span>
            </div>
            <div class="row">
                <span>Pago:</span>
                <span>${datosVenta.payment_method}</span>
            </div>
            <div class="divider"></div>
            <div class="text-center">
                <img class="qr-img" src="${qrBase64}" alt="QR Fiscal" /><br>
                <strong>CAE:</strong> ${cae.cae}<br>
                <strong>Vto. CAE:</strong> ${cae.caeDueDate}<br>
                <small>Comprobante Autorizado por ARCA</small>
            </div>
        </body>
        </html>
    `);
    doc.close();

    // Esperar a que renderice la imagen del QR y disparar la ventana de impresión
    setTimeout(() => {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
    }, 250);
}
```

#### 4. Configuración del Navegador para la Comandera:
* **Márgenes en el diálogo de impresión:** Seleccionar *"Ninguno"* (o *Custom: 0*).
* **Opciones:** Desmarcar *"Encabezados y pies de página"* (para evitar que imprima la URL del navegador y la fecha arriba/abajo).
* **Impresión silenciosa (Kiosk Mode opcional):** Si se utiliza Chrome o Edge, se puede iniciar el navegador con el flag `--kiosk-printing` para que al apretar "Cobrar", el ticket salga **directamente de la comandera sin abrir el cuadro de diálogo de Windows**.

---

## 7. Buenas Prácticas y Contingencias

1. **Caídas o Demoras de ARCA (Modo Offline / Contingencia):**
   - El hecho de que la opción por defecto sea **NO facturar** garantiza que el local **nunca se quede sin cobrar** ante microcortes de internet o saturación de los servidores del Estado.
   - En caso de que un cliente pida factura y ARCA esté caído, se puede guardar la venta con estado `factura_pendiente: true` y habilitar un botón en el listado para reenviar a ARCA más tarde.
2. **Límite de Facturación a Consumidor Final sin DNI:**
   - Según la normativa vigente de ARCA, las ventas a consumidor final en efectivo que superen el monto máximo establecido por ley deben identificar obligatoriamente el DNI/CUIT del comprador. El frontend puede alertar si se supera dicho importe.
3. **Ambientes de Testing vs Producción:**
   - Trabajar primero con las credenciales de homologación de ARCA (usando el CUIT de test `20409378472` provisto por el SDK).
   - Una vez validado el circuito completo, cambiar los certificados por los reales del negocio y habilitar el punto de venta productivo.

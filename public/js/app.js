// Configuración y Estado Global
const API_URL = window.location.origin;
let state = {
    token: localStorage.getItem('token') || null,
    user: JSON.parse(localStorage.getItem('user')) || null,
    currentView: 'dashboard',
    transactions: [],
    categories: [],
    employees: [],
    settlements: null,
    cashflowChart: null,
    categoriesChart: null,
    serviceTypes: [],
    servicePayments: []
};

// --- INICIALIZACIÓN ---
document.addEventListener('DOMContentLoaded', () => {
    // Establecer mes actual por defecto (formato YYYY-MM)
    const today = new Date();
    const currentMonthStr = today.toISOString().slice(0, 7);
    document.getElementById('global-month').value = currentMonthStr;
    
    const spMonth = document.getElementById('sp-month');
    if (spMonth) spMonth.value = currentMonthStr;
    
    const spDate = document.getElementById('sp-date');
    if (spDate) spDate.value = today.toISOString().slice(0, 10);

    initEventListeners();
    checkAuth();
});

// Registrar eventos de botones y formularios
function initEventListeners() {
    // Login
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    // Navegación Sidebar
    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetView = e.currentTarget.getAttribute('data-view');
            switchView(targetView);
        });
    });

    // Filtros de mes y filtros de tabla
    document.getElementById('global-month').addEventListener('change', () => {
        loadData();
    });
    document.getElementById('filter-type').addEventListener('change', applyFilters);
    document.getElementById('filter-category').addEventListener('change', applyFilters);

    // Modales de Transacción
    document.getElementById('open-income-btn').addEventListener('click', () => openModal('income'));
    document.getElementById('open-expense-btn').addEventListener('click', () => openModal('expense'));
    document.getElementById('close-modal-btn').addEventListener('click', closeModal);
    document.getElementById('cancel-modal-btn').addEventListener('click', closeModal);
    document.getElementById('transaction-form').addEventListener('submit', handleSaveTransaction);

    // Mostrar/ocultar selector de empleado según la categoría en el modal de transacciones
    document.getElementById('tx-category').addEventListener('change', (e) => {
        const empGroup = document.getElementById('tx-employee-group');
        if (e.target.value === 'Sueldos y Retiros') {
            empGroup.classList.remove('hide');
        } else {
            empGroup.classList.add('hide');
            document.getElementById('tx-employee').value = '';
        }
    });

    // Modal cerrar al hacer clic afuera
    document.getElementById('transaction-modal').addEventListener('click', (e) => {
        if (e.target.id === 'transaction-modal') closeModal();
    });

    // Descarga PDF
    document.getElementById('download-pdf-btn').addEventListener('click', downloadPDFReport);

    // Categorías Formulario
    document.getElementById('category-form').addEventListener('submit', handleSaveCategory);

    // Empleados Formulario
    document.getElementById('employee-form').addEventListener('submit', handleSaveEmployee);

    // Servicios Formulario
    document.getElementById('service-type-form').addEventListener('submit', handleSaveServiceType);
    document.getElementById('service-payment-form').addEventListener('submit', handleSaveServicePayment);
}

// --- AUTENTICACIÓN ---
async function handleLogin(e) {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const errorEl = document.getElementById('login-error');

    errorEl.classList.add('hide');

    try {
        const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Credenciales inválidas');
        }

        state.token = data.token;
        state.user = data.user;

        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        checkAuth();
        document.getElementById('password').value = '';
    } catch (err) {
        errorEl.textContent = err.message;
        errorEl.classList.remove('hide');
    }
}

function handleLogout() {
    state.token = null;
    state.user = null;
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    checkAuth();
}

function checkAuth() {
    const loginContainer = document.getElementById('login-container');
    const appContainer = document.getElementById('app-container');

    if (state.token && state.user) {
        loginContainer.classList.add('hide');
        appContainer.classList.remove('hide');
        
        // Cargar detalles del perfil
        document.getElementById('user-name-display').textContent = state.user.name;
        document.getElementById('user-avatar').textContent = state.user.name.charAt(0).toUpperCase();

        switchView('dashboard');
        loadData();
    } else {
        loginContainer.classList.remove('hide');
        appContainer.classList.add('hide');
    }
}

// --- NAVEGACIÓN ---
function switchView(viewName) {
    state.currentView = viewName;
    
    // Actualizar sidebar buttons
    document.querySelectorAll('.nav-item').forEach(btn => {
        if (btn.getAttribute('data-view') === viewName) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    // Actualizar vistas
    document.querySelectorAll('.content-view').forEach(view => {
        if (view.id === `view-${viewName}`) {
            view.classList.remove('hide');
        } else {
            view.classList.add('hide');
        }
    });

    // Título de la barra superior
    const titles = {
        dashboard: 'Dashboard General',
        transactions: 'Listado de Transacciones',
        categories: 'Gestión de Categorías',
        employees: 'Gestión de Empleados',
        services: 'Gestión de Servicios y Comprobantes'
    };
    document.getElementById('view-title').textContent = titles[viewName] || 'Tutto Passa';

    if (viewName === 'dashboard') {
        renderCharts();
    } else if (viewName === 'categories') {
        renderCategoriesTable();
    } else if (viewName === 'employees') {
        renderEmployeesTable();
    } else if (viewName === 'services') {
        renderServiceTypesTable();
        renderServicePaymentsTable();
    }
}

// --- OBTENCIÓN Y MANEJO DE DATOS ---
async function loadData() {
    if (!state.token) return;

    const selectedMonth = document.getElementById('global-month').value;

    try {
        // 1. Cargar Categorías
        const catsResponse = await fetch(`${API_URL}/api/categories`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        if (catsResponse.ok) {
            state.categories = await catsResponse.json();
            populateCategoryDropdowns();
        }

        // 2. Cargar Empleados
        const empsResponse = await fetch(`${API_URL}/api/employees`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        if (empsResponse.ok) {
            state.employees = await empsResponse.json();
            populateEmployeeDropdowns();
        }

        // 3. Cargar Liquidaciones
        const settsResponse = await fetch(`${API_URL}/api/settlements?month=${selectedMonth}`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        if (settsResponse.ok) {
            state.settlements = await settsResponse.json();
            renderSettlementsTable();
        }

        // 4. Cargar Tipos de Servicios
        const servicesResponse = await fetch(`${API_URL}/api/services`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        if (servicesResponse.ok && servicesResponse.headers.get('content-type')?.includes('application/json')) {
            state.serviceTypes = await servicesResponse.json();
            populateServiceDropdown();
        }

        // 5. Cargar Pagos de Servicios
        const paymentsResponse = await fetch(`${API_URL}/api/service-payments?month=${selectedMonth}`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        if (paymentsResponse.ok && paymentsResponse.headers.get('content-type')?.includes('application/json')) {
            state.servicePayments = await paymentsResponse.json();
        }

        // 6. Cargar Transacciones
        const response = await fetch(`${API_URL}/api/transactions?month=${selectedMonth}`, {
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });

        if (response.status === 401 || response.status === 403) {
            handleLogout();
            return;
        }

        state.transactions = await response.json();
        
        updateMetrics();
        renderTransactionsTable();
        
        if (state.currentView === 'dashboard') {
            renderCharts();
        } else if (state.currentView === 'categories') {
            renderCategoriesTable();
        } else if (state.currentView === 'employees') {
            renderEmployeesTable();
        } else if (state.currentView === 'services') {
            renderServiceTypesTable();
            renderServicePaymentsTable();
        }
    } catch (err) {
        console.error('Error al cargar datos:', err);
    }
}

// Calcular y actualizar tarjetas de métricas
function updateMetrics() {
    let income = 0;
    let expense = 0;

    state.transactions.forEach(t => {
        const amt = parseFloat(t.amount);
        if (t.type === 'income') {
            income += amt;
        } else {
            expense += amt;
        }
    });

    const balance = income - expense;

    document.getElementById('metric-income').textContent = `$${income.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('metric-expense').textContent = `$${expense.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    const balanceEl = document.getElementById('metric-balance');
    balanceEl.textContent = `$${balance.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    if (balance < 0) {
        balanceEl.style.color = 'var(--danger)';
    } else {
        balanceEl.style.color = 'var(--success)';
    }
}

// Renderizar tabla de transacciones
function renderTransactionsTable(filteredList = null) {
    const list = filteredList || state.transactions;
    const tbody = document.getElementById('transactions-tbody');
    tbody.innerHTML = '';

    if (list.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">No hay transacciones registradas para este mes.</td></tr>`;
        return;
    }

    list.forEach(t => {
        const tr = document.createElement('tr');
        const formattedDate = new Date(t.date + 'T00:00:00').toLocaleDateString('es-AR');
        const formattedAmount = parseFloat(t.amount).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

        let descriptionHTML = t.description || '<span class="text-muted">—</span>';
        if (t.employee_name) {
            descriptionHTML += ` <span style="font-size: 0.85rem; background-color: var(--primary-light); color: var(--primary-hover); padding: 0.15rem 0.4rem; border-radius: 4px; display: inline-block; margin-top: 0.25rem; font-weight: 500;">Para: ${t.employee_name}</span>`;
        }

        tr.innerHTML = `
            <td>${formattedDate}</td>
            <td><strong>${t.user_name}</strong></td>
            <td><span class="badge badge-${t.type}">${t.type === 'income' ? 'Ingreso' : 'Egreso'}</span></td>
            <td>${t.category}</td>
            <td>${descriptionHTML}</td>
            <td class="cell-amount ${t.type}">${t.type === 'income' ? '+' : '-'}${formattedAmount}</td>
            <td>
                <button class="btn-delete" onclick="handleDeleteTransaction(${t.id})" title="Eliminar transacción">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function applyFilters() {
    const type = document.getElementById('filter-type').value;
    const category = document.getElementById('filter-category').value;

    let filtered = [...state.transactions];

    if (type) {
        filtered = filtered.filter(t => t.type === type);
    }
    if (category) {
        filtered = filtered.filter(t => t.category === category);
    }

    renderTransactionsTable(filtered);
}

// --- MODALES (CREAR TRANSACCIÓN) ---
function openModal(type) {
    const modal = document.getElementById('transaction-modal');
    const title = document.getElementById('modal-title');
    const txTypeInput = document.getElementById('tx-type');
    const categorySelect = document.getElementById('tx-category');

    txTypeInput.value = type;
    title.textContent = type === 'income' ? 'Registrar Nuevo Ingreso' : 'Registrar Nuevo Egreso';

    // Rellenar categorías dinámicamente
    categorySelect.innerHTML = '<option value="" disabled selected>Selecciona categoría</option>';
    const filteredCats = state.categories.filter(c => c.type === type);
    filteredCats.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.name;
        opt.textContent = cat.name;
        categorySelect.appendChild(opt);
    });

    // Ocultar selector de empleados y resetear
    document.getElementById('tx-employee-group').classList.add('hide');
    document.getElementById('tx-employee').value = '';

    // Establecer fecha por defecto a hoy (en formato local ajustado)
    const offset = new Date().getTimezoneOffset();
    const localDate = new Date(new Date().getTime() - (offset*60*1000));
    document.getElementById('tx-date').value = localDate.toISOString().split('T')[0];

    // Limpiar otros campos
    document.getElementById('tx-amount').value = '';
    document.getElementById('tx-description').value = '';

    modal.classList.remove('hide');
}

function closeModal() {
    document.getElementById('transaction-modal').classList.add('hide');
}

async function handleSaveTransaction(e) {
    e.preventDefault();

    const type = document.getElementById('tx-type').value;
    const amount = parseFloat(document.getElementById('tx-amount').value);
    const date = document.getElementById('tx-date').value;
    const category = document.getElementById('tx-category').value;
    const description = document.getElementById('tx-description').value;
    const employee_id = document.getElementById('tx-employee').value;

    if (!amount || amount <= 0 || !date || !category) {
        alert('Por favor complete todos los datos requeridos.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/transactions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify({ 
                type, 
                amount, 
                date, 
                category, 
                description,
                employee_id: employee_id ? parseInt(employee_id) : null 
            })
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Error al guardar la transacción');
        }

        closeModal();
        loadData();
    } catch (err) {
        alert(err.message);
    }
}

// --- ELIMINAR TRANSACCIÓN ---
async function handleDeleteTransaction(id) {
    if (!confirm('¿Estás seguro de que quieres eliminar este registro financiero?')) return;

    try {
        const response = await fetch(`${API_URL}/api/transactions/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Error al eliminar la transacción');
        }

        loadData();
    } catch (err) {
        alert(err.message);
    }
}
window.handleDeleteTransaction = handleDeleteTransaction;

// --- GRÁFICOS (CHART.JS) ---
function renderCharts() {
    if (state.transactions.length === 0) {
        // Limpiar gráficos si no hay datos
        if (state.cashflowChart) state.cashflowChart.destroy();
        if (state.categoriesChart) state.categoriesChart.destroy();
        return;
    }

    // 1. Procesamiento para Flujo de Caja (Ingresos vs Egresos por día)
    const daysMap = {};
    state.transactions.forEach(t => {
        const day = t.date.split('-')[2]; // Obtener el número de día del mes
        if (!daysMap[day]) {
            daysMap[day] = { income: 0, expense: 0 };
        }
        if (t.type === 'income') {
            daysMap[day].income += parseFloat(t.amount);
        } else {
            daysMap[day].expense += parseFloat(t.amount);
        }
    });

    const sortedDays = Object.keys(daysMap).sort((a, b) => parseInt(a) - parseInt(b));
    const incomeData = sortedDays.map(d => daysMap[d].income);
    const expenseData = sortedDays.map(d => daysMap[d].expense);
    const labelsDays = sortedDays.map(d => `Día ${d}`);

    if (state.cashflowChart) state.cashflowChart.destroy();
    const ctxCashflow = document.getElementById('cashflow-chart').getContext('2d');
    state.cashflowChart = new Chart(ctxCashflow, {
        type: 'line',
        data: {
            labels: labelsDays,
            datasets: [
                {
                    label: 'Ingresos',
                    data: incomeData,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                },
                {
                    label: 'Egresos',
                    data: expenseData,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'top' }
            },
            scales: {
                y: { beginAtZero: true }
            }
        }
    });

    // 2. Procesamiento para Egresos por Categoría
    const expenseCategoriesMap = {};
    state.transactions.filter(t => t.type === 'expense').forEach(t => {
        if (!expenseCategoriesMap[t.category]) {
            expenseCategoriesMap[t.category] = 0;
        }
        expenseCategoriesMap[t.category] += parseFloat(t.amount);
    });

    const categoryLabels = Object.keys(expenseCategoriesMap);
    const categoryData = Object.values(expenseCategoriesMap);

    if (state.categoriesChart) state.categoriesChart.destroy();
    const ctxCategories = document.getElementById('categories-chart').getContext('2d');
    state.categoriesChart = new Chart(ctxCategories, {
        type: 'doughnut',
        data: {
            labels: categoryLabels,
            datasets: [{
                data: categoryData,
                backgroundColor: [
                    '#f59e0b', // Ámbar/Panadería
                    '#ef4444', // Sueldos
                    '#3b82f6', // Servicios
                    '#10b981', // Mantenimiento
                    '#6b7280'  // Otros
                ],
                borderWidth: 2,
                borderColor: '#ffffff'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

// --- EXPORTAR REPORTES PDF ---
function downloadPDFReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const selectedMonth = document.getElementById('global-month').value;
    const [year, month] = selectedMonth.split('-');
    const dateObj = new Date(year, month - 1);
    const monthName = dateObj.toLocaleString('es-AR', { month: 'long' }).toUpperCase();
    
    // Totales calculados
    let totalIncome = 0;
    let totalExpense = 0;
    state.transactions.forEach(t => {
        const amt = parseFloat(t.amount);
        if (t.type === 'income') totalIncome += amt;
        else totalExpense += amt;
    });
    const balance = totalIncome - totalExpense;

    // Colores corporativos (Amber / Café)
    const brandColor = [217, 119, 6];
    const darkColor = [30, 27, 24];

    // Banner del Encabezado
    doc.setFillColor(...darkColor);
    doc.rect(0, 0, 210, 40, 'F');

    // Logo e Info de Empresa
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont('Outfit', 'bold');
    doc.text('Tutto Passa', 15, 20);
    doc.setFontSize(10);
    doc.setFont('Outfit', 'normal');
    doc.text('PANADERÍA & CAFETERÍA', 15, 26);

    // Detalles del Reporte en Cabecera
    doc.setFontSize(12);
    doc.setFont('Outfit', 'bold');
    doc.text('REPORTE FINANCIERO MENSUAL', 195, 18, { align: 'right' });
    doc.setFontSize(10);
    doc.setFont('Outfit', 'normal');
    doc.text(`Período: ${monthName} ${year}`, 195, 24, { align: 'right' });
    doc.text(`Generado por: ${state.user.name}`, 195, 30, { align: 'right' });

    // Sección de Resumen Financiero
    doc.setFontSize(14);
    doc.setFont('Outfit', 'bold');
    doc.setTextColor(...darkColor);
    doc.text('Resumen Financiero', 15, 55);

    // Dibujar Tarjetas de Totales
    // Ingresos
    doc.setFillColor(240, 253, 250); // Muted success bg
    doc.rect(15, 62, 55, 25, 'F');
    doc.setDrawColor(16, 185, 129);
    doc.rect(15, 62, 55, 25, 'S');
    doc.setFontSize(8);
    doc.setTextColor(6, 78, 59);
    doc.text('INGRESOS TOTALES', 20, 70);
    doc.setFontSize(11);
    doc.setFont('Outfit', 'bold');
    doc.text(`$${totalIncome.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 20, 80);

    // Egresos
    doc.setFillColor(254, 242, 242); // Muted danger bg
    doc.rect(77, 62, 55, 25, 'F');
    doc.setDrawColor(239, 68, 68);
    doc.rect(77, 62, 55, 25, 'S');
    doc.setFontSize(8);
    doc.setFont('Outfit', 'normal');
    doc.setTextColor(153, 27, 27);
    doc.text('EGRESOS TOTALES', 82, 70);
    doc.setFontSize(11);
    doc.setFont('Outfit', 'bold');
    doc.text(`$${totalExpense.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 82, 80);

    // Balance
    const isPositive = balance >= 0;
    const balanceBg = isPositive ? [254, 243, 199] : [254, 242, 242];
    doc.setFillColor(...balanceBg); // Amber light o Danger light
    doc.rect(140, 62, 55, 25, 'F');
    doc.setDrawColor(...brandColor);
    doc.rect(140, 62, 55, 25, 'S');
    doc.setFontSize(8);
    doc.setFont('Outfit', 'normal');
    doc.setTextColor(...brandColor);
    doc.text('BALANCE NETO', 145, 70);
    doc.setFontSize(11);
    doc.setFont('Outfit', 'bold');
    doc.text(`$${balance.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`, 145, 80);

    // Tabla de Detalles
    doc.setTextColor(...darkColor);
    doc.setFontSize(14);
    doc.text('Detalle de Movimientos', 15, 100);

    const tableRows = state.transactions.map(t => {
        const dateStr = new Date(t.date + 'T00:00:00').toLocaleDateString('es-AR');
        const amountStr = `${t.type === 'income' ? '+' : '-'}$${parseFloat(t.amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
        return [
            dateStr,
            t.user_name,
            t.type === 'income' ? 'Ingreso' : 'Egreso',
            t.category,
            t.description || '—',
            amountStr
        ];
    });

    doc.autoTable({
        startY: 106,
        head: [['Fecha', 'Registrado Por', 'Tipo', 'Categoría', 'Descripción', 'Monto']],
        body: tableRows,
        headStyles: {
            fillColor: darkColor,
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: 'bold'
        },
        bodyStyles: {
            fontSize: 8
        },
        columnStyles: {
            5: { halign: 'right', fontStyle: 'bold' } // Monto a la derecha
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252]
        },
        didParseCell: function (data) {
            // Dar formato de color verde o rojo al monto en la tabla
            if (data.column.index === 5 && data.cell.section === 'body') {
                const text = data.cell.text[0];
                if (text.startsWith('+')) {
                    data.cell.styles.textColor = [16, 185, 129];
                } else if (text.startsWith('-')) {
                    data.cell.styles.textColor = [239, 68, 68];
                }
            }
        }
    });

    // --- NUEVO: Tabla de Liquidaciones del Mes en PDF ---
    const finalY = doc.lastAutoTable.finalY || 120;
    doc.setTextColor(...darkColor);
    doc.setFontSize(14);
    doc.setFont('Outfit', 'bold');
    doc.text('Liquidacion de Sueldos y Utilidades del Mes', 15, finalY + 15);

    const settlementRows = (state.settlements && state.settlements.settlements || []).map(s => {
        return [
            s.name,
            s.is_partner ? 'Socio' : 'Empleado',
            `$${s.base_salary.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
            `$${s.profit_share.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
            `$${s.advances.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`,
            `$${s.final_settlement.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`
        ];
    });

    doc.autoTable({
        startY: finalY + 20,
        head: [['Nombre', 'Rol', 'Sueldo Fijo', 'Utilidades (1/3 neto)', 'Adelantos / Retiros', 'Neto a Liquidar']],
        body: settlementRows,
        headStyles: {
            fillColor: brandColor,
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: 'bold'
        },
        bodyStyles: {
            fontSize: 8
        },
        columnStyles: {
            2: { halign: 'right' },
            3: { halign: 'right' },
            4: { halign: 'right' },
            5: { halign: 'right', fontStyle: 'bold' }
        },
        alternateRowStyles: {
            fillColor: [248, 250, 252]
        }
    });

    // Guardar Reporte PDF
    doc.save(`Tutto_Passa_Reporte_${monthName}_${year}.pdf`);
}

// --- GESTIÓN DE CATEGORÍAS (UI Y API) ---
function populateCategoryDropdowns() {
    const filterCatSelect = document.getElementById('filter-category');
    if (!filterCatSelect) return;

    const currentVal = filterCatSelect.value;
    filterCatSelect.innerHTML = '<option value="">Todas las Categorías</option>';
    
    state.categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.name;
        opt.textContent = `${cat.name} (${cat.type === 'income' ? 'Ingreso' : 'Egreso'})`;
        filterCatSelect.appendChild(opt);
    });

    if (currentVal) {
        filterCatSelect.value = currentVal;
    }
}

function renderCategoriesTable() {
    const tbody = document.getElementById('categories-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (state.categories.length === 0) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--text-muted); padding: 2rem;">No hay categorías registradas.</td></tr>`;
        return;
    }

    state.categories.forEach(cat => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${cat.name}</strong></td>
            <td><span class="badge badge-${cat.type}">${cat.type === 'income' ? 'Ingreso' : 'Egreso'}</span></td>
            <td>
                <button class="btn-delete" onclick="handleDeleteCategory(${cat.id})" title="Eliminar categoría">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function handleSaveCategory(e) {
    e.preventDefault();

    const name = document.getElementById('cat-name').value.trim();
    const type = document.getElementById('cat-type').value;

    if (!name || !type) {
        alert('Por favor complete todos los datos requeridos.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/categories`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify({ name, type })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error al guardar la categoría');
        }

        document.getElementById('cat-name').value = '';
        document.getElementById('cat-type').value = '';
        loadData();
    } catch (err) {
        alert(err.message);
    }
}

async function handleDeleteCategory(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta categoría? Las transacciones existentes mantendrán el nombre de la categoría, pero no podrás volver a seleccionarla.')) return;

    try {
        const response = await fetch(`${API_URL}/api/categories/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Error al eliminar la categoría');
        }

        loadData();
    } catch (err) {
        alert(err.message);
    }
}
window.handleDeleteCategory = handleDeleteCategory;

// --- GESTIÓN DE EMPLEADOS Y LIQUIDACIONES (UI Y API) ---

function populateEmployeeDropdowns() {
    const txEmpSelect = document.getElementById('tx-employee');
    if (!txEmpSelect) return;

    txEmpSelect.innerHTML = '<option value="">Ninguno / Gasto Operativo General</option>';
    state.employees.forEach(emp => {
        const opt = document.createElement('option');
        opt.value = emp.id;
        opt.textContent = `${emp.name} (${emp.is_partner ? 'Socio' : 'Empleado'})`;
        txEmpSelect.appendChild(opt);
    });
}

function renderEmployeesTable() {
    const tbody = document.getElementById('employees-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (state.employees.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align: center; color: var(--text-muted); padding: 2rem;">No hay personal registrado.</td></tr>`;
        return;
    }

    state.employees.forEach(emp => {
        const tr = document.createElement('tr');
        const formattedSalary = parseFloat(emp.base_salary).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
        
        tr.innerHTML = `
            <td><strong>${emp.name}</strong></td>
            <td>${formattedSalary}</td>
            <td><span class="badge ${emp.is_partner ? 'badge-income' : 'badge-expense'}">${emp.is_partner ? 'Socio' : 'Empleado'}</span></td>
            <td>
                <button class="btn-delete" onclick="handleDeleteEmployee(${emp.id})" title="Eliminar empleado">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function handleSaveEmployee(e) {
    e.preventDefault();

    const name = document.getElementById('emp-name').value.trim();
    const base_salary = parseFloat(document.getElementById('emp-salary').value);
    const is_partner = document.getElementById('emp-partner').checked;

    if (!name || isNaN(base_salary)) {
        alert('Por favor complete todos los campos.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/employees`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify({ name, base_salary, is_partner })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Error al guardar el empleado');
        }

        document.getElementById('emp-name').value = '';
        document.getElementById('emp-salary').value = '';
        document.getElementById('emp-partner').checked = false;
        
        loadData();
    } catch (err) {
        alert(err.message);
    }
}

async function handleDeleteEmployee(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este empleado? Sus transacciones no se borrarán, pero dejará de listarse en el personal activo.')) return;

    try {
        const response = await fetch(`${API_URL}/api/employees/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });

        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.error || 'Error al eliminar al empleado');
        }

        loadData();
    } catch (err) {
        alert(err.message);
    }
}
window.handleDeleteEmployee = handleDeleteEmployee;

function renderSettlementsTable() {
    const tbody = document.getElementById('settlements-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!state.settlements || !state.settlements.settlements || state.settlements.settlements.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No hay datos para liquidar en este mes.</td></tr>`;
        return;
    }

    state.settlements.settlements.forEach(s => {
        const tr = document.createElement('tr');
        const formattedBase = s.base_salary.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
        const formattedShare = s.profit_share.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
        const formattedAdvances = s.advances.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
        const formattedFinal = s.final_settlement.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

        tr.innerHTML = `
            <td><strong>${s.name}</strong></td>
            <td><span class="badge ${s.is_partner ? 'badge-income' : 'badge-expense'}">${s.is_partner ? 'Socio' : 'Empleado'}</span></td>
            <td>${formattedBase}</td>
            <td>${s.is_partner ? formattedShare : '<span class="text-muted">—</span>'}</td>
            <td style="color: var(--danger); font-weight: 500;">-${formattedAdvances}</td>
            <td style="font-weight: 700; color: ${s.final_settlement >= 0 ? 'var(--success)' : 'var(--danger)'}">
                ${formattedFinal}
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// --- LÓGICA DE SERVICIOS ---

function populateServiceDropdown() {
    const selectEl = document.getElementById('sp-service-type');
    if (!selectEl) return;

    // Guardar el valor seleccionado actual
    const currentVal = selectEl.value;

    selectEl.innerHTML = '<option value="" disabled selected>Selecciona servicio</option>';
    state.serviceTypes.forEach(s => {
        const option = document.createElement('option');
        option.value = s.id;
        option.textContent = s.name;
        selectEl.appendChild(option);
    });

    if (currentVal) {
        selectEl.value = currentVal;
    }
}

function renderServiceTypesTable() {
    const tbody = document.getElementById('service-types-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (state.serviceTypes.length === 0) {
        tbody.innerHTML = `<tr><td colspan="2" style="text-align: center; color: var(--text-muted); padding: 1rem;">No hay tipos de servicios registrados.</td></tr>`;
        return;
    }

    state.serviceTypes.forEach(s => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${s.name}</strong></td>
            <td>
                <button class="btn-danger btn-sm" onclick="handleDeleteServiceType(${s.id})">
                    Eliminar
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function renderServicePaymentsTable() {
    const tbody = document.getElementById('service-payments-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (state.servicePayments.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">No hay pagos registrados para este mes.</td></tr>`;
        return;
    }

    state.servicePayments.forEach(p => {
        const tr = document.createElement('tr');
        const formattedAmount = parseFloat(p.amount).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
        
        const ticketBtn = p.ticket_path 
            ? `<a href="${p.ticket_path}" target="_blank" class="btn-view-doc">📄 Ver Ticket</a>`
            : `<span class="text-muted" style="font-size: 0.85rem;">— No adjunto</span>`;
            
        const invoiceBtn = p.invoice_path 
            ? `<a href="${p.invoice_path}" target="_blank" class="btn-view-doc">📄 Ver Factura</a>`
            : `<span class="text-muted" style="font-size: 0.85rem;">— No adjunta</span>`;

        tr.innerHTML = `
            <td><strong>${p.service_name}</strong></td>
            <td>${p.month}</td>
            <td>${p.payment_date}</td>
            <td style="font-weight: 600; color: var(--danger);">${formattedAmount}</td>
            <td>${ticketBtn}</td>
            <td>${invoiceBtn}</td>
            <td>
                <button class="btn-danger btn-sm" onclick="handleDeleteServicePayment(${p.id})">
                    Eliminar
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function safeResponseJSON(response, defaultErrorMsg) {
    const text = await response.text();
    let data = {};
    try {
        data = JSON.parse(text);
    } catch (e) {
        if (!response.ok) {
            if (response.status === 404 || text.trim().startsWith('<!DOCTYPE')) {
                throw new Error(`${defaultErrorMsg} (El endpoint no se encontró. Por favor, asegúrate de reiniciar el servidor backend para aplicar los cambios de server.js).`);
            }
            throw new Error(defaultErrorMsg);
        }
    }
    if (!response.ok) {
        throw new Error(data.error || defaultErrorMsg);
    }
    return data;
}

async function handleSaveServiceType(e) {
    e.preventDefault();
    const nameEl = document.getElementById('st-name');
    const name = nameEl.value;

    try {
        const response = await fetch(`${API_URL}/api/services`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify({ name })
        });

        await safeResponseJSON(response, 'Error al guardar tipo de servicio');

        nameEl.value = '';
        loadData();
    } catch (err) {
        alert(err.message);
    }
}

async function handleSaveServicePayment(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData();

    formData.append('service_type_id', document.getElementById('sp-service-type').value);
    formData.append('month', document.getElementById('sp-month').value);
    formData.append('payment_date', document.getElementById('sp-date').value);
    formData.append('amount', document.getElementById('sp-amount').value);

    const ticketFile = document.getElementById('sp-ticket').files[0];
    const invoiceFile = document.getElementById('sp-invoice').files[0];

    if (ticketFile) formData.append('ticket', ticketFile);
    if (invoiceFile) formData.append('invoice', invoiceFile);

    try {
        const response = await fetch(`${API_URL}/api/service-payments`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${state.token}`
            },
            body: formData
        });

        await safeResponseJSON(response, 'Error al registrar el pago de servicio');

        form.reset();
        
        // Volver a establecer mes y fecha actuales por defecto en el formulario
        const today = new Date();
        document.getElementById('sp-month').value = today.toISOString().slice(0, 7);
        document.getElementById('sp-date').value = today.toISOString().slice(0, 10);

        loadData();
    } catch (err) {
        alert(err.message);
    }
}

async function handleDeleteServiceType(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este tipo de servicio? Se eliminarán todos los registros de pago y comprobantes asociados de forma permanente.')) return;

    try {
        const response = await fetch(`${API_URL}/api/services/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });

        await safeResponseJSON(response, 'Error al eliminar el tipo de servicio');

        loadData();
    } catch (err) {
        alert(err.message);
    }
}

async function handleDeleteServicePayment(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este pago? Se borrarán de forma permanente los archivos adjuntos y también el egreso registrado en las transacciones generales.')) return;

    try {
        const response = await fetch(`${API_URL}/api/service-payments/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });

        await safeResponseJSON(response, 'Error al eliminar el pago de servicio');

        loadData();
    } catch (err) {
        alert(err.message);
    }
}

// Exponer funciones globales al objeto window para los onclick inline de las tablas
window.handleDeleteServiceType = handleDeleteServiceType;
window.handleDeleteServicePayment = handleDeleteServicePayment;




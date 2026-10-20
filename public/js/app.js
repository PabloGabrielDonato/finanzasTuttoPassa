// Helpers para alertas agradables con SweetAlert2
const Alert = {
    success(message, title = '¡Éxito!') {
        return Swal.fire({
            title: title,
            text: message,
            icon: 'success',
            confirmButtonColor: '#d97706',
            confirmButtonText: 'Aceptar',
            customClass: {
                popup: 'premium-swal-popup',
                confirmButton: 'premium-swal-button'
            }
        });
    },
    error(message, title = 'Error') {
        return Swal.fire({
            title: title,
            text: message,
            icon: 'error',
            confirmButtonColor: '#ef4444',
            confirmButtonText: 'Cerrar',
            customClass: {
                popup: 'premium-swal-popup',
                confirmButton: 'premium-swal-button'
            }
        });
    },
    warning(message, title = 'Atención') {
        return Swal.fire({
            title: title,
            text: message,
            icon: 'warning',
            confirmButtonColor: '#d97706',
            confirmButtonText: 'Aceptar',
            customClass: {
                popup: 'premium-swal-popup',
                confirmButton: 'premium-swal-button'
            }
        });
    },
    info(message, title = 'Información') {
        return Swal.fire({
            title: title,
            text: message,
            icon: 'info',
            confirmButtonColor: '#d97706',
            confirmButtonText: 'Aceptar',
            customClass: {
                popup: 'premium-swal-popup',
                confirmButton: 'premium-swal-button'
            }
        });
    },
    async confirm(message, title = '¿Estás seguro?', confirmText = 'Sí, eliminar', cancelText = 'Cancelar') {
        const result = await Swal.fire({
            title: title,
            text: message,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#ef4444',
            cancelButtonColor: '#6b7280',
            confirmButtonText: confirmText,
            cancelButtonText: cancelText,
            customClass: {
                popup: 'premium-swal-popup',
                confirmButton: 'premium-swal-button',
                cancelButton: 'premium-swal-button'
            }
        });
        return result.isConfirmed;
    }
};

// Formateador robusto de fechas (soporta ISO UTC, YYYY-MM-DD y timestamp sin desfasaje de zona horaria)
function formatDisplayDate(dateVal) {
    if (!dateVal) return '—';
    const str = String(dateVal).trim();
    if (!str || str === 'null' || str === 'undefined') return '—';
    const datePart = str.includes('T') ? str.split('T')[0] : str.split(' ')[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        const [year, month, day] = datePart.split('-');
        return `${day}/${month}/${year}`;
    }
    const d = new Date(dateVal);
    return isNaN(d.getTime()) ? str : d.toLocaleDateString('es-AR');
}

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
    servicePayments: [],
    debts: [],
    contributions: [],
    creditCards: [],
    dailyTransactions: [],
    orders: [],
    inventoryProducts: [],
    posProducts: [],
    posCategories: [],
    posTables: [],
    posConfig: null,
    posComanda: [],
    posCurrentTableId: null,
    posCurrentTableNum: null,
    posSelectedCategory: 'ACCESO RÁPIDO',
    posSearchTerm: '',
    posCheckoutMethod: 'Efectivo',
    posMultiPayments: [],
    posOrderNotes: '',
    posOrderClient: '',
    posSortOrder: 'name-asc',
    posLastReceipt: null
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

    const dpDate = document.getElementById('dp-payment-date');
    if (dpDate) dpDate.value = today.toISOString().slice(0, 10);

    const contrDate = document.getElementById('contr-date');
    if (contrDate) contrDate.value = today.toISOString().slice(0, 10);

    const orDate = document.getElementById('or-expected-date');
    if (orDate) orDate.value = today.toISOString().slice(0, 10);

    const drDateSelector = document.getElementById('dr-date-selector');
    if (drDateSelector) {
        drDateSelector.value = today.toISOString().slice(0, 10);
        document.getElementById('dr-current-date-display').textContent = new Date(drDateSelector.value + 'T00:00:00').toLocaleDateString('es-AR');
    }

    initEventListeners();
    checkAuth();
});

// Registrar eventos de botones y formularios
function initEventListeners() {
    // Login
    document.getElementById('login-form').addEventListener('submit', handleLogin);
    document.getElementById('logout-btn').addEventListener('click', handleLogout);

    // Navegación Sidebar y Mobile Drawer Toggle
    const sidebar = document.getElementById('app-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');

    const closeMobileSidebar = () => {
        if (sidebar) sidebar.classList.remove('active');
        if (backdrop) backdrop.classList.add('hide');
    };

    document.querySelectorAll('.nav-item').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetView = e.currentTarget.getAttribute('data-view');
            switchView(targetView);
            closeMobileSidebar();
        });
    });

    // Toggle de Barra Lateral (Mobile Drawer y Desktop Collapse)
    const appContainer = document.getElementById('app-container');
    const toggleSidebar = () => {
        const isMobile = window.innerWidth <= 768;
        if (isMobile) {
            if (sidebar) {
                const isActive = sidebar.classList.toggle('active');
                if (backdrop) {
                    if (isActive) {
                        backdrop.classList.remove('hide');
                    } else {
                        backdrop.classList.add('hide');
                    }
                }
            }
        } else {
            if (appContainer) {
                const isCollapsed = appContainer.classList.toggle('sidebar-collapsed');
                localStorage.setItem('tp_sidebar_collapsed', isCollapsed ? 'true' : 'false');
            }
        }
    };

    window.toggleAppSidebar = toggleSidebar;

    const hamburgerBtn = document.getElementById('hamburger-menu-btn');
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', toggleSidebar);
    }

    const sidebarCollapseBtn = document.getElementById('sidebar-collapse-btn');
    if (sidebarCollapseBtn) {
        sidebarCollapseBtn.addEventListener('click', toggleSidebar);
    }

    const btnPosToggleSidebar = document.getElementById('btn-pos-toggle-sidebar');
    if (btnPosToggleSidebar) {
        btnPosToggleSidebar.addEventListener('click', toggleSidebar);
    }

    // Restaurar estado colapsado previo en Desktop
    if (localStorage.getItem('tp_sidebar_collapsed') === 'true' && window.innerWidth > 768) {
        if (appContainer) appContainer.classList.add('sidebar-collapsed');
    }

    if (backdrop) {
        backdrop.addEventListener('click', closeMobileSidebar);
    }

    // Filtros de mes y filtros de tabla
    document.getElementById('global-month').addEventListener('change', () => {
        loadData();
    });
    document.getElementById('filter-type').addEventListener('change', applyFilters);
    document.getElementById('filter-category').addEventListener('change', applyFilters);
    document.getElementById('filter-cc-installments').addEventListener('change', renderCreditCardsTable);

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

    // Mostrar/ocultar selector de empleado en Caja Diaria cuando es un egreso
    document.getElementById('dr-type').addEventListener('change', (e) => {
        const empGroup = document.getElementById('dr-employee-group');
        if (e.target.value === 'expense') {
            empGroup.classList.remove('hide');
        } else {
            empGroup.classList.add('hide');
            document.getElementById('dr-employee').value = '';
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
    document.getElementById('emp-cancel-btn').addEventListener('click', cancelEditEmployee);

    // Servicios Formulario
    document.getElementById('service-type-form').addEventListener('submit', handleSaveServiceType);
    document.getElementById('service-payment-form').addEventListener('submit', handleSaveServicePayment);
    initServicePaymentEvents();

    // Deudas Formulario
    document.getElementById('debt-form').addEventListener('submit', handleSaveDebt);

    // Aportes Formulario
    const contrForm = document.getElementById('contribution-form');
    if (contrForm) contrForm.addEventListener('submit', handleSaveContribution);
    
    // Tarjetas Formulario
    document.getElementById('credit-card-form').addEventListener('submit', handleSaveCreditCard);
    
    // Tarjetas Modales
    document.getElementById('close-cc-pay-btn').addEventListener('click', closeCCPayModal);
    document.getElementById('cancel-cc-pay-btn').addEventListener('click', closeCCPayModal);
    document.getElementById('cc-pay-form').addEventListener('submit', handleConfirmPayCCInstallment);
    
    document.getElementById('close-cc-history-btn').addEventListener('click', closeCCHistoryModal);
    document.getElementById('close-cc-history-footer-btn').addEventListener('click', closeCCHistoryModal);
    
    // Auto-cálculo de cuota en Deudas
    const calculateInstallmentAmount = () => {
        const total = parseFloat(document.getElementById('db-total-amount').value) || 0;
        const installments = parseInt(document.getElementById('db-installments').value) || 0;
        if (total > 0 && installments > 0) {
            document.getElementById('db-installment-amount').value = (total / installments).toFixed(2);
        } else {
            document.getElementById('db-installment-amount').value = '';
        }
    };
    document.getElementById('db-total-amount').addEventListener('input', calculateInstallmentAmount);
    document.getElementById('db-installments').addEventListener('input', calculateInstallmentAmount);

    // Modal de Pago de Cuota
    document.getElementById('close-debt-pay-btn').addEventListener('click', () => {
        document.getElementById('debt-pay-modal').classList.add('hide');
    });
    document.getElementById('cancel-debt-pay-btn').addEventListener('click', () => {
        document.getElementById('debt-pay-modal').classList.add('hide');
    });
    document.getElementById('debt-pay-form').addEventListener('submit', handleConfirmPayDebtInstallment);

    // Modal de Historial de Cuotas
    document.getElementById('close-debt-history-btn').addEventListener('click', () => {
        document.getElementById('debt-history-modal').classList.add('hide');
    });
    document.getElementById('close-debt-history-footer-btn').addEventListener('click', () => {
        document.getElementById('debt-history-modal').classList.add('hide');
    });
    
    // Pedidos a Proveedores
    const orderForm = document.getElementById('order-form');
    if (orderForm) orderForm.addEventListener('submit', handleSaveOrder);
    initPayOrderEvents();
    initTransferFundsEvents();
    
    // Inventario y Producción
    initInventoryListeners();

    // Caja Diaria
    const drForm = document.getElementById('daily-register-form');
    if (drForm) drForm.addEventListener('submit', handleSaveDailyTransaction);
    
    const drOpenForm = document.getElementById('dr-open-form');
    if (drOpenForm) drOpenForm.addEventListener('submit', handleOpenDailyRegister);

    const drCloseForm = document.getElementById('dr-close-form');
    if (drCloseForm) drCloseForm.addEventListener('submit', handleCloseDailyRegister);
    
    const drDateSelector = document.getElementById('dr-date-selector');
    if (drDateSelector) drDateSelector.addEventListener('change', () => {
        const d = new Date(drDateSelector.value + 'T00:00:00');
        const display = document.getElementById('dr-current-date-display');
        if (display) display.textContent = d.toLocaleDateString('es-AR');
        loadDailyTransactions();
    });

    const drOpenCloseModalBtn = document.getElementById('dr-open-close-modal-btn');
    if (drOpenCloseModalBtn) drOpenCloseModalBtn.addEventListener('click', openDrCloseModal);
    
    const countedCash = document.getElementById('dr-counted-cash');
    if (countedCash) countedCash.addEventListener('input', updateDrDifferenceDisplay);
    
    const nextDayCash = document.getElementById('dr-next-day-cash');
    if (nextDayCash) nextDayCash.addEventListener('input', updateDrDifferenceDisplay);
    
    const closeDrModalBtn = document.getElementById('close-dr-modal-btn');
    if (closeDrModalBtn) closeDrModalBtn.addEventListener('click', () => document.getElementById('dr-close-modal').classList.add('hide'));
    
    const cancelDrCloseBtn = document.getElementById('cancel-dr-close-btn');
    if (cancelDrCloseBtn) cancelDrCloseBtn.addEventListener('click', () => document.getElementById('dr-close-modal').classList.add('hide'));

    const drDownloadPdfBtnClosed = document.getElementById('dr-download-pdf-btn-closed');
    if (drDownloadPdfBtnClosed) drDownloadPdfBtnClosed.addEventListener('click', downloadDailyPDFReport);

    const drCountedCashInput = document.getElementById('dr-counted-cash');
    if (drCountedCashInput) drCountedCashInput.addEventListener('input', updateDrDifferenceDisplay);
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
        services: 'Gestión de Servicios y Comprobantes',
        debts: 'Control de Deudas y Financiación',
        contributions: 'Aportes de Socios',
        'credit-cards': 'Control de Cuotas de Tarjeta',
        'daily-register': 'Caja Diaria',
        orders: 'Gestión de Pedidos a Proveedores',
        inventory: 'Control de Inventario y Producción',
        'income-methods': 'Ingresos por Medio de Pago',
        pos: 'Punto de Venta - Terminal de Cobros'
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
    } else if (viewName === 'debts') {
        renderDebtsTable();
    } else if (viewName === 'contributions') {
        renderContributionsTable();
    } else if (viewName === 'credit-cards') {
        renderCreditCardsTable();
    } else if (viewName === 'daily-register') {
        loadDailyTransactions();
    } else if (viewName === 'orders') {
        renderOrdersTable();
    } else if (viewName === 'inventory') {
        loadInventoryData();
    } else if (viewName === 'income-methods') {
        loadIncomeMethodsData();
    } else if (viewName === 'pos') {
        loadPosData();
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

        // 6. Cargar Deudas
        const debtsResponse = await fetch(`${API_URL}/api/debts`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        if (debtsResponse.ok && debtsResponse.headers.get('content-type')?.includes('application/json')) {
            state.debts = await debtsResponse.json();
            updateDebtsMetrics();
        }

        // 6.5 Cargar Aportes de Socios
        const contrsResponse = await fetch(`${API_URL}/api/contributions`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        if (contrsResponse.ok && contrsResponse.headers.get('content-type')?.includes('application/json')) {
            state.contributions = await contrsResponse.json();
            if (state.currentView === 'contributions') {
                renderContributionsTable();
            }
        }

        // 6.6 Cargar Tarjetas
        const ccResponse = await fetch(`${API_URL}/api/credit-cards`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        if (ccResponse.ok && ccResponse.headers.get('content-type')?.includes('application/json')) {
            state.creditCards = await ccResponse.json();
            updateCreditCardsMetrics();
            if (state.currentView === 'credit-cards') {
                renderCreditCardsTable();
            }
        }

        // 7. Cargar Pedidos
        const ordersResponse = await fetch(`${API_URL}/api/orders`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        if (ordersResponse.ok && ordersResponse.headers.get('content-type')?.includes('application/json')) {
            state.orders = await ordersResponse.json();
            if (state.currentView === 'orders') {
                renderOrdersTable();
            }
        }
        
        // 7.5 Cargar Saldos Históricos
        const balancesResponse = await fetch(`${API_URL}/api/balances`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        if (balancesResponse.ok && balancesResponse.headers.get('content-type')?.includes('application/json')) {
            state.balances = await balancesResponse.json();
        }

        // 8. Cargar Transacciones
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
        } else if (state.currentView === 'debts') {
            renderDebtsTable();
        }
    } catch (err) {
        console.error('Error al cargar datos:', err);
    }
}

// Calcular y actualizar tarjetas de métricas
function updateMetrics() {
    let income = 0;
    let expense = 0;
    let safeBoxTotal = 0;
    let paidInstallmentsThisMonth = 0;

    let mpTotal = 0;
    let cashTotal = 0;
    let pwTotal = 0;
    let pwtTotal = 0;

    state.transactions.forEach(t => {
        const amt = parseFloat(t.amount);
        if (t.category === 'Traspaso de Fondos') {
            return; // Movimiento interno de fondos entre cuentas
        }
        if (t.type === 'income') {
            income += amt;
        } else {
            expense += amt;
            if (t.category === 'Caja de Seguridad') {
                safeBoxTotal += amt;
            }
            // Identify if this expense is an installment payment (deuda or tarjeta)
            if (t.category === 'Pago de Deuda' || (t.category === 'Otros' && t.description && t.description.startsWith('Cuota ') && t.description.includes('Tarjeta'))) {
                paidInstallmentsThisMonth += amt;
            }
        }
    });

    const balance = income - expense;

    // Calcular cuotas totales del mes (activas)
    let totalActiveInstallments = 0;
    if (state.debts) {
        state.debts.forEach(d => {
            const paid = parseInt(d.installments_paid) || 0;
            const total = parseInt(d.installments) || 1;
            if (paid < total) {
                totalActiveInstallments += parseFloat(d.installment_amount) || 0;
            }
        });
    }
    if (state.creditCards) {
        state.creditCards.forEach(c => {
            const paid = parseInt(c.installments_paid) || 0;
            const total = parseInt(c.installments) || 1;
            if (paid < total) {
                totalActiveInstallments += parseFloat(c.installment_amount) || 0;
            }
        });
    }

    const unpaidInstallmentsThisMonth = Math.max(0, totalActiveInstallments - paidInstallmentsThisMonth);
    const projectedBalance = balance - unpaidInstallmentsThisMonth;

    document.getElementById('metric-income').textContent = `$${income.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('metric-expense').textContent = `$${expense.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    const balanceEl = document.getElementById('metric-balance');
    balanceEl.textContent = `$${balance.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (balance < 0) {
        balanceEl.style.color = 'var(--danger)';
    } else {
        balanceEl.style.color = 'var(--success)';
    }

    const projBalanceEl = document.getElementById('metric-projected-balance');
    if (projBalanceEl) {
        projBalanceEl.textContent = `$${projectedBalance.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    const safeBoxEl = document.getElementById('metric-safe-box');
    if (safeBoxEl) {
        let safeBoxHist = 0;
        if (state.balances && state.balances.safe_box !== undefined) {
            safeBoxHist = state.balances.safe_box;
        } else {
            safeBoxHist = safeBoxTotal; // Fallback to current month if not loaded
        }
        safeBoxEl.textContent = `$${safeBoxHist.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // Update Transaction View Payment Method Metrics (Historic All-Time)
    let mpBalance = 0, cashBalance = 0, pwBalance = 0, pwtBalance = 0;
    if (state.balances && state.balances.payment_methods) {
        state.balances.payment_methods.forEach(b => {
            const amt = parseFloat(b.balance);
            if (b.payment_method === 'Mercado Pago') mpBalance = amt;
            else if (b.payment_method === 'Efectivo') cashBalance = amt;
            else if (b.payment_method === 'Payway') pwBalance = amt;
            else if (b.payment_method === 'Cupones') pwtBalance = amt;
        });
    }

    const txMpEl = document.getElementById('tx-metric-mp');
    const txCashEl = document.getElementById('tx-metric-cash');
    const txPwEl = document.getElementById('tx-metric-payway');
    const txPwtEl = document.getElementById('tx-metric-payway-tarjeta');
    
    if (txMpEl) txMpEl.textContent = `$${mpBalance.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (txCashEl) txCashEl.textContent = `$${cashBalance.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (txPwEl) txPwEl.textContent = `$${pwBalance.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (txPwtEl) txPwtEl.textContent = `$${pwtBalance.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    // Caja de Seguridad en Transacciones
    let sbVal = 0;
    const txSafeBoxEl = document.getElementById('tx-metric-safe-box');
    if (txSafeBoxEl) {
        if (state.balances && state.balances.safe_box !== undefined) {
            sbVal = state.balances.safe_box;
        }
        txSafeBoxEl.textContent = `$${sbVal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // Total Acumulado en Transacciones
    const txTotalEl = document.getElementById('tx-metric-total');
    if (txTotalEl) {
        const totalVal = mpBalance + cashBalance + pwBalance + pwtBalance + sbVal;
        txTotalEl.textContent = `$${totalVal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
}

// Ajuste manual de saldo
async function handleAdjustBalance(method) {
    const newBalance = prompt(`Introduce el saldo real actual para ${method}:`);
    if (newBalance === null || newBalance.trim() === '') return;
    
    const parsed = parseFloat(newBalance.replace(',', '.'));
    if (isNaN(parsed)) {
        Alert.error('El valor ingresado no es válido.');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/balances/adjust`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify({ payment_method: method, new_balance: parsed })
        });
        await safeResponseJSON(response, 'Error al ajustar saldo');
        Alert.success('Saldo ajustado con éxito.');
        loadData();
    } catch (err) {
        Alert.error(err.message);
    }
}
window.handleAdjustBalance = handleAdjustBalance;

// Ajuste manual de Caja de Seguridad
async function handleAdjustSafeBox() {
    const newBalance = prompt('Introduce el saldo real actual de la Caja de Seguridad:');
    if (newBalance === null || newBalance.trim() === '') return;
    
    const parsed = parseFloat(newBalance.replace(',', '.'));
    if (isNaN(parsed)) {
        Alert.error('El valor ingresado no es válido.');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/api/balances/adjust-safe-box`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify({ new_balance: parsed })
        });
        await safeResponseJSON(response, 'Error al ajustar Caja de Seguridad');
        Alert.success('Caja de Seguridad ajustada con éxito.');
        loadData();
    } catch (err) {
        Alert.error(err.message);
    }
}
window.handleAdjustSafeBox = handleAdjustSafeBox;

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
        const datePart = t.date.split('T')[0];
        const formattedDate = new Date(datePart + 'T00:00:00').toLocaleDateString('es-AR');
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
            <td><span class="badge badge-neutral">${t.payment_method || '-'}</span></td>
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
    const paymentMethodEl = document.getElementById('tx-payment-method');
    if (paymentMethodEl) paymentMethodEl.value = 'Efectivo';

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
    const paymentMethodEl = document.getElementById('tx-payment-method');
    const payment_method = paymentMethodEl ? paymentMethodEl.value : 'Efectivo';

    if (!amount || amount <= 0 || !date || !category) {
        Alert.warning('Por favor complete todos los datos requeridos.');
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
                payment_method,
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
        Alert.error(err.message);
    }
}

// --- ELIMINAR TRANSACCIÓN ---
async function handleDeleteTransaction(id) {
    if (!await Alert.confirm('¿Estás seguro de que quieres eliminar este registro financiero?')) return;

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
        Alert.error(err.message);
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
        const datePart = t.date.split('T')[0];
        const day = datePart.split('-')[2]; // Obtener el número de día del mes
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
        const datePart = t.date.split('T')[0];
        const dateStr = new Date(datePart + 'T00:00:00').toLocaleDateString('es-AR');
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
        Alert.warning('Por favor complete todos los datos requeridos.');
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
        Alert.error(err.message);
    }
}

async function handleDeleteCategory(id) {
    if (!await Alert.confirm('¿Estás seguro de que deseas eliminar esta categoría? Las transacciones existentes mantendrán el nombre de la categoría, pero no podrás volver a seleccionarla.')) return;

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
        Alert.error(err.message);
    }
}
window.handleDeleteCategory = handleDeleteCategory;

// --- GESTIÓN DE EMPLEADOS Y LIQUIDACIONES (UI Y API) ---

function populateEmployeeDropdowns() {
    const txEmpSelect = document.getElementById('tx-employee');
    const drEmpSelect = document.getElementById('dr-employee');
    
    if (txEmpSelect) {
        txEmpSelect.innerHTML = '<option value="">Ninguno / Gasto Operativo General</option>';
        state.employees.forEach(emp => {
            const opt = document.createElement('option');
            opt.value = emp.id;
            opt.textContent = `${emp.name} (${emp.is_partner ? 'Socio' : 'Empleado'})`;
            txEmpSelect.appendChild(opt);
        });
    }

    if (drEmpSelect) {
        drEmpSelect.innerHTML = '<option value="">Ninguno / No es adelanto</option>';
        state.employees.forEach(emp => {
            const opt = document.createElement('option');
            opt.value = emp.id;
            opt.textContent = `${emp.name} (${emp.is_partner ? 'Socio' : 'Empleado'})`;
            drEmpSelect.appendChild(opt);
        });
    }

    const withdrawalPartnerSelect = document.getElementById('dr-withdrawal-partner');
    if (withdrawalPartnerSelect) {
        withdrawalPartnerSelect.innerHTML = '<option value="">Nadie / Queda en el negocio</option>';
        state.employees.filter(emp => emp.is_partner).forEach(emp => {
            const opt = document.createElement('option');
            opt.value = emp.id;
            opt.textContent = emp.name;
            withdrawalPartnerSelect.appendChild(opt);
        });
    }
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
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    <button class="btn-primary btn-sm" onclick="startEditEmployee(${emp.id})" title="Editar empleado">
                        Editar
                    </button>
                    <button class="btn-delete" onclick="handleDeleteEmployee(${emp.id})" title="Eliminar empleado">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function startEditEmployee(id) {
    const emp = state.employees.find(e => e.id === id);
    if (!emp) return;

    document.getElementById('emp-id').value = emp.id;
    document.getElementById('emp-name').value = emp.name;
    document.getElementById('emp-salary').value = emp.base_salary;
    document.getElementById('emp-partner').checked = !!emp.is_partner;

    // Cambiar textos del formulario
    document.querySelector('#view-employees h3').textContent = 'Editar Empleado / Socio';
    document.getElementById('emp-submit-btn').textContent = 'Guardar Cambios';
    document.getElementById('emp-cancel-btn').classList.remove('hide');
}

function cancelEditEmployee() {
    document.getElementById('emp-id').value = '';
    document.getElementById('emp-name').value = '';
    document.getElementById('emp-salary').value = '';
    document.getElementById('emp-partner').checked = false;

    // Reestablecer textos del formulario
    document.querySelector('#view-employees h3').textContent = 'Registrar Empleado / Socio';
    document.getElementById('emp-submit-btn').textContent = 'Guardar Empleado';
    document.getElementById('emp-cancel-btn').classList.add('hide');
}

async function handleSaveEmployee(e) {
    e.preventDefault();

    const id = document.getElementById('emp-id').value;
    const name = document.getElementById('emp-name').value.trim();
    const base_salary = parseFloat(document.getElementById('emp-salary').value);
    const is_partner = document.getElementById('emp-partner').checked;

    if (!name || isNaN(base_salary)) {
        Alert.warning('Por favor complete todos los campos.');
        return;
    }

    const method = id ? 'PUT' : 'POST';
    const url = id ? `${API_URL}/api/employees/${id}` : `${API_URL}/api/employees`;

    try {
        const response = await fetch(url, {
            method: method,
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

        cancelEditEmployee();
        loadData();
    } catch (err) {
        Alert.error(err.message);
    }
}

async function handleDeleteEmployee(id) {
    if (!await Alert.confirm('¿Estás seguro de que deseas eliminar este empleado? Sus transacciones no se borrarán, pero dejará de listarse en el personal activo.')) return;

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
        Alert.error(err.message);
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

function initServicePaymentEvents() {
    const modeSingle = document.getElementById('sp-mode-single');
    const modeSplit = document.getElementById('sp-mode-split');
    const totalAmountInput = document.getElementById('sp-amount');
    const amount1Input = document.getElementById('sp-amount-1');
    const amount2Input = document.getElementById('sp-amount-2');
    const singleContainer = document.getElementById('sp-single-container');
    const splitContainer = document.getElementById('sp-split-container');

    const updateSplitAmounts = () => {
        const total = parseFloat(totalAmountInput.value) || 0;
        if (total > 0) {
            const half = (total / 2).toFixed(2);
            const rem = (total - parseFloat(half)).toFixed(2);
            if (amount1Input) amount1Input.value = half;
            if (amount2Input) amount2Input.value = rem;
        } else {
            if (amount1Input) amount1Input.value = '';
            if (amount2Input) amount2Input.value = '';
        }
    };

    if (modeSingle) {
        modeSingle.addEventListener('change', () => {
            if (singleContainer) singleContainer.classList.remove('hide');
            if (splitContainer) splitContainer.classList.add('hide');
        });
    }

    if (modeSplit) {
        modeSplit.addEventListener('change', () => {
            if (singleContainer) singleContainer.classList.add('hide');
            if (splitContainer) splitContainer.classList.remove('hide');
            updateSplitAmounts();
        });
    }

    if (totalAmountInput) {
        totalAmountInput.addEventListener('input', () => {
            if (modeSplit && modeSplit.checked) {
                updateSplitAmounts();
            }
        });
    }

    if (amount1Input) {
        amount1Input.addEventListener('input', () => {
            const total = parseFloat(totalAmountInput.value) || 0;
            const val1 = parseFloat(amount1Input.value) || 0;
            if (amount2Input) amount2Input.value = Math.max(0, total - val1).toFixed(2);
        });
    }

    if (amount2Input) {
        amount2Input.addEventListener('input', () => {
            const total = parseFloat(totalAmountInput.value) || 0;
            const val2 = parseFloat(amount2Input.value) || 0;
            if (amount1Input) amount1Input.value = Math.max(0, total - val2).toFixed(2);
        });
    }
}

function renderServicePaymentsTable() {
    const tbody = document.getElementById('service-payments-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (state.servicePayments.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" style="text-align: center; color: var(--text-muted); padding: 2rem;">No hay pagos registrados para este mes.</td></tr>`;
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

        const paymentMethodInfo = p.payment_method 
            ? `<div style="font-size: 0.82rem; font-weight: 500; color: var(--text-main);">💳 ${p.payment_method}</div>` 
            : `<span class="text-muted" style="font-size: 0.85rem;">—</span>`;

        tr.innerHTML = `
            <td><strong>${p.service_name}</strong></td>
            <td>${p.month}</td>
            <td>${formatDisplayDate(p.payment_date)}</td>
            <td style="font-weight: 600; color: var(--danger);">${formattedAmount}</td>
            <td>${paymentMethodInfo}</td>
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
        Alert.error(err.message);
    }
}

async function handleSaveServicePayment(e) {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData();

    const service_type_id = document.getElementById('sp-service-type').value;
    const month = document.getElementById('sp-month').value;
    const payment_date = document.getElementById('sp-date').value;
    const totalAmount = parseFloat(document.getElementById('sp-amount').value) || 0;

    if (!service_type_id || !month || !payment_date || totalAmount <= 0) {
        Alert.error('Por favor complete todos los campos obligatorios.');
        return;
    }

    const isSplit = document.getElementById('sp-mode-split') && document.getElementById('sp-mode-split').checked;
    let payments = [];
    let paymentMethodSummary = '';

    if (!isSplit) {
        const method = document.getElementById('sp-payment-method').value;
        payments = [{ payment_method: method, amount: totalAmount }];
        paymentMethodSummary = method;
    } else {
        const m1 = document.getElementById('sp-method-1').value;
        const a1 = parseFloat(document.getElementById('sp-amount-1').value) || 0;
        const m2 = document.getElementById('sp-method-2').value;
        const a2 = parseFloat(document.getElementById('sp-amount-2').value) || 0;

        if (a1 <= 0 || a2 <= 0) {
            Alert.error('Ambos montos deben ser mayores a cero.');
            return;
        }

        const totalPaid = a1 + a2;
        if (Math.abs(totalPaid - totalAmount) > 0.05) {
            Alert.error('La suma de los dos pagos debe ser igual al monto total del servicio.');
            return;
        }

        payments = [
            { payment_method: m1, amount: a1 },
            { payment_method: m2, amount: a2 }
        ];

        paymentMethodSummary = `${m1} ($${a1.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) / ${m2} ($${a2.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})`;
    }

    formData.append('service_type_id', service_type_id);
    formData.append('month', month);
    formData.append('payment_date', payment_date);
    formData.append('amount', totalAmount.toString());
    formData.append('payment_method', paymentMethodSummary);
    formData.append('payments', JSON.stringify(payments));

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
        
        // Reset a modo 1 medio de pago por defecto
        if (document.getElementById('sp-mode-single')) {
            document.getElementById('sp-mode-single').checked = true;
            if (document.getElementById('sp-single-container')) document.getElementById('sp-single-container').classList.remove('hide');
            if (document.getElementById('sp-split-container')) document.getElementById('sp-split-container').classList.add('hide');
        }

        // Volver a establecer mes y fecha actuales por defecto en el formulario
        const today = new Date();
        document.getElementById('sp-month').value = today.toISOString().slice(0, 7);
        document.getElementById('sp-date').value = today.toISOString().slice(0, 10);

        loadData();
    } catch (err) {
        Alert.error(err.message);
    }
}

async function handleDeleteServiceType(id) {
    if (!await Alert.confirm('¿Estás seguro de que deseas eliminar este tipo de servicio? Se eliminarán todos los registros de pago y comprobantes asociados de forma permanente.')) return;

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
        Alert.error(err.message);
    }
}

async function handleDeleteServicePayment(id) {
    if (!await Alert.confirm('¿Estás seguro de que deseas eliminar este pago? Se borrarán de forma permanente los archivos adjuntos y también el egreso registrado en las transacciones generales.')) return;

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
        Alert.error(err.message);
    }
}

// Exponer funciones globales al objeto window para los onclick inline de las tablas
window.handleDeleteServiceType = handleDeleteServiceType;
window.handleDeleteServicePayment = handleDeleteServicePayment;

// --- LÓGICA DE DEUDAS ---

function updateDebtsMetrics() {
    let totalRemaining = 0;
    let pendingInstallments = 0;
    let totalPaid = 0;

    state.debts.forEach(d => {
        const remainingInstallments = Math.max(0, d.installments - d.installments_paid);
        totalRemaining += remainingInstallments * d.installment_amount;
        pendingInstallments += remainingInstallments;
        totalPaid += d.installments_paid * d.installment_amount;
    });

    const remEl = document.getElementById('metric-debts-remaining');
    const pendEl = document.getElementById('metric-installments-remaining');
    const paidEl = document.getElementById('metric-debts-paid');

    if (remEl) remEl.textContent = totalRemaining.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
    if (pendEl) pendEl.textContent = pendingInstallments.toString();
    if (paidEl) paidEl.textContent = totalPaid.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
}

function renderDebtsTable() {
    const tbody = document.getElementById('debts-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (state.debts.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">No hay deudas registradas.</td></tr>`;
        return;
    }

    state.debts.forEach(d => {
        const tr = document.createElement('tr');
        const formattedTotal = d.total_amount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
        const formattedInstallment = d.installment_amount.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
        
        const remainingInstallments = Math.max(0, d.installments - d.installments_paid);
        const remainingBalance = remainingInstallments * d.installment_amount;
        const formattedRemaining = remainingBalance.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });

        const isFullyPaid = d.installments_paid >= d.installments;

        const payButton = isFullyPaid 
            ? `<span class="badge badge-income">Totalmente Pagada</span>`
            : `<button class="btn-success btn-sm" onclick="openPayInstallmentModal(${d.id}, '${d.name}', ${d.installment_amount})">Pagar Cuota</button>`;

        tr.innerHTML = `
            <td><strong>${d.name}</strong></td>
            <td>${formattedTotal}</td>
            <td>Día ${d.due_day}</td>
            <td><span class="badge ${isFullyPaid ? 'badge-income' : 'badge-expense'}">${d.installments_paid} / ${d.installments}</span></td>
            <td>${formattedInstallment}</td>
            <td style="font-weight: 600; color: ${isFullyPaid ? 'var(--success)' : 'var(--danger)'};">${formattedRemaining}</td>
            <td>
                <div style="display: flex; gap: 0.5rem; align-items: center;">
                    ${payButton}
                    <button class="btn-primary btn-sm" onclick="openDebtHistoryModal(${d.id}, '${d.name}')">Ver Historial</button>
                    <button class="btn-danger btn-sm" onclick="handleDeleteDebt(${d.id})">Eliminar</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function handleSaveDebt(e) {
    e.preventDefault();
    const name = document.getElementById('db-name').value;
    const total_amount = document.getElementById('db-total-amount').value;
    const installments = document.getElementById('db-installments').value;
    const installment_amount = document.getElementById('db-installment-amount').value;
    const due_day = document.getElementById('db-due-day').value;

    try {
        const response = await fetch(`${API_URL}/api/debts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify({ name, total_amount, installments, installment_amount, due_day })
        });

        await safeResponseJSON(response, 'Error al guardar la deuda');

        e.target.reset();
        
        // Resetear valor por defecto del día de vencimiento
        document.getElementById('db-due-day').value = '10';

        loadData();
    } catch (err) {
        Alert.error(err.message);
    }
}

function openPayInstallmentModal(id, name, amount) {
    document.getElementById('dp-debt-id').value = id;
    document.getElementById('dp-debt-name').value = name;
    document.getElementById('dp-debt-amount').value = parseFloat(amount).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
    
    const today = new Date();
    document.getElementById('dp-payment-date').value = today.toISOString().slice(0, 10);
    document.getElementById('dp-ticket').value = '';

    document.getElementById('debt-pay-modal').classList.remove('hide');
}

async function handleConfirmPayDebtInstallment(e) {
    e.preventDefault();
    const form = e.target;
    const id = document.getElementById('dp-debt-id').value;

    const formData = new FormData();
    formData.append('payment_date', document.getElementById('dp-payment-date').value);

    const ticketFile = document.getElementById('dp-ticket').files[0];
    if (ticketFile) {
        formData.append('ticket', ticketFile);
    }

    try {
        const response = await fetch(`${API_URL}/api/debts/${id}/pay-installment`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${state.token}`
            },
            body: formData
        });

        await safeResponseJSON(response, 'Error al registrar el pago de la cuota');

        document.getElementById('debt-pay-modal').classList.add('hide');
        form.reset();
        loadData();
    } catch (err) {
        Alert.error(err.message);
    }
}

async function openDebtHistoryModal(id, name) {
    document.getElementById('debt-history-title').textContent = `Historial de Cuotas - ${name}`;
    const tbody = document.getElementById('debt-history-tbody');
    if (!tbody) return;

    tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 1rem;">Cargando historial...</td></tr>`;
    document.getElementById('debt-history-modal').classList.remove('hide');

    try {
        const response = await fetch(`${API_URL}/api/debts/${id}/payments`, {
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });

        const payments = await safeResponseJSON(response, 'Error al cargar historial de cuotas');
        
        tbody.innerHTML = '';

        if (payments.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 2rem;">No hay cuotas pagadas para esta deuda.</td></tr>`;
            return;
        }

        payments.forEach(p => {
            const tr = document.createElement('tr');
            const formattedAmount = parseFloat(p.amount).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
            
            const ticketBtn = p.ticket_path 
                ? `<a href="${p.ticket_path}" target="_blank" class="btn-view-doc">📄 Ver Comprobante</a>`
                : `<span class="text-muted" style="font-size: 0.85rem;">— Sin comprobante</span>`;

            tr.innerHTML = `
                <td><strong>Cuota ${p.installment_number}</strong></td>
                <td>${formattedAmount}</td>
                <td>${formatDisplayDate(p.payment_date)}</td>
                <td>${ticketBtn}</td>
                <td>
                    <button class="btn-danger btn-sm" onclick="handleRevertDebtPayment(${p.id}, ${id}, '${name}')">
                        Revertir Pago
                    </button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--danger); padding: 1rem;">${err.message}</td></tr>`;
    }
}

async function handleRevertDebtPayment(paymentId, debtId, debtName) {
    if (!await Alert.confirm('¿Estás seguro de que deseas revertir el pago de esta cuota? Se eliminará permanentemente la transacción de egreso general y el comprobante asociado.')) return;

    try {
        const response = await fetch(`${API_URL}/api/debt-payments/${paymentId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });

        await safeResponseJSON(response, 'Error al revertir el pago de la cuota');

        // Volver a cargar datos generales
        await loadData();
        // Recargar el modal de historial
        await openDebtHistoryModal(debtId, debtName);
    } catch (err) {
        Alert.error(err.message);
    }
}

async function handleDeleteDebt(id) {
    if (!await Alert.confirm('¿Estás seguro de que deseas eliminar esta deuda? Las transacciones asociadas a cuotas pagadas previamente no se borrarán del historial.')) return;

    try {
        const response = await fetch(`${API_URL}/api/debts/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });

        await safeResponseJSON(response, 'Error al eliminar la deuda');

        loadData();
    } catch (err) {
        Alert.error(err.message);
    }
}

// Exponer funciones globales al objeto window
window.openPayInstallmentModal = openPayInstallmentModal;
window.openDebtHistoryModal = openDebtHistoryModal;
window.handleConfirmPayDebtInstallment = handleConfirmPayDebtInstallment;
window.handleRevertDebtPayment = handleRevertDebtPayment;
window.handleDeleteDebt = handleDeleteDebt;
window.updateDebtsMetrics = updateDebtsMetrics;
window.startEditEmployee = startEditEmployee;
window.cancelEditEmployee = cancelEditEmployee;
window.handleDeleteContribution = handleDeleteContribution;

// --- TARJETAS DE CRÉDITO ---
function updateCreditCardsMetrics() {
    let toPayThisMonth = 0;
    let pendingInstallments = 0;
    let totalPaid = 0;

    const selectedMonth = document.getElementById('global-month').value;
    const selDate = new Date(selectedMonth + '-01T00:00:00');
    const selYear = selDate.getFullYear();
    const selMonth = selDate.getMonth();

    if (state.creditCards) {
        state.creditCards.forEach(c => {
            const remainingInstallments = Math.max(0, c.installments - c.installments_paid);
            pendingInstallments += remainingInstallments;
            totalPaid += c.installments_paid * c.installment_amount;

            if (c.start_month) {
                const startDate = new Date(c.start_month + '-01T00:00:00');
                const offset = (selYear - startDate.getFullYear()) * 12 + (selMonth - startDate.getMonth());
                
                if (offset >= 0 && offset < c.installments) {
                    toPayThisMonth += parseFloat(c.installment_amount);
                }
            }
        });
    }

    const remEl = document.getElementById('metric-cc-remaining');
    const pendEl = document.getElementById('metric-cc-installments-remaining');
    const paidEl = document.getElementById('metric-cc-paid');

    if (remEl) remEl.textContent = toPayThisMonth.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
    if (pendEl) pendEl.textContent = pendingInstallments.toString();
    if (paidEl) paidEl.textContent = totalPaid.toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
}

function renderCreditCardsTable() {
    const tbody = document.getElementById('credit-cards-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    const filterInstallments = document.getElementById('filter-cc-installments').value;
    const filteredCards = state.creditCards.filter(c => {
        if (!filterInstallments) return true;
        return parseInt(c.installments) === parseInt(filterInstallments);
    });

    if (filteredCards.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No hay tarjetas registradas que coincidan con el filtro.</td></tr>';
        return;
    }
    filteredCards.forEach(c => {
        const tr = document.createElement('tr');
        const totalAmt = parseFloat(c.total_amount).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
        const instAmt = parseFloat(c.installment_amount).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
        const paidCount = parseInt(c.installments_paid) || 0;
        const remainingCount = c.installments - paidCount;
        const isPaidOff = remainingCount <= 0;
        tr.innerHTML = `
            <td><strong>${c.cardholder}</strong></td>
            <td>${totalAmt} (${c.installments} cuotas)</td>
            <td>${c.start_month}</td>
            <td><span class="badge ${isPaidOff ? 'badge-income' : 'badge-expense'}">${paidCount} / ${c.installments}</span></td>
            <td>${instAmt}</td>
            <td>${isPaidOff ? 'Pagado' : remainingCount + ' cuotas'}</td>
            <td>
                <div style="display: flex; gap: 0.5rem;">
                    <button class="btn-success btn-sm" onclick="openPayCCModal(${c.id}, '${c.cardholder}', ${c.installment_amount})" ${isPaidOff ? 'disabled style="opacity: 0.5;"' : 'title="Pagar Cuota"'}>✓ Pagar</button>
                    <button class="btn-secondary btn-sm" onclick="openCCHistoryModal(${c.id}, '${c.cardholder}')" title="Historial de Pagos">Historial</button>
                    <button class="btn-danger-outline btn-sm" onclick="handleDeleteCreditCard(${c.id})">Borrar</button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function handleSaveCreditCard(e) {
    e.preventDefault();
    const cardholder = document.getElementById('cc-cardholder').value;
    const total_amount = document.getElementById('cc-total-amount').value;
    const installments = document.getElementById('cc-installments').value;
    const start_month = document.getElementById('cc-start-month').value;

    try {
        const response = await fetch(`${API_URL}/api/credit-cards`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.token}` },
            body: JSON.stringify({ cardholder, total_amount, installments, start_month })
        });
        await safeResponseJSON(response, 'Error al guardar la tarjeta');
        document.getElementById('credit-card-form').reset();
        await loadData();
        Alert.success('Tarjeta registrada correctamente.');
    } catch (err) {
        Alert.error(err.message);
    }
}

function openPayCCModal(id, cardholder, amount) {
    document.getElementById('ccp-card-id').value = id;
    document.getElementById('ccp-cardholder').value = cardholder;
    document.getElementById('ccp-card-amount').value = '$' + amount;
    document.getElementById('ccp-payment-date').value = new Date().toISOString().slice(0, 10);
    document.getElementById('cc-pay-modal').classList.remove('hide');
}
function closeCCPayModal() {
    document.getElementById('cc-pay-modal').classList.add('hide');
    document.getElementById('cc-pay-form').reset();
}

async function handleConfirmPayCCInstallment(e) {
    e.preventDefault();
    const id = document.getElementById('ccp-card-id').value;
    const payment_date = document.getElementById('ccp-payment-date').value;
    try {
        const response = await fetch(`${API_URL}/api/credit-cards/${id}/pay-installment`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${state.token}` },
            body: JSON.stringify({ payment_date })
        });
        await safeResponseJSON(response, 'Error al registrar el pago de la tarjeta');
        closeCCPayModal();
        await loadData();
        Alert.success('Cuota de tarjeta pagada con éxito.');
    } catch (err) {
        Alert.error(err.message);
    }
}

async function openCCHistoryModal(id, cardholder) {
    document.getElementById('cc-history-title').textContent = `Historial de Cuotas: ${cardholder}`;
    const tbody = document.getElementById('cc-history-tbody');
    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Cargando...</td></tr>';
    document.getElementById('cc-history-modal').classList.remove('hide');
    try {
        const response = await fetch(`${API_URL}/api/credit-cards/${id}/payments`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        const payments = await safeResponseJSON(response, 'Error al obtener historial');
        tbody.innerHTML = '';
        if (payments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">No hay pagos registrados.</td></tr>';
            return;
        }
        payments.forEach(p => {
            const tr = document.createElement('tr');
            const formattedAmount = parseFloat(p.amount).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
            tr.innerHTML = `
                <td><strong>Cuota ${p.installment_number}</strong></td>
                <td>${formattedAmount}</td>
                <td>${formatDisplayDate(p.payment_date)}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: var(--danger);">Wait error: ${err.message}</td></tr>`;
    }
}
function closeCCHistoryModal() {
    document.getElementById('cc-history-modal').classList.add('hide');
}

async function handleDeleteCreditCard(id) {
    if (!await Alert.confirm('¿Estás seguro de que deseas eliminar esta tarjeta y todo su historial de cuotas?')) return;
    try {
        const response = await fetch(`${API_URL}/api/credit-cards/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        await safeResponseJSON(response, 'Error al eliminar la tarjeta');
        loadData();
    } catch (err) {
        Alert.error(err.message);
    }
}

window.openPayCCModal = openPayCCModal;
window.openCCHistoryModal = openCCHistoryModal;
window.handleDeleteCreditCard = handleDeleteCreditCard;

// --- APORTES DE SOCIOS ---
function renderContributionsTable() {
    const tbody = document.getElementById('contributions-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    // Inicializar totales
    const totals = {
        Thiago: { Pesos: 0, Dolar: 0 },
        Pablo: { Pesos: 0, Dolar: 0 },
        Luca: { Pesos: 0, Dolar: 0 }
    };

    state.contributions.forEach(contr => {
        const partner = contr.partner_name;
        const currency = contr.currency; // 'Pesos' o 'Dolar'
        const amt = parseFloat(contr.amount) || 0;

        if (totals[partner] && totals[partner][currency] !== undefined) {
            totals[partner][currency] += amt;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${contr.partner_name}</strong></td>
            <td>${formatCurrency(contr.amount, contr.currency)}</td>
            <td><span class="badge ${contr.currency === 'Dolar' ? 'badge-income' : 'badge-balance'}">${contr.currency}</span></td>
            <td>${contr.date}</td>
            <td>${contr.reason || '-'}</td>
            <td>
                <button class="btn-danger-outline btn-sm" onclick="handleDeleteContribution(${contr.id})">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById('total-thiago-pesos').textContent = formatCurrency(totals.Thiago.Pesos, 'Pesos');
    document.getElementById('total-pablo-pesos').textContent = formatCurrency(totals.Pablo.Pesos, 'Pesos');
    document.getElementById('total-luca-pesos').textContent = formatCurrency(totals.Luca.Pesos, 'Pesos');

    document.getElementById('total-thiago-dolar').textContent = formatCurrency(totals.Thiago.Dolar, 'Dolar');
    document.getElementById('total-pablo-dolar').textContent = formatCurrency(totals.Pablo.Dolar, 'Dolar');
    document.getElementById('total-luca-dolar').textContent = formatCurrency(totals.Luca.Dolar, 'Dolar');
}

function formatCurrency(amount, currency) {
    const value = parseFloat(amount) || 0;
    if (currency === 'Dolar') {
        return 'u$s ' + value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else {
        return '$ ' + value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    }
}

async function handleSaveContribution(e) {
    e.preventDefault();
    const partner_name = document.getElementById('contr-partner').value;
    const amount = parseFloat(document.getElementById('contr-amount').value);
    const currency = document.getElementById('contr-currency').value;
    const date = document.getElementById('contr-date').value;
    const reason = document.getElementById('contr-reason').value;

    try {
        const response = await fetch(`${API_URL}/api/contributions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify({ partner_name, amount, currency, date, reason })
        });

        await safeResponseJSON(response, 'Error al guardar el aporte');

        document.getElementById('contribution-form').reset();
        
        const today = new Date().toISOString().slice(0, 10);
        document.getElementById('contr-date').value = today;

        await loadData();
        Alert.success('Aporte registrado correctamente.');
    } catch (err) {
        Alert.error(err.message);
    }
}

async function handleDeleteContribution(id) {
    if (!await Alert.confirm('¿Estás seguro de que deseas eliminar este aporte?')) return;

    try {
        const response = await fetch(`${API_URL}/api/contributions/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });

        await safeResponseJSON(response, 'Error al eliminar el aporte');

        await loadData();
    } catch (err) {
        Alert.error(err.message);
    }
}

// --- CAJA DIARIA ---
async function loadDailyTransactions() {
    const drDateSelector = document.getElementById('dr-date-selector');
    if (!drDateSelector) return;
    const date = drDateSelector.value;
    if (!date) return;
    
    // Ocultar todo primero
    document.getElementById('dr-unopened-state').classList.add('hide');
    document.getElementById('dr-open-state').classList.add('hide');
    document.getElementById('dr-closed-state').classList.add('hide');
    
    try {
        // Consultar estado de la caja
        const regResponse = await fetch(`${API_URL}/api/daily-registers/${date}`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        
        if (!regResponse.ok) throw new Error('Error al consultar estado de caja');
        const registerData = await regResponse.json();
        state.dailyRegister = registerData.status === 'unopened' ? null : registerData;
        
        if (!state.dailyRegister) {
            document.getElementById('dr-unopened-state').classList.remove('hide');
            return;
        }
        
        // Consultar movimientos
        const txResponse = await fetch(`${API_URL}/api/daily-transactions?date=${date}`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        
        if (txResponse.ok) {
            state.dailyTransactions = await txResponse.json();
            renderDailyTransactionsTable();
            updateDailyMetrics();
            
            if (state.dailyRegister.status === 'open') {
                document.getElementById('dr-open-state').classList.remove('hide');
            } else {
                // Caja cerrada: mostrar banner + tabla editable
                document.getElementById('dr-closed-state').classList.remove('hide');
                document.getElementById('dr-open-state').classList.remove('hide');
            }
        }
    } catch (err) {
        console.error('Error loading daily transactions:', err);
    }
}

async function handleOpenDailyRegister(e) {
    e.preventDefault();
    const date = document.getElementById('dr-date-selector').value;
    const initialCash = document.getElementById('dr-initial-cash').value;
    
    try {
        const response = await fetch(`${API_URL}/api/daily-registers/open`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${state.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ date, initial_cash: initialCash })
        });
        
        await safeResponseJSON(response, 'Error al abrir la caja');
        Alert.success('Caja abierta correctamente.');
        loadDailyTransactions();
    } catch (err) {
        Alert.error(err.message);
    }
}

function renderDailyTransactionsTable() {
    const tbody = document.getElementById('daily-transactions-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    if (state.dailyTransactions.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align: center; color: var(--text-muted); padding: 2rem;">No hay movimientos registrados para este día.</td></tr>`;
        return;
    }
    
    const isClosed = state.dailyRegister?.status === 'closed';
    
    state.dailyTransactions.forEach(t => {
        const tr = document.createElement('tr');
        tr.id = `dr-row-${t.id}`;
        const formattedAmount = parseFloat(t.amount).toLocaleString('es-AR', { style: 'currency', currency: 'ARS' });
        
        let photoHtml = '<span class="text-muted">—</span>';
        if (t.photo_path) {
            photoHtml = `<a href="${t.photo_path}" target="_blank" style="color: var(--primary); text-decoration: underline;">Ver Foto</a>`;
        }
        
        tr.innerHTML = `
            <td><span class="badge badge-${t.type}">${t.type === 'income' ? 'Ingreso' : 'Egreso'}</span></td>
            <td>${t.payment_method}</td>
            <td>${t.description || '<span class="text-muted">—</span>'}</td>
            <td class="cell-amount ${t.type}">${t.type === 'income' ? '+' : '-'}${formattedAmount}</td>
            <td>${photoHtml}</td>
            <td style="display: flex; gap: 4px; align-items: center;">
                <button class="btn-icon" onclick="handleEditDailyTransaction(${t.id})" title="Editar" style="color: var(--primary-color); background: none; border: none; cursor: pointer; padding: 4px;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="btn-delete" onclick="handleDeleteDailyTransaction(${t.id})" title="Eliminar movimiento">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function getExpectedCash() {
    let cashIncome = 0;
    let cashExpense = 0;
    state.dailyTransactions.forEach(t => {
        if (t.payment_method === 'Efectivo') {
            if (t.type === 'income') cashIncome += parseFloat(t.amount);
            else cashExpense += parseFloat(t.amount);
        }
    });
    const initial = state.dailyRegister ? parseFloat(state.dailyRegister.initial_cash) : 0;
    return initial + cashIncome - cashExpense;
}

function updateDailyMetrics() {
    let income = 0;
    let expense = 0;
    
    state.dailyTransactions.forEach(t => {
        if (t.type === 'income') income += parseFloat(t.amount);
        else expense += parseFloat(t.amount);
    });
    
    const initial = state.dailyRegister ? parseFloat(state.dailyRegister.initial_cash) : 0;
    const initialEl = document.getElementById('dr-metric-initial');
    if (initialEl) initialEl.textContent = `$${initial.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    document.getElementById('dr-metric-income').textContent = `$${income.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    document.getElementById('dr-metric-expense').textContent = `$${expense.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    
    const expectedCash = getExpectedCash();
    const balanceEl = document.getElementById('dr-metric-balance');
    balanceEl.textContent = `$${expectedCash.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    balanceEl.style.color = expectedCash < 0 ? 'var(--danger)' : 'var(--success)';
}

async function handleSaveDailyTransaction(e) {
    e.preventDefault();
    
    const date = document.getElementById('dr-date-selector').value;
    const type = document.getElementById('dr-type').value;
    const amount = document.getElementById('dr-amount').value;
    const paymentMethod = document.getElementById('dr-payment-method').value;
    const description = document.getElementById('dr-description').value;
    const employeeId = document.getElementById('dr-employee').value;
    const photoFile = document.getElementById('dr-photo').files[0];
    
    const formData = new FormData();
    formData.append('date', date);
    formData.append('type', type);
    formData.append('amount', amount);
    formData.append('payment_method', paymentMethod);
    formData.append('description', description);
    if (employeeId) {
        formData.append('employee_id', employeeId);
    }
    if (photoFile) {
        formData.append('photo', photoFile);
    }
    
    try {
        const response = await fetch(`${API_URL}/api/daily-transactions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${state.token}`
            },
            body: formData
        });
        
        await safeResponseJSON(response, 'Error al guardar el movimiento diario');
        
        document.getElementById('daily-register-form').reset();
        loadDailyTransactions();
        Alert.success('Movimiento registrado correctamente.');
    } catch (err) {
        Alert.error(err.message);
    }
}

async function handleDeleteDailyTransaction(id) {
    if (!await Alert.confirm('¿Eliminar este movimiento de caja diaria?')) return;
    
    try {
        const response = await fetch(`${API_URL}/api/daily-transactions/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${state.token}`
            }
        });
        
        await safeResponseJSON(response, 'Error al eliminar el movimiento diario');
        loadDailyTransactions();
    } catch (err) {
        Alert.error(err.message);
    }
}
window.handleDeleteDailyTransaction = handleDeleteDailyTransaction;

async function handleEditDailyTransaction(id) {
    const tx = state.dailyTransactions.find(t => t.id === id);
    if (!tx) return;
    
    const row = document.getElementById(`dr-row-${id}`);
    if (!row) return;
    
    row.innerHTML = `
        <td>
            <select id="edit-dr-type-${id}" style="padding: 4px; font-size: 0.85rem; border-radius: 4px; border: 1px solid var(--border-color);">
                <option value="income" ${tx.type === 'income' ? 'selected' : ''}>Ingreso</option>
                <option value="expense" ${tx.type === 'expense' ? 'selected' : ''}>Egreso</option>
            </select>
        </td>
        <td>
            <select id="edit-dr-method-${id}" style="padding: 4px; font-size: 0.85rem; border-radius: 4px; border: 1px solid var(--border-color);">
                <option value="Efectivo" ${tx.payment_method === 'Efectivo' ? 'selected' : ''}>Efectivo</option>
                <option value="Mercado Pago" ${tx.payment_method === 'Mercado Pago' ? 'selected' : ''}>Mercado Pago</option>
                <option value="Payway" ${tx.payment_method === 'Payway' ? 'selected' : ''}>Payway</option>
                <option value="Cupones" ${tx.payment_method === 'Cupones' ? 'selected' : ''}>Cupones</option>
            </select>
        </td>
        <td><input type="text" id="edit-dr-desc-${id}" value="${tx.description || ''}" style="padding: 4px; width: 100%; font-size: 0.85rem; border-radius: 4px; border: 1px solid var(--border-color);"></td>
        <td><input type="number" id="edit-dr-amount-${id}" value="${parseFloat(tx.amount)}" step="0.01" min="0.01" style="padding: 4px; width: 90px; font-size: 0.85rem; border-radius: 4px; border: 1px solid var(--border-color);"></td>
        <td></td>
        <td style="display: flex; gap: 4px; align-items: center;">
            <button class="btn-primary" onclick="handleSaveEditDailyTransaction(${id})" style="padding: 4px 10px; font-size: 0.8rem;">Guardar</button>
            <button onclick="loadDailyTransactions()" style="padding: 4px 10px; font-size: 0.8rem; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 4px; cursor: pointer;">Cancelar</button>
        </td>
    `;
}
window.handleEditDailyTransaction = handleEditDailyTransaction;

async function handleSaveEditDailyTransaction(id) {
    const type = document.getElementById(`edit-dr-type-${id}`).value;
    const payment_method = document.getElementById(`edit-dr-method-${id}`).value;
    const description = document.getElementById(`edit-dr-desc-${id}`).value;
    const amount = document.getElementById(`edit-dr-amount-${id}`).value;
    
    try {
        const response = await fetch(`${API_URL}/api/daily-transactions/${id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${state.token}`
            },
            body: JSON.stringify({ type, amount, payment_method, description })
        });
        await safeResponseJSON(response, 'Error al editar el movimiento');
        Alert.success('Movimiento actualizado.');
        loadDailyTransactions();
    } catch (err) {
        Alert.error(err.message);
    }
}
window.handleSaveEditDailyTransaction = handleSaveEditDailyTransaction;

function openDrCloseModal() {
    document.getElementById('dr-close-form').reset();
    document.getElementById('dr-difference-display').classList.add('hide');
    document.getElementById('dr-withdrawal-partner').value = '';
    
    let gross = 0;
    let net = 0;
    let cashIn = 0, cashOut = 0;
    let mpIn = 0, mpOut = 0;
    let pwIn = 0, pwOut = 0;
    
    state.dailyTransactions.forEach(t => {
        const amt = parseFloat(t.amount);
        if (t.type === 'income') {
            gross += amt;
            net += amt;
            if (t.payment_method === 'Efectivo') cashIn += amt;
            if (t.payment_method === 'Mercado Pago') mpIn += amt;
            if (t.payment_method === 'Payway' || t.payment_method === 'Cupones') pwIn += amt;
        } else {
            net -= amt;
            if (t.payment_method === 'Efectivo') cashOut += amt;
            if (t.payment_method === 'Mercado Pago') mpOut += amt;
            if (t.payment_method === 'Payway' || t.payment_method === 'Cupones') pwOut += amt;
        }
    });
    
    const cashNet = cashIn - cashOut;
    const virtualNet = (mpIn - mpOut) + (pwIn - pwOut);
    
    document.getElementById('dr-modal-gross').textContent = `$${gross.toLocaleString('es-AR', {minimumFractionDigits:2})}`;
    document.getElementById('dr-modal-net').textContent = `$${net.toLocaleString('es-AR', {minimumFractionDigits:2})}`;
    document.getElementById('dr-modal-cash-net').textContent = `$${cashNet.toLocaleString('es-AR', {minimumFractionDigits:2})}`;
    document.getElementById('dr-modal-virtual-net').textContent = `$${virtualNet.toLocaleString('es-AR', {minimumFractionDigits:2})}`;
    document.getElementById('dr-modal-mp').textContent = `$${(mpIn - mpOut).toLocaleString('es-AR', {minimumFractionDigits:2})}`;
    document.getElementById('dr-modal-pw').textContent = `$${(pwIn - pwOut).toLocaleString('es-AR', {minimumFractionDigits:2})}`;
    
    const expected = getExpectedCash();
    document.getElementById('dr-modal-expected-cash').textContent = `$${expected.toLocaleString('es-AR', {minimumFractionDigits:2})}`;
    document.getElementById('dr-close-modal').classList.remove('hide');
    updateDrDifferenceDisplay();
}

function updateDrDifferenceDisplay() {
    const counted = parseFloat(document.getElementById('dr-counted-cash').value) || 0;
    const nextDayCash = parseFloat(document.getElementById('dr-next-day-cash').value) || 0;
    
    // Diferencia de arqueo
    const expected = getExpectedCash();
    const diff = counted - expected;
    const diffEl = document.getElementById('dr-difference-display');
    
    // Retiro de dinero
    const takeHome = Math.max(0, counted - nextDayCash);
    const takeHomeEl = document.getElementById('dr-take-home-cash');
    if (takeHomeEl) {
        takeHomeEl.textContent = `$${takeHome.toLocaleString('es-AR', {minimumFractionDigits:2})}`;
    }
    
    if (document.getElementById('dr-withdrawal-partner')) {
        document.getElementById('dr-withdrawal-partner').disabled = takeHome <= 0;
    }
    
    diffEl.classList.remove('hide', 'alert-success', 'alert-danger', 'alert-warning');
    if (diff === 0) {
        diffEl.classList.add('alert-success');
        diffEl.textContent = '¡Caja Cuadrada Perfectamente! ($0.00 de diferencia)';
    } else if (diff > 0) {
        diffEl.classList.add('alert-warning');
        diffEl.textContent = `Sobrante de Caja: +$${diff.toLocaleString('es-AR', {minimumFractionDigits:2})}`;
    } else {
        diffEl.classList.add('alert-danger');
        diffEl.textContent = `Faltante de Caja: -$${Math.abs(diff).toLocaleString('es-AR', {minimumFractionDigits:2})}`;
    }
}

async function handleCloseDailyRegister(e) {
    e.preventDefault();
    const date = document.getElementById('dr-date-selector').value;
    const counted = parseFloat(document.getElementById('dr-counted-cash').value) || 0;
    const nextDayCash = parseFloat(document.getElementById('dr-next-day-cash').value) || 0;
    
    const withdrawalPartnerId = document.getElementById('dr-withdrawal-partner').value;
    const withdrawalAmount = Math.max(0, counted - nextDayCash);
    
    const expected = getExpectedCash();
    const difference = counted - expected;
    
    try {
        const response = await fetch(`${API_URL}/api/daily-registers/close`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${state.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                date, 
                final_cash_counted: counted, 
                difference, 
                next_day_cash: nextDayCash,
                withdrawal_amount: withdrawalAmount,
                withdrawal_partner_id: withdrawalPartnerId || null
            })
        });
        
        await safeResponseJSON(response, 'Error al cerrar la caja');
        document.getElementById('dr-close-modal').classList.add('hide');
        Alert.success('Caja cerrada y balance sincronizado.');
        
        if (state.dailyRegister) {
            state.dailyRegister.final_cash_counted = counted;
            state.dailyRegister.next_day_cash = nextDayCash;
            state.dailyRegister.status = 'closed';
        }
        
        downloadDailyPDFReport(difference);
        loadDailyTransactions();
    } catch (err) {
        Alert.error(err.message);
    }
}

function downloadDailyPDFReport(diffArg) {
    const dateStr = document.getElementById('dr-date-selector').value;
    const formattedDate = new Date(dateStr + 'T00:00:00').toLocaleDateString('es-AR');
    
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.setTextColor(217, 119, 6);
    doc.text(`Tutto Passa - Arqueo de Caja`, 14, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(55, 65, 81);
    doc.text(`Fecha: ${formattedDate}`, 14, 30);
    
    const initialCash = state.dailyRegister ? parseFloat(state.dailyRegister.initial_cash) : 0;
    const finalCashCounted = state.dailyRegister?.final_cash_counted !== undefined 
                             ? parseFloat(state.dailyRegister.final_cash_counted) 
                             : 0;
    
    doc.text(`Caja Inicial: $${initialCash.toLocaleString('es-AR', {minimumFractionDigits:2})}`, 14, 40);
    
    let totalIncome = 0;
    let totalExpense = 0;
    let cashIn = 0, cashOut = 0;
    let mpIn = 0, mpOut = 0;
    let pwIn = 0, pwOut = 0;
    
    const tableData = state.dailyTransactions.map(t => {
        const isIncome = t.type === 'income';
        const amt = parseFloat(t.amount);
        if (isIncome) {
            totalIncome += amt;
            if (t.payment_method === 'Efectivo') cashIn += amt;
            if (t.payment_method === 'Mercado Pago') mpIn += amt;
            if (t.payment_method === 'Payway' || t.payment_method === 'Cupones') pwIn += amt;
        } else {
            totalExpense += amt;
            if (t.payment_method === 'Efectivo') cashOut += amt;
            if (t.payment_method === 'Mercado Pago') mpOut += amt;
            if (t.payment_method === 'Payway' || t.payment_method === 'Cupones') pwOut += amt;
        }
        
        return [
            isIncome ? 'Ingreso' : 'Egreso',
            t.payment_method,
            t.description || '-',
            isIncome ? `+$${amt.toLocaleString('es-AR', {minimumFractionDigits: 2})}` : `-$${amt.toLocaleString('es-AR', {minimumFractionDigits: 2})}`
        ];
    });
    
    doc.autoTable({
        startY: 50,
        head: [['Tipo', 'Método', 'Descripción', 'Monto']],
        body: tableData.length > 0 ? tableData : [['-', 'Sin movimientos', '-', '-']],
        theme: 'striped',
        headStyles: { fillColor: [217, 119, 6] },
        styles: { fontSize: 10 }
    });
    
    let finalY = doc.lastAutoTable.finalY || 50;
    
    const expectedCash = getExpectedCash();
    const difference = typeof diffArg === 'number' ? diffArg : (finalCashCounted - expectedCash);
    
    const netCash = cashIn - cashOut;
    const netMP = mpIn - mpOut;
    const netPW = pwIn - pwOut;
    
    doc.setFontSize(14);
    doc.setTextColor(217, 119, 6);
    doc.text(`Rendimiento del Día`, 14, finalY + 15);
    
    doc.setFontSize(11);
    doc.setTextColor(31, 41, 55);
    doc.text(`Ganancia Bruta (Total Ingresos): $${totalIncome.toLocaleString('es-AR', {minimumFractionDigits: 2})}`, 14, finalY + 25);
    doc.text(`Total Egresos: $${totalExpense.toLocaleString('es-AR', {minimumFractionDigits: 2})}`, 14, finalY + 32);
    
    doc.setFont('helvetica', 'bold');
    doc.text(`Ganancia Limpia (Neta): $${(totalIncome - totalExpense).toLocaleString('es-AR', {minimumFractionDigits: 2})}`, 14, finalY + 39);
    doc.setFont('helvetica', 'normal');
    
    doc.text(`Ganancia en Efectivo: $${netCash.toLocaleString('es-AR', {minimumFractionDigits: 2})}`, 120, finalY + 25);
    doc.text(`Billeteras Virtuales: $${(netMP + netPW).toLocaleString('es-AR', {minimumFractionDigits: 2})}`, 120, finalY + 32);
    doc.setFontSize(9);
    doc.setTextColor(107, 114, 128);
    doc.text(`(MP: $${netMP.toLocaleString('es-AR', {minimumFractionDigits:2})} | Payway: $${netPW.toLocaleString('es-AR', {minimumFractionDigits:2})})`, 120, finalY + 38);
    
    finalY += 50;
    doc.setFontSize(14);
    doc.setTextColor(217, 119, 6);
    doc.text(`Resumen Físico (Efectivo)`, 14, finalY);
    
    doc.setFontSize(12);
    doc.setTextColor(31, 41, 55);
    doc.text(`Saldo Teórico Esperado: $${expectedCash.toLocaleString('es-AR', {minimumFractionDigits:2})}`, 14, finalY + 10);
    doc.text(`Efectivo Real Contado: $${finalCashCounted.toLocaleString('es-AR', {minimumFractionDigits:2})}`, 14, finalY + 17);
    
    if (difference === 0) {
        doc.setTextColor(16, 185, 129); // Success
        doc.text(`Diferencia: Caja Cuadrada Perfectamente`, 14, finalY + 27);
    } else if (difference > 0) {
        doc.setTextColor(217, 119, 6); // Warning
        doc.text(`Diferencia: Sobrante de +$${difference.toLocaleString('es-AR', {minimumFractionDigits:2})}`, 14, finalY + 27);
    } else {
        doc.setTextColor(239, 68, 68); // Danger
        doc.text(`Diferencia: Faltante de -$${Math.abs(difference).toLocaleString('es-AR', {minimumFractionDigits:2})}`, 14, finalY + 27);
    }
    
    if (state.dailyRegister && state.dailyRegister.next_day_cash !== undefined && state.dailyRegister.next_day_cash !== null) {
        doc.setFontSize(11);
        doc.setTextColor(107, 114, 128); // Gray
        const nextDay = parseFloat(state.dailyRegister.next_day_cash);
        doc.text(`Fondo Fijo que queda para el siguiente día: $${nextDay.toLocaleString('es-AR', {minimumFractionDigits:2})}`, 14, finalY + 37);
        
        const takeHome = Math.max(0, finalCashCounted - nextDay);
        if (takeHome > 0) {
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(217, 119, 6);
            doc.text(`Envío a Caja de Seguridad: $${takeHome.toLocaleString('es-AR', {minimumFractionDigits:2})}`, 14, finalY + 45);
            
            const partnerSelect = document.getElementById('dr-withdrawal-partner');
            if (partnerSelect && partnerSelect.selectedIndex > 0) {
                const partnerName = partnerSelect.options[partnerSelect.selectedIndex].text;
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(107, 114, 128);
                doc.text(`Responsable del envío: ${partnerName}`, 14, finalY + 51);
            }
        }
    }
    
    doc.save(`Arqueo_Caja_${dateStr}.pdf`);
}
// --- GESTIÓN DE PEDIDOS ---
function renderOrdersTable() {
    const tbody = document.getElementById('orders-tbody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    let totalPending = 0;
    
    if (state.orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay pedidos registrados</td></tr>';
    } else {
        state.orders.forEach(order => {
            if (order.status === 'pending') {
                totalPending += parseFloat(order.amount);
            }
            
            const tr = document.createElement('tr');
            
            let statusBadge = '';
            let actionButtons = '';
            
            if (order.status === 'pending') {
                statusBadge = '<span class="status-badge" style="background:#fef3c7; color:#d97706; padding:0.25rem 0.5rem; border-radius:4px; font-size:0.8rem; font-weight:600;">Pendiente</span>';
                actionButtons = `
                    <button class="btn-icon" style="color: #10b981;" onclick="handleUpdateOrderStatus(${order.id}, 'completed')" title="Marcar como Pagado">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                    </button>
                    <button class="btn-icon" style="color: #ef4444;" onclick="handleUpdateOrderStatus(${order.id}, 'cancelled')" title="Cancelar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                `;
            } else if (order.status === 'completed') {
                const methodInfo = order.payment_method ? `<div style="font-size: 0.78rem; color: #4b5563; font-weight: 500; margin-top: 3px;">💳 ${order.payment_method}</div>` : '';
                const payDateText = order.payment_date ? ` (${formatDisplayDate(order.payment_date)})` : '';
                statusBadge = `<span class="status-badge" style="background:#d1fae5; color:#059669; padding:0.25rem 0.5rem; border-radius:4px; font-size:0.8rem; font-weight:600;">Pagado${payDateText}</span>${methodInfo}`;
            } else {
                statusBadge = '<span class="status-badge" style="background:#fee2e2; color:#dc2626; padding:0.25rem 0.5rem; border-radius:4px; font-size:0.8rem; font-weight:600;">Cancelado</span>';
            }
            
            actionButtons += `
                <button class="btn-icon text-danger" onclick="handleDeleteOrder(${order.id})" title="Eliminar del registro">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            `;
            
            const expectedDateFormatted = formatDisplayDate(order.expected_date);
            
            tr.innerHTML = `
                <td>${expectedDateFormatted}</td>
                <td style="font-weight: 500;">${order.order_number}</td>
                <td style="font-weight: 600; color: #dc2626;">$${parseFloat(order.amount).toLocaleString('es-AR', {minimumFractionDigits: 2})}</td>
                <td>${statusBadge}</td>
                <td style="display: flex; gap: 0.5rem; justify-content: center; align-items: center;">${actionButtons}</td>
            `;
            tbody.appendChild(tr);
        });
    }
    
    document.getElementById('orders-total-pending').textContent = `$${totalPending.toLocaleString('es-AR', {minimumFractionDigits: 2})}`;
}

async function handleSaveOrder(e) {
    e.preventDefault();
    const order_number = document.getElementById('or-number').value;
    const amount = document.getElementById('or-amount').value;
    const expected_date = document.getElementById('or-expected-date').value;
    
    try {
        const response = await fetch(`${API_URL}/api/orders`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${state.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ order_number, amount, expected_date })
        });
        
        await safeResponseJSON(response, 'Error al guardar el pedido');
        Alert.success('Pedido registrado correctamente');
        document.getElementById('order-form').reset();
        const orExpectedDate = document.getElementById('or-expected-date');
        if (orExpectedDate) orExpectedDate.value = new Date().toISOString().slice(0, 10);
        loadData();
    } catch (err) {
        Alert.error(err.message);
    }
}

async function handleUpdateOrderStatus(id, status) {
    if (status === 'completed') {
        openPayOrderModal(id);
        return;
    }

    if (!await Alert.confirm('¿Confirmas que deseas CANCELAR este pedido?', 'Confirmar Acción', 'Sí, cancelar')) return;
    
    try {
        const response = await fetch(`${API_URL}/api/orders/${id}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${state.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        
        await safeResponseJSON(response, 'Error al actualizar el pedido');
        Alert.success('Pedido cancelado');
        loadData();
    } catch (err) {
        Alert.error(err.message);
    }
}

async function handleDeleteOrder(id) {
    if (!await Alert.confirm('¿Eliminar este pedido del registro? Si tenía un pago asociado en el balance, se eliminará también.')) return;
    
    try {
        const response = await fetch(`${API_URL}/api/orders/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        
        await safeResponseJSON(response, 'Error al eliminar el pedido');
        loadData();
    } catch (err) {
        Alert.error(err.message);
    }
}

window.handleUpdateOrderStatus = handleUpdateOrderStatus;
window.handleDeleteOrder = handleDeleteOrder;

// --- INVENTARIO Y PRODUCCIÓN ---
function initInventoryListeners() {
    // Tabs
    const tabs = document.querySelectorAll('#view-inventory .tab-btn');
    const contents = document.querySelectorAll('#view-inventory .tab-content');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => {
                t.classList.remove('active');
                t.style.borderBottom = 'none';
                t.style.color = 'var(--text-color)';
            });
            contents.forEach(c => c.classList.add('hide'));
            
            tab.classList.add('active');
            tab.style.borderBottom = '3px solid var(--primary-color)';
            tab.style.color = 'var(--primary-color)';
            
            document.getElementById(`tab-${tab.dataset.tab}`).classList.remove('hide');
        });
    });

    // Form: Nuevo Producto
    const prodForm = document.getElementById('product-form');
    if (prodForm) prodForm.addEventListener('submit', handleSaveProduct);

    const btnCancelEdit = document.getElementById('btn-cancel-inv-edit-prod');
    if (btnCancelEdit) btnCancelEdit.addEventListener('click', cancelEditInventoryProduct);

    const catalogSearch = document.getElementById('inv-catalog-search');
    if (catalogSearch) {
        catalogSearch.addEventListener('input', () => {
            renderInventoryCatalog();
        });
    }
    
    // Form: Ingreso/Ajuste de Stock
    const stockForm = document.getElementById('stock-form');
    if (stockForm) stockForm.addEventListener('submit', handleSaveStockMovement);
    
    // Form: Cocción
    const bakingForm = document.getElementById('baking-form');
    if (bakingForm) bakingForm.addEventListener('submit', handleSaveBaking);
    
    // Default dates
    const today = new Date().toISOString().split('T')[0];
    if (document.getElementById('stock-date')) document.getElementById('stock-date').value = today;
    if (document.getElementById('baking-date')) document.getElementById('baking-date').value = today;
    
    // Search logic for Stock
    const stockSearch = document.getElementById('stock-product-search');
    if (stockSearch) {
        stockSearch.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            populateStockSelect(term);
        });
    }

    // Search logic for Baking
    const bakingSearch = document.getElementById('baking-product-search');
    if (bakingSearch) {
        bakingSearch.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase();
            populateBakingSelect(term);
        });
    }

    const stockProductSelect = document.getElementById('stock-product');
    if (stockProductSelect) {
        stockProductSelect.addEventListener('change', (e) => {
            const id = e.target.value;
            if (!id) {
                document.getElementById('stock-quantity').value = '';
                return;
            }
            const prod = state.inventoryProducts.find(p => p.id == id);
            if (prod) {
                document.getElementById('stock-quantity').value = parseFloat(prod.current_stock);
                document.getElementById('stock-type').value = 'count'; // Force to 'count' as default for replacing
            }
        });
    }
}

async function loadInventoryData() {
    try {
        const res = await fetch(`${API_URL}/api/inventory/products`, {
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        if (res.ok) {
            state.inventoryProducts = await res.json();
            renderInventoryCatalog();
            populateStockSelect();
            populateBakingSelect();
            renderInventoryBakingTable();
        }
    } catch (err) {
        console.error('Error al cargar inventario:', err);
    }
}

function renderInventoryCatalog() {
    const tbody = document.getElementById('products-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    let prods = state.inventoryProducts || [];
    const searchInput = document.getElementById('inv-catalog-search');
    const term = searchInput ? searchInput.value.toLowerCase().trim() : '';

    if (term) {
        prods = prods.filter(p => 
            (p.name && p.name.toLowerCase().includes(term)) ||
            (p.code && p.code.toLowerCase().includes(term)) ||
            (p.category && p.category.toLowerCase().includes(term))
        );
    }

    if (prods.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted" style="padding: 1.5rem;">No se encontraron productos en el catálogo</td></tr>';
        return;
    }
    
    prods.forEach(p => {
        const tr = document.createElement('tr');
        const stockStr = parseFloat(p.current_stock || 0).toLocaleString('es-AR', {minimumFractionDigits: 0});
        const priceNum = parseFloat(p.price || 0);
        const priceStr = priceNum > 0 
            ? `$${priceNum.toLocaleString('es-AR', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`
            : '$0,00';

        tr.innerHTML = `
            <td><strong>${p.code || '—'}</strong></td>
            <td style="font-weight:600;">${p.name}</td>
            <td><span class="status-badge" style="background:#e0f2fe; color:#0284c7; font-size:0.75rem;">${p.category}</span></td>
            <td style="font-weight:700; color:#0f172a;">${priceStr} <small style="color:var(--text-muted); font-weight:normal;">/${p.unit_measure || 'un.'}</small></td>
            <td style="font-weight:bold; ${p.current_stock < 0 ? 'color:#dc2626;' : (p.current_stock == 0 ? 'color:#9ca3af;' : 'color:#059669;')}">${stockStr}</td>
            <td style="text-align: center;">
                <button type="button" class="btn-icon" onclick="editInventoryProduct(${p.id})" title="Editar Producto y Precio" style="font-size: 0.9rem; padding: 4px 8px; border: 1.5px solid var(--border-color); border-radius: 6px; cursor: pointer; background: var(--bg-surface-elevated, #ffffff);">
                    ✏️ Editar
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function populateStockSelect(searchTerm = '') {
    const selectStock = document.getElementById('stock-product');
    if (!selectStock) return;
    
    const groupedStock = {};
    const term = searchTerm.toLowerCase().trim();

    state.inventoryProducts.forEach(p => {
        if (!term || p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term)) {
            if (!groupedStock[p.category]) groupedStock[p.category] = [];
            groupedStock[p.category].push(p);
        }
    });
    
    let stockHtml = '<option value="">Seleccione producto...</option>';
    for (const cat in groupedStock) {
        stockHtml += `<optgroup label="${cat}">`;
        groupedStock[cat].forEach(p => {
            stockHtml += `<option value="${p.id}">${p.name} (Disp: ${parseFloat(p.current_stock).toLocaleString('es-AR', {minimumFractionDigits:0})})</option>`;
        });
        stockHtml += `</optgroup>`;
    }
    
    const prevVal = selectStock.value;
    selectStock.innerHTML = stockHtml;
    if (prevVal && selectStock.querySelector(`option[value="${prevVal}"]`)) {
        selectStock.value = prevVal;
    }
}

function populateBakingSelect(searchTerm = '') {
    const selectBaking = document.getElementById('baking-product');
    if (!selectBaking) return;
    
    const groupedBaking = {};
    const term = searchTerm.toLowerCase().trim();

    state.inventoryProducts.forEach(p => {
        if (!term || p.name.toLowerCase().includes(term) || p.category.toLowerCase().includes(term)) {
            if (!groupedBaking[p.category]) groupedBaking[p.category] = [];
            groupedBaking[p.category].push(p);
        }
    });
    
    let bakingHtml = '<option value="">Seleccione producto...</option>';
    for (const cat in groupedBaking) {
        bakingHtml += `<optgroup label="${cat}">`;
        groupedBaking[cat].forEach(p => {
            bakingHtml += `<option value="${p.id}">${p.name} (Disp: ${parseFloat(p.current_stock).toLocaleString('es-AR', {minimumFractionDigits:0})})</option>`;
        });
        bakingHtml += `</optgroup>`;
    }
    
    const prevVal = selectBaking.value;
    selectBaking.innerHTML = bakingHtml;
    if (prevVal && selectBaking.querySelector(`option[value="${prevVal}"]`)) {
        selectBaking.value = prevVal;
    }
}

function renderInventoryBakingTable() {
    const tbody = document.getElementById('baking-stock-tbody');
    if (!tbody) return;
    tbody.innerHTML = '';
    
    // Filtrar solo productos con stock > 0, u opcionalmente mostrar todos. Mostremos todos ordenados.
    const products = state.inventoryProducts.filter(p => p.current_stock > 0);
    
    if (products.length === 0) {
        tbody.innerHTML = '<tr><td colspan="3" class="text-center text-muted">No hay productos con stock disponible</td></tr>';
        return;
    }
    
    products.forEach(p => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><span class="status-badge" style="background:#e0f2fe; color:#0284c7; font-size:0.75rem;">${p.category}</span></td>
            <td style="font-weight:500;">${p.name}</td>
            <td style="font-weight:bold; color:#059669;">${parseFloat(p.current_stock).toLocaleString('es-AR', {minimumFractionDigits: 0})}</td>
        `;
        tbody.appendChild(tr);
    });
}

function editInventoryProduct(prodId) {
    const p = (state.inventoryProducts || []).find(x => x.id === prodId);
    if (!p) return;

    document.getElementById('prod-id').value = p.id;
    document.getElementById('prod-code').value = p.code || '';
    document.getElementById('prod-name').value = p.name || '';
    document.getElementById('prod-category').value = p.category || '';
    document.getElementById('prod-price').value = p.price !== undefined ? p.price : 0;
    
    const unitSelect = document.getElementById('prod-unit');
    if (unitSelect) unitSelect.value = p.unit_measure || 'unidad';

    const formTitle = document.getElementById('inv-prod-form-title');
    const formSubtitle = document.getElementById('inv-prod-form-subtitle');
    const btnCancel = document.getElementById('btn-cancel-inv-edit-prod');
    const btnSave = document.getElementById('btn-save-inv-prod');

    if (formTitle) formTitle.textContent = 'Editar Producto';
    if (formSubtitle) formSubtitle.textContent = `Modificando: ${p.name}`;
    if (btnCancel) btnCancel.classList.remove('hide');
    if (btnSave) btnSave.textContent = 'Actualizar Producto';

    // Hacer scroll hacia el formulario y enfocar el precio
    const formCard = document.getElementById('product-form');
    if (formCard) formCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    const priceInput = document.getElementById('prod-price');
    if (priceInput) {
        priceInput.focus();
        priceInput.select();
    }
}

function cancelEditInventoryProduct() {
    const form = document.getElementById('product-form');
    if (form) form.reset();
    document.getElementById('prod-id').value = '';

    const formTitle = document.getElementById('inv-prod-form-title');
    const formSubtitle = document.getElementById('inv-prod-form-subtitle');
    const btnCancel = document.getElementById('btn-cancel-inv-edit-prod');
    const btnSave = document.getElementById('btn-save-inv-prod');

    if (formTitle) formTitle.textContent = 'Nuevo Producto';
    if (formSubtitle) formSubtitle.textContent = 'Añadir al catálogo';
    if (btnCancel) btnCancel.classList.add('hide');
    if (btnSave) btnSave.textContent = 'Guardar Producto';
}

async function handleSaveProduct(e) {
    e.preventDefault();
    const id = document.getElementById('prod-id').value;
    const code = document.getElementById('prod-code').value.trim();
    const name = document.getElementById('prod-name').value.trim();
    const category = document.getElementById('prod-category').value.trim();
    const price = parseFloat(document.getElementById('prod-price').value) || 0;
    const unit_measure = document.getElementById('prod-unit')?.value || 'unidad';
    
    const payload = { code, name, category, price, unit_measure };

    try {
        const url = id ? `${API_URL}/api/inventory/products/${id}` : `${API_URL}/api/inventory/products`;
        const method = id ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${state.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        await safeResponseJSON(response, id ? 'Error al actualizar el producto' : 'Error al guardar el producto');
        Alert.success(id ? 'Producto y precio actualizados con éxito' : 'Producto añadido al catálogo');
        cancelEditInventoryProduct();
        await loadInventoryData();
        if (typeof loadPosData === 'function') {
            loadPosData();
        }
    } catch (err) {
        Alert.error(err.message);
    }
}

async function handleSaveStockMovement(e) {
    e.preventDefault();
    const product_id = document.getElementById('stock-product').value;
    const quantity = parseFloat(document.getElementById('stock-quantity').value);
    const date = document.getElementById('stock-date').value;
    const type = document.getElementById('stock-type').value; // delivery, count, adjustment
    
    if (!product_id) return Alert.error('Seleccione un producto');
    
    // Si el tipo es 'count' (Recuento), la lógica de un sistema avanzado reemplazaría el stock.
    // Para simplificar: le avisamos al usuario que este es un ajuste diferencial, o lo calculamos aquí:
    let finalQuantity = quantity;
    if (type === 'count') {
        const prod = state.inventoryProducts.find(p => p.id == product_id);
        const current = prod ? parseFloat(prod.current_stock) : 0;
        finalQuantity = quantity - current; // La diferencia para que quede en 'quantity'
    }

    try {
        const response = await fetch(`${API_URL}/api/inventory/movements`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${state.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ product_id, quantity: finalQuantity, type: type === 'count' ? 'adjustment' : type, date })
        });
        
        await safeResponseJSON(response, 'Error al actualizar el stock');
        Alert.success('Stock actualizado correctamente');
        document.getElementById('stock-form').reset();
        document.getElementById('stock-date').value = new Date().toISOString().split('T')[0];
        loadInventoryData();
    } catch (err) {
        Alert.error(err.message);
    }
}

async function handleSaveBaking(e) {
    e.preventDefault();
    const product_id = document.getElementById('baking-product').value;
    const quantity = parseFloat(document.getElementById('baking-quantity').value); // será positiva en el input
    const date = document.getElementById('baking-date').value;
    const shift = document.getElementById('baking-shift').value;
    
    if (!product_id) return Alert.error('Seleccione un producto a hornear');
    
    try {
        const response = await fetch(`${API_URL}/api/inventory/movements`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${state.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ product_id, quantity: -quantity, type: 'baking', shift, date })
        });
        
        await safeResponseJSON(response, 'Error al registrar la cocción');
        Alert.success('Cocción registrada. Stock descontado.');
        document.getElementById('baking-form').reset();
        document.getElementById('baking-date').value = new Date().toISOString().split('T')[0];
        loadInventoryData();
    } catch (err) {
        Alert.error(err.message);
    }
}

// --- MODAL DE PAGO DE PEDIDOS ---
let currentPayOrderId = null;

function openPayOrderModal(orderId) {
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;

    currentPayOrderId = orderId;
    document.getElementById('po-order-id').value = order.id;
    document.getElementById('po-order-name').value = order.order_number;
    const amountVal = parseFloat(order.amount);
    document.getElementById('po-order-amount-display').value = `$${amountVal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

    const payDateInput = document.getElementById('po-payment-date');
    if (payDateInput) {
        payDateInput.value = new Date().toISOString().split('T')[0];
    }

    document.getElementById('po-mode-single').checked = true;
    document.getElementById('po-single-container').classList.remove('hide');
    document.getElementById('po-split-container').classList.add('hide');

    document.getElementById('po-payment-method').value = 'Efectivo';
    document.getElementById('po-method-1').value = 'Payway';
    document.getElementById('po-method-2').value = 'Mercado Pago';

    const half = (amountVal / 2).toFixed(2);
    const remainder = (amountVal - parseFloat(half)).toFixed(2);
    document.getElementById('po-amount-1').value = half;
    document.getElementById('po-amount-2').value = remainder;

    document.getElementById('modal-pay-order').classList.remove('hide');
}

function closePayOrderModal() {
    document.getElementById('modal-pay-order').classList.add('hide');
    currentPayOrderId = null;
}

function initPayOrderEvents() {
    const closeBtn = document.getElementById('close-pay-order-btn');
    const cancelBtn = document.getElementById('cancel-pay-order-btn');
    const form = document.getElementById('pay-order-form');
    const modeSingle = document.getElementById('po-mode-single');
    const modeSplit = document.getElementById('po-mode-split');
    const amount1Input = document.getElementById('po-amount-1');
    const amount2Input = document.getElementById('po-amount-2');

    if (closeBtn) closeBtn.addEventListener('click', closePayOrderModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closePayOrderModal);

    if (modeSingle) {
        modeSingle.addEventListener('change', () => {
            document.getElementById('po-single-container').classList.remove('hide');
            document.getElementById('po-split-container').classList.add('hide');
        });
    }

    if (modeSplit) {
        modeSplit.addEventListener('change', () => {
            document.getElementById('po-single-container').classList.add('hide');
            document.getElementById('po-split-container').classList.remove('hide');
            const order = state.orders.find(o => o.id === currentPayOrderId);
            if (order) {
                const total = parseFloat(order.amount);
                const half = (total / 2).toFixed(2);
                const rem = (total - parseFloat(half)).toFixed(2);
                amount1Input.value = half;
                amount2Input.value = rem;
            }
        });
    }

    if (amount1Input) {
        amount1Input.addEventListener('input', () => {
            const order = state.orders.find(o => o.id === currentPayOrderId);
            if (order) {
                const total = parseFloat(order.amount);
                const val1 = parseFloat(amount1Input.value) || 0;
                amount2Input.value = Math.max(0, total - val1).toFixed(2);
            }
        });
    }

    if (amount2Input) {
        amount2Input.addEventListener('input', () => {
            const order = state.orders.find(o => o.id === currentPayOrderId);
            if (order) {
                const total = parseFloat(order.amount);
                const val2 = parseFloat(amount2Input.value) || 0;
                amount1Input.value = Math.max(0, total - val2).toFixed(2);
            }
        });
    }

    if (form) {
        form.addEventListener('submit', handleConfirmPayOrder);
    }
}

async function handleConfirmPayOrder(e) {
    e.preventDefault();
    const orderId = parseInt(document.getElementById('po-order-id').value);
    const order = state.orders.find(o => o.id === orderId);
    if (!order) return;

    const isSplit = document.getElementById('po-mode-split').checked;
    let payments = [];

    if (!isSplit) {
        const method = document.getElementById('po-payment-method').value;
        payments = [{ payment_method: method, amount: parseFloat(order.amount) }];
    } else {
        const m1 = document.getElementById('po-method-1').value;
        const a1 = parseFloat(document.getElementById('po-amount-1').value) || 0;
        const m2 = document.getElementById('po-method-2').value;
        const a2 = parseFloat(document.getElementById('po-amount-2').value) || 0;

        if (a1 <= 0 || a2 <= 0) {
            Alert.error('Ambos montos deben ser mayores a cero.');
            return;
        }

        const totalPaid = a1 + a2;
        if (Math.abs(totalPaid - parseFloat(order.amount)) > 0.05) {
            Alert.error('La suma de los dos montos debe ser igual al total del pedido.');
            return;
        }

        payments = [
            { payment_method: m1, amount: a1 },
            { payment_method: m2, amount: a2 }
        ];
    }

    const payment_date = document.getElementById('po-payment-date') ? document.getElementById('po-payment-date').value : new Date().toISOString().split('T')[0];

    try {
        const response = await fetch(`${API_URL}/api/orders/${orderId}/status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${state.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status: 'completed', payments, payment_date })
        });

        await safeResponseJSON(response, 'Error al registrar pago del pedido');
        Alert.success('Pedido marcado como pagado exitosamente');
        closePayOrderModal();
        loadData();
    } catch (err) {
        Alert.error(err.message);
    }
}

// --- MODAL DE TRASPASO DE FONDOS ---
function openTransferModal() {
    const form = document.getElementById('transfer-funds-form');
    if (form) form.reset();

    const dateInput = document.getElementById('tf-date');
    if (dateInput) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }

    document.getElementById('tf-origin').value = 'Payway';
    document.getElementById('tf-destination').value = 'Mercado Pago';

    document.getElementById('modal-transfer-funds').classList.remove('hide');
}

function closeTransferModal() {
    document.getElementById('modal-transfer-funds').classList.add('hide');
}

function initTransferFundsEvents() {
    const closeBtn = document.getElementById('close-transfer-modal-btn');
    const cancelBtn = document.getElementById('cancel-transfer-modal-btn');
    const form = document.getElementById('transfer-funds-form');

    if (closeBtn) closeBtn.addEventListener('click', closeTransferModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeTransferModal);

    if (form) form.addEventListener('submit', handleTransferSubmit);
}

async function handleTransferSubmit(e) {
    e.preventDefault();
    const origin_method = document.getElementById('tf-origin').value;
    const destination_method = document.getElementById('tf-destination').value;
    const amount = parseFloat(document.getElementById('tf-amount').value) || 0;
    const date = document.getElementById('tf-date').value;
    const description = document.getElementById('tf-description').value;

    if (origin_method === destination_method) {
        Alert.error('La cuenta de origen y de destino deben ser diferentes.');
        return;
    }

    if (amount <= 0) {
        Alert.error('El monto a transferir debe ser mayor que cero.');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/api/balances/transfer`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${state.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ origin_method, destination_method, amount, date, description })
        });

        await safeResponseJSON(response, 'Error al realizar traspaso de fondos');
        Alert.success('Traspaso de fondos realizado con éxito');
        closeTransferModal();
        loadData();
    } catch (err) {
        Alert.error(err.message);
    }
}

window.openTransferModal = openTransferModal;
window.closeTransferModal = closeTransferModal;
window.openPayOrderModal = openPayOrderModal;
window.closePayOrderModal = closePayOrderModal;
window.handleUpdateOrderStatus = handleUpdateOrderStatus;
window.handleDeleteOrder = handleDeleteOrder;

// ==========================================================================
// MÓDULO PUNTO DE VENTA (POS / TERMINAL DE COBROS DULCE HORA)
// ==========================================================================

async function loadPosData() {
    try {
        const [configRes, catRes, prodRes, tablesRes] = await Promise.all([
            fetch(`${API_URL}/api/pos/config`, { headers: { 'Authorization': `Bearer ${state.token}` } }),
            fetch(`${API_URL}/api/pos/categories`, { headers: { 'Authorization': `Bearer ${state.token}` } }),
            fetch(`${API_URL}/api/pos/products`, { headers: { 'Authorization': `Bearer ${state.token}` } }),
            fetch(`${API_URL}/api/pos/tables`, { headers: { 'Authorization': `Bearer ${state.token}` } })
        ]);

        if (configRes.ok) state.posConfig = await configRes.json();
        if (catRes.ok) state.posCategories = await catRes.json();
        if (prodRes.ok) state.posProducts = await prodRes.json();
        if (tablesRes.ok) state.posTables = await tablesRes.json();

        initPosEventListeners();
        renderPosCategoryTabs();
        renderPosCatalog();
        renderPosComanda();
        updatePosTableIndicator();

    } catch (err) {
        console.error('Error al cargar datos del POS:', err);
        Alert.error('Error al cargar datos del Punto de Venta.');
    }
}

let posListenersInitialized = false;
function initPosEventListeners() {
    if (posListenersInitialized) return;
    posListenersInitialized = true;

    // 1. Botones de agregar filas vacías (+1 y +5)
    const btnAdd1 = document.getElementById('btn-pos-add-row-1');
    const btnAdd5 = document.getElementById('btn-pos-add-row-5');
    if (btnAdd1) btnAdd1.addEventListener('click', () => addEmptyPosComandaRows(1));
    if (btnAdd5) btnAdd5.addEventListener('click', () => addEmptyPosComandaRows(5));

    // 2. Botón limpiar comanda
    const btnClear = document.getElementById('btn-pos-clear-comanda');
    const btnQuickClear = document.getElementById('btn-pos-quick-clear');
    if (btnClear) btnClear.addEventListener('click', clearPosComanda);
    if (btnQuickClear) btnQuickClear.addEventListener('click', clearPosComanda);

    // 3. Botón cobrar comanda
    const btnCheckout = document.getElementById('btn-pos-checkout-trigger');
    const btnQuickPay = document.getElementById('btn-pos-quick-pay');
    if (btnCheckout) btnCheckout.addEventListener('click', openPosCheckoutModal);
    if (btnQuickPay) btnQuickPay.addEventListener('click', openPosCheckoutModal);

    // 4. Buscador de productos
    const searchInput = document.getElementById('pos-search-input');
    const searchClearBtn = document.getElementById('pos-search-clear-btn');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.posSearchTerm = e.target.value.toLowerCase().trim();
            if (searchClearBtn) {
                if (state.posSearchTerm) searchClearBtn.classList.remove('hide');
                else searchClearBtn.classList.add('hide');
            }
            renderPosCatalog();
        });
    }
    if (searchClearBtn) {
        searchClearBtn.addEventListener('click', () => {
            if (searchInput) searchInput.value = '';
            state.posSearchTerm = '';
            searchClearBtn.classList.add('hide');
            renderPosCatalog();
            if (searchInput) searchInput.focus();
        });
    }

    // 4b. Chips de Ordenamiento en Catálogo POS (Nombre A-Z / Z-A, Código 1-9 / 9-1)
    const sortChipsContainer = document.getElementById('pos-sort-chips');
    if (sortChipsContainer) {
        sortChipsContainer.querySelectorAll('.pos-sort-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                const sortMode = e.currentTarget.getAttribute('data-sort');
                if (sortMode) {
                    state.posSortOrder = sortMode;
                    sortChipsContainer.querySelectorAll('.pos-sort-chip').forEach(c => c.classList.remove('active'));
                    e.currentTarget.classList.add('active');
                    renderPosCatalog();
                }
            });
        });
    }

    // 5. Botones de barra lateral rápida
    const btnTestTicket = document.getElementById('btn-pos-test-ticket');
    if (btnTestTicket) btnTestTicket.addEventListener('click', handlePosTestOrReprintTicket);

    const btnTables = document.getElementById('btn-pos-quick-tables');
    if (btnTables) btnTables.addEventListener('click', openPosTablesModal);

    const btnCustomProds = document.getElementById('btn-pos-quick-products');
    if (btnCustomProds) btnCustomProds.addEventListener('click', openPosCustomProductsModal);

    const btnAddFast = document.getElementById('btn-pos-add-product-fast');
    if (btnAddFast) btnAddFast.addEventListener('click', openPosNewProductModal);

    const btnManageFast = document.getElementById('btn-pos-manage-prods-fast');
    if (btnManageFast) btnManageFast.addEventListener('click', openPosCustomProductsModal);

    const btnNotes = document.getElementById('btn-pos-quick-notes');
    if (btnNotes) btnNotes.addEventListener('click', openPosNotesModal);

    const btnFullscreen = document.getElementById('btn-pos-quick-fullscreen');
    if (btnFullscreen) {
        btnFullscreen.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
            } else {
                if (document.exitFullscreen) document.exitFullscreen();
            }
        });
    }

    const btnPosToggleSidebar = document.getElementById('btn-pos-toggle-sidebar');
    if (btnPosToggleSidebar) {
        btnPosToggleSidebar.addEventListener('click', () => {
            if (typeof window.toggleAppSidebar === 'function') {
                window.toggleAppSidebar();
            }
        });
    }

    // 6. Checkout Modal Listeners
    initCheckoutModalEvents();

    // 7. Modales de Mesas, Productos y Notas
    initTablesModalEvents();
    initCustomProductsModalEvents();
    initNotesModalEvents();

    // 8. Atajos de Teclado Globales para POS
    document.addEventListener('keydown', (e) => {
        if (state.currentView !== 'pos') return;

        // F2: Foco en buscador
        if (e.key === 'F2') {
            e.preventDefault();
            const s = document.getElementById('pos-search-input');
            if (s) s.focus();
        }
        // F8: Reimprimir o Probar Ticket
        if (e.key === 'F8') {
            e.preventDefault();
            handlePosTestOrReprintTicket();
        }
        // F9: Abrir Cobro
        if (e.key === 'F9') {
            e.preventDefault();
            openPosCheckoutModal();
        }
    });
}

// --- RENDERIZADO DE TABS Y CATÁLOGO ---

function renderPosCategoryTabs() {
    const tabsContainer = document.getElementById('pos-category-tabs');
    if (!tabsContainer) return;

    // Tabs base
    let html = `
        <button type="button" class="pos-category-chip ${state.posSelectedCategory === 'ACCESO RÁPIDO' ? 'active' : ''}" data-category="ACCESO RÁPIDO">⭐ Acceso Rápido</button>
        <button type="button" class="pos-category-chip ${state.posSelectedCategory === 'TODOS' ? 'active' : ''}" data-category="TODOS">Todos</button>
    `;

    // Categorías dinámicas desde DB
    if (state.posCategories && state.posCategories.length > 0) {
        state.posCategories.forEach(c => {
            const catName = c.category;
            const isActive = state.posSelectedCategory === catName;
            let icon = '📦';
            if (catName.includes('Café') || catName.includes('Cafetería')) icon = '☕';
            else if (catName.includes('Factur')) icon = '🥐';
            else if (catName.includes('Panad')) icon = '🥖';
            else if (catName.includes('Pastel')) icon = '🍰';
            else if (catName.includes('Salad')) icon = '🥪';
            else if (catName.includes('Promo')) icon = '🏷️';

            html += `<button type="button" class="pos-category-chip ${isActive ? 'active' : ''}" data-category="${catName}">${icon} ${catName}</button>`;
        });
    }

    tabsContainer.innerHTML = html;

    tabsContainer.querySelectorAll('.pos-category-chip').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const cat = e.currentTarget.getAttribute('data-category');
            state.posSelectedCategory = cat;
            tabsContainer.querySelectorAll('.pos-category-chip').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            renderPosCatalog();
        });
    });
}

function renderPosCatalog() {
    const grid = document.getElementById('pos-products-grid');
    if (!grid) return;

    let filtered = state.posProducts || [];

    // Filtro por categoría
    if (state.posSelectedCategory === 'ACCESO RÁPIDO') {
        filtered = filtered.filter(p => p.is_quick_access === 1);
    } else if (state.posSelectedCategory !== 'TODOS') {
        filtered = filtered.filter(p => p.category === state.posSelectedCategory);
    }

    // Filtro por texto de búsqueda
    if (state.posSearchTerm) {
        filtered = filtered.filter(p => {
            const codeMatch = p.code && p.code.toLowerCase().includes(state.posSearchTerm);
            const nameMatch = p.name && p.name.toLowerCase().includes(state.posSearchTerm);
            const descMatch = p.description && p.description.toLowerCase().includes(state.posSearchTerm);
            return codeMatch || nameMatch || descMatch;
        });
    }

    // Ordenamiento dinámico (alfabético o por código)
    const sortMode = state.posSortOrder || 'name-asc';
    filtered.sort((a, b) => {
        if (sortMode === 'name-asc') {
            return (a.name || '').localeCompare(b.name || '', 'es', { sensitivity: 'base' });
        } else if (sortMode === 'name-desc') {
            return (b.name || '').localeCompare(a.name || '', 'es', { sensitivity: 'base' });
        } else if (sortMode === 'code-asc') {
            const numA = parseInt(a.code, 10);
            const numB = parseInt(b.code, 10);
            if (!isNaN(numA) && !isNaN(numB)) {
                return numA - numB;
            }
            return (a.code || '').localeCompare(b.code || '', undefined, { numeric: true });
        } else if (sortMode === 'code-desc') {
            const numA = parseInt(a.code, 10);
            const numB = parseInt(b.code, 10);
            if (!isNaN(numA) && !isNaN(numB)) {
                return numB - numA;
            }
            return (b.code || '').localeCompare(a.code || '', undefined, { numeric: true });
        }
        return 0;
    });

    // Mantener sincronizado el estado visual de los chips de orden
    const sortChipsContainer = document.getElementById('pos-sort-chips');
    if (sortChipsContainer) {
        sortChipsContainer.querySelectorAll('.pos-sort-chip').forEach(c => {
            if (c.getAttribute('data-sort') === sortMode) {
                c.classList.add('active');
            } else {
                c.classList.remove('active');
            }
        });
    }

    // Actualizar indicador de cantidad de productos
    const countBadge = document.getElementById('pos-products-count');
    if (countBadge) {
        countBadge.textContent = `${filtered.length} producto${filtered.length === 1 ? '' : 's'}`;
    }

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
                <p style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.25rem;">No se encontraron productos</p>
                <small>Prueba buscando con otro término o seleccionando otra categoría.</small>
            </div>
        `;
        return;
    }

    let cardsHtml = '';
    filtered.forEach(p => {
        const priceFmt = parseFloat(p.price || 0).toLocaleString('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 });
        const isQuick = p.is_quick_access === 1;

        cardsHtml += `
            <div class="pos-product-card" onclick="addPosProductToComanda(${p.id})">
                <div class="pos-prod-card-top">
                    <span class="pos-prod-code-badge">${p.code ? '#' + p.code : 'ID:' + p.id}</span>
                    <div class="pos-prod-card-actions">
                        <button type="button" class="pos-prod-star-btn ${isQuick ? 'is-fav' : ''}" 
                                onclick="event.stopPropagation(); toggleQuickAccessProduct(${p.id}, ${isQuick ? 0 : 1})" 
                                title="${isQuick ? 'Quitar de Favoritos (Acceso Rápido)' : 'Marcar como Favorito (Acceso Rápido)'}">
                            ${isQuick ? '★' : '☆'}
                        </button>
                        <button type="button" class="pos-prod-edit-btn" 
                                onclick="event.stopPropagation(); quickEditPosProduct(${p.id})" 
                                title="Cambiar precio o editar producto">
                            ✏️
                        </button>
                    </div>
                </div>
                <div class="pos-prod-name" title="${p.name}">${p.name}</div>
                <div class="pos-prod-card-bottom">
                    <span class="pos-prod-price">${priceFmt}</span>
                    <span class="pos-prod-unit">${p.unit_measure || 'un.'}</span>
                </div>
            </div>
        `;
    });

    grid.innerHTML = cardsHtml;
}

// --- GESTIÓN DE FILAS Y COMANDA ---

function addPosProductToComanda(productId, qtyToAdd = 1) {
    const prod = state.posProducts.find(p => p.id === productId);
    if (!prod) return;

    // Si ya existe en la comanda con el mismo product_id, incrementar cantidad
    const existing = state.posComanda.find(item => item.product_id === productId);
    if (existing) {
        existing.quantity = parseFloat((existing.quantity + qtyToAdd).toFixed(2));
        existing.subtotal = parseFloat((existing.quantity * existing.unit_price).toFixed(2));
    } else {
        // Si hay una fila vacía creada por +1 o +5 sin usar, reutilizarla
        const emptyRow = state.posComanda.find(item => item.is_empty_row && !item.product_id);
        if (emptyRow) {
            emptyRow.is_empty_row = false;
            emptyRow.product_id = prod.id;
            emptyRow.code = prod.code || '';
            emptyRow.description = prod.name;
            emptyRow.unit_measure = prod.unit_measure || 'unidad';
            emptyRow.unit_price = parseFloat(prod.price) || 0;
            emptyRow.iva_rate = parseFloat(prod.iva_rate) || 10.5;
            emptyRow.auto_deduct_stock = prod.auto_deduct_stock;
            emptyRow.subtotal = parseFloat((emptyRow.quantity * emptyRow.unit_price).toFixed(2));
        } else {
            state.posComanda.push({
                temp_id: 'item_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
                product_id: prod.id,
                code: prod.code || '',
                description: prod.name,
                quantity: qtyToAdd,
                unit_measure: prod.unit_measure || 'unidad',
                unit_price: parseFloat(prod.price) || 0,
                iva_rate: parseFloat(prod.iva_rate) || 10.5,
                auto_deduct_stock: prod.auto_deduct_stock,
                subtotal: parseFloat((qtyToAdd * (parseFloat(prod.price) || 0)).toFixed(2))
            });
        }
    }

    renderPosComanda();
}

function addEmptyPosComandaRows(count = 1) {
    // El usuario especificó: "+1 y +5 son para agregar filas al supuesto carrito, no para aumentar cantidades de producto."
    let firstAddedId = null;
    for (let i = 0; i < count; i++) {
        const id = 'empty_' + Date.now() + '_' + i + '_' + Math.floor(Math.random() * 100);
        if (i === 0) firstAddedId = id;

        state.posComanda.push({
            temp_id: id,
            product_id: null,
            code: '',
            description: '',
            quantity: 1,
            unit_measure: 'unidad',
            unit_price: 0,
            iva_rate: 10.5,
            auto_deduct_stock: 1,
            subtotal: 0,
            is_empty_row: true
        });
    }

    renderPosComanda();

    // Enfocar el input de código de la primera fila agregada
    if (firstAddedId) {
        setTimeout(() => {
            const input = document.getElementById(`pos-code-input-${firstAddedId}`);
            if (input) input.focus();
        }, 50);
    }
}

function handlePosCodeLookup(tempId, codeVal) {
    const cleanCode = (codeVal || '').trim();
    if (!cleanCode) return;

    const row = state.posComanda.find(i => i.temp_id === tempId);
    if (!row) return;

    // Buscar producto por código exacto o case-insensitive
    const prod = state.posProducts.find(p => p.code && String(p.code).trim().toLowerCase() === cleanCode.toLowerCase());
    if (prod) {
        row.is_empty_row = false;
        row.product_id = prod.id;
        row.code = prod.code;
        row.description = prod.name;
        row.unit_measure = prod.unit_measure || 'unidad';
        row.unit_price = parseFloat(prod.price) || 0;
        row.iva_rate = parseFloat(prod.iva_rate) || 10.5;
        row.auto_deduct_stock = prod.auto_deduct_stock;
        row.subtotal = parseFloat((row.quantity * row.unit_price).toFixed(2));

        renderPosComanda();

        // Mover foco a la cantidad de esta fila
        setTimeout(() => {
            const qtyInput = document.getElementById(`pos-qty-input-${tempId}`);
            if (qtyInput) {
                qtyInput.focus();
                qtyInput.select();
            }
        }, 50);
    } else {
        Alert.warning(`Producto con código "${cleanCode}" no encontrado.`);
    }
}

function updatePosRowQty(tempId, newQty) {
    const row = state.posComanda.find(i => i.temp_id === tempId);
    if (!row) return;

    const qty = parseFloat(newQty);
    if (isNaN(qty) || qty <= 0) {
        row.quantity = 1;
    } else {
        row.quantity = qty;
    }
    row.subtotal = parseFloat((row.quantity * row.unit_price).toFixed(2));
    renderPosComanda();
}

function updatePosRowPrice(tempId, newPrice) {
    const row = state.posComanda.find(i => i.temp_id === tempId);
    if (!row) return;

    const price = parseFloat(newPrice);
    row.unit_price = isNaN(price) || price < 0 ? 0 : price;
    row.subtotal = parseFloat((row.quantity * row.unit_price).toFixed(2));
    renderPosComanda();
}

function removePosRow(tempId) {
    state.posComanda = state.posComanda.filter(i => i.temp_id !== tempId);
    renderPosComanda();
}

async function clearPosComanda() {
    if (state.posComanda.length === 0) return;
    const confirmed = await Alert.confirm('¿Deseas vaciar todos los productos de la comanda actual?', 'Limpiar Comanda', 'Sí, vaciar', 'Cancelar');
    if (confirmed) {
        state.posComanda = [];
        state.posOrderNotes = '';
        renderPosComanda();
    }
}

function renderPosComanda() {
    const tbody = document.getElementById('pos-comanda-tbody');
    const emptyMsg = document.getElementById('pos-comanda-empty-msg');
    if (!tbody) return;

    if (state.posComanda.length === 0) {
        tbody.innerHTML = '';
        if (emptyMsg) emptyMsg.classList.remove('hide');
        updatePosComandaTotals(0, 0, 0, 0);
        return;
    }

    if (emptyMsg) emptyMsg.classList.add('hide');

    let rowsHtml = '';
    let totalNeto = 0;
    let totalIva105 = 0;
    let totalIva21 = 0;
    let grandTotal = 0;

    state.posComanda.forEach(item => {
        grandTotal += item.subtotal;
        const ivaRate = item.iva_rate || 10.5;
        const baseNeto = item.subtotal / (1 + (ivaRate / 100));
        const ivaAmt = item.subtotal - baseNeto;

        totalNeto += baseNeto;
        if (Math.abs(ivaRate - 10.5) < 0.1) {
            totalIva105 += ivaAmt;
        } else {
            totalIva21 += ivaAmt;
        }

        const subtotalFmt = item.subtotal.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

        rowsHtml += `
            <tr id="pos-row-${item.temp_id}">
                <td>
                    <input type="text" id="pos-code-input-${item.temp_id}" class="pos-row-input-code" value="${item.code || ''}" placeholder="Cód..." onchange="handlePosCodeLookup('${item.temp_id}', this.value)" onkeydown="if(event.key==='Enter'){handlePosCodeLookup('${item.temp_id}', this.value); event.preventDefault();}">
                </td>
                <td style="font-weight: 600; color: var(--text-color, #fff);">
                    ${item.description ? item.description : '<span style="color:var(--text-muted); font-style:italic;">Ingresar código...</span>'}
                </td>
                <td>
                    <input type="number" step="0.01" min="0.01" id="pos-qty-input-${item.temp_id}" class="pos-row-input-qty" value="${item.quantity}" onchange="updatePosRowQty('${item.temp_id}', this.value)" style="text-align: center;">
                </td>
                <td style="text-align: center; font-size: 0.75rem; color: var(--text-muted);">
                    ${item.unit_measure || 'un.'}
                </td>
                <td>
                    <input type="number" step="0.01" min="0" class="pos-row-input-price" value="${item.unit_price}" onchange="updatePosRowPrice('${item.temp_id}', this.value)" style="text-align: right;">
                </td>
                <td style="text-align: right; font-weight: 700; color: #10b981;">
                    $${subtotalFmt}
                </td>
                <td style="text-align: center;">
                    <button type="button" class="pos-row-del-btn" onclick="removePosRow('${item.temp_id}')" title="Eliminar fila">&times;</button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = rowsHtml;
    updatePosComandaTotals(totalNeto, totalIva105, totalIva21, grandTotal);
}

function updatePosComandaTotals(neto, iva105, iva21, total) {
    const elNeto = document.getElementById('pos-summary-neto');
    const elIva105 = document.getElementById('pos-summary-iva105');
    const elIva21 = document.getElementById('pos-summary-iva21');
    const elTotal = document.getElementById('pos-summary-total');

    if (elNeto) elNeto.textContent = `$${neto.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (elIva105) elIva105.textContent = `$${iva105.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (elIva21) elIva21.textContent = `$${iva21.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (elTotal) elTotal.textContent = `$${total.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function updatePosTableIndicator() {
    const indicator = document.getElementById('pos-table-indicator');
    const orderBadge = document.getElementById('pos-order-number-badge');
    if (!indicator) return;

    if (state.posCurrentTableId) {
        indicator.textContent = `Mesa ${state.posCurrentTableNum || state.posCurrentTableId}`;
        indicator.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
        if (orderBadge) orderBadge.textContent = 'Salón';
    } else {
        indicator.textContent = 'Mostrador';
        indicator.style.background = 'linear-gradient(135deg, #6366f1, #4f46e5)';
        if (orderBadge) orderBadge.textContent = 'Nueva Comanda';
    }
}

// --- MODAL DE COBRO (CHECKOUT) ---

function initCheckoutModalEvents() {
    const modal = document.getElementById('modal-pos-checkout');
    const btnClose = document.getElementById('btn-pos-checkout-close');
    const btnCancel = document.getElementById('btn-pos-cancel-checkout');
    const btnComanda = document.getElementById('btn-pos-submit-comanda');
    const btnFactura = document.getElementById('btn-pos-submit-factura');
    const cashInput = document.getElementById('pos-cash-received');

    if (btnClose) btnClose.addEventListener('click', closePosCheckoutModal);
    if (btnCancel) btnCancel.addEventListener('click', closePosCheckoutModal);

    // Cambio reactivo al escribir en efectivo
    if (cashInput) {
        cashInput.addEventListener('input', updatePosChangeCalculation);
    }

    // Botones rápidos de billetes comunes
    const chipsContainer = document.getElementById('pos-quick-cash-chips');
    if (chipsContainer) {
        chipsContainer.querySelectorAll('.pos-cash-chip').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const amt = e.currentTarget.getAttribute('data-amt');
                const total = getPosComandaTotal();
                if (amt === 'exacto') {
                    if (cashInput) cashInput.value = total.toFixed(2);
                } else {
                    if (cashInput) cashInput.value = parseFloat(amt).toFixed(2);
                }
                updatePosChangeCalculation();
            });
        });
    }

    // Selector de Medios de Pago
    document.querySelectorAll('.pos-method-pill').forEach(pill => {
        pill.addEventListener('click', (e) => {
            document.querySelectorAll('.pos-method-pill').forEach(p => p.classList.remove('active'));
            e.currentTarget.classList.add('active');
            const method = e.currentTarget.getAttribute('data-method');
            state.posCheckoutMethod = method;

            const cashBox = document.getElementById('pos-cash-calculator');
            const multiBox = document.getElementById('pos-multi-payment-box');

            if (method === 'Pago Multi') {
                if (multiBox) multiBox.classList.remove('hide');
                if (cashBox) cashBox.classList.add('hide');
                initMultiPaymentRows();
            } else {
                if (multiBox) multiBox.classList.add('hide');
                if (cashBox) {
                    if (method === 'Efectivo') cashBox.classList.remove('hide');
                    else cashBox.classList.add('hide');
                }
            }
        });
    });

    // Acordeón de datos del cliente
    const clientHeader = document.getElementById('pos-toggle-client-details');
    const clientFields = document.getElementById('pos-client-fields');
    const clientArrow = document.getElementById('pos-client-arrow');
    if (clientHeader && clientFields) {
        clientHeader.addEventListener('click', () => {
            const isHidden = clientFields.classList.toggle('hide');
            if (clientArrow) clientArrow.textContent = isHidden ? '▼' : '▲';
        });
    }

    // Botón Comanda (Ticket Interno)
    if (btnComanda) {
        btnComanda.addEventListener('click', () => submitPosCheckout(false));
    }

    // Botón Facturar (Ticket Fiscal Simulado)
    if (btnFactura) {
        btnFactura.addEventListener('click', () => submitPosCheckout(true));
    }
}

function getPosComandaTotal() {
    return state.posComanda.reduce((sum, item) => sum + (item.subtotal || 0), 0);
}

function openPosCheckoutModal() {
    const validItems = state.posComanda.filter(i => i.subtotal > 0 && i.description);
    if (validItems.length === 0) {
        Alert.warning('Agrega al menos un producto a la comanda antes de cobrar.');
        return;
    }

    const total = getPosComandaTotal();
    const totalDisplay = document.getElementById('checkout-total-display');
    const orderInfo = document.getElementById('checkout-order-info');
    const cashInput = document.getElementById('pos-cash-received');

    if (totalDisplay) totalDisplay.textContent = `$${total.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    if (orderInfo) {
        orderInfo.textContent = state.posCurrentTableId ? `Mesa ${state.posCurrentTableNum || state.posCurrentTableId} • Salón` : 'Venta Mostrador';
    }

    // Reset de efectivo y vuelto
    if (cashInput) cashInput.value = '';
    updatePosChangeCalculation();

    // Activar Efectivo por defecto
    document.querySelectorAll('.pos-method-pill').forEach(p => {
        if (p.getAttribute('data-method') === 'Efectivo') p.classList.add('active');
        else p.classList.remove('active');
    });
    state.posCheckoutMethod = 'Efectivo';
    const cashBox = document.getElementById('pos-cash-calculator');
    const multiBox = document.getElementById('pos-multi-payment-box');
    if (cashBox) cashBox.classList.remove('hide');
    if (multiBox) multiBox.classList.add('hide');

    const modal = document.getElementById('modal-pos-checkout');
    if (modal) modal.classList.remove('hide');
}

function closePosCheckoutModal() {
    const modal = document.getElementById('modal-pos-checkout');
    if (modal) modal.classList.add('hide');
}

function updatePosChangeCalculation() {
    const cashInput = document.getElementById('pos-cash-received');
    const changeDisplay = document.getElementById('pos-cash-change-display');
    if (!cashInput || !changeDisplay) return;

    const total = getPosComandaTotal();
    const received = parseFloat(cashInput.value);

    if (isNaN(received) || received === 0) {
        changeDisplay.textContent = '$0,00';
        changeDisplay.style.color = '#10b981';
        return;
    }

    const change = received - total;
    if (change >= 0) {
        changeDisplay.textContent = `$${change.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        changeDisplay.style.color = '#10b981';
    } else {
        changeDisplay.textContent = `Faltan $${Math.abs(change).toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        changeDisplay.style.color = '#ef4444';
    }
}

// Pago Multi
function initMultiPaymentRows() {
    const total = getPosComandaTotal();
    state.posMultiPayments = [
        { payment_method: 'Efectivo', amount: parseFloat((total / 2).toFixed(2)) },
        { payment_method: 'Payway', amount: parseFloat((total - (total / 2)).toFixed(2)) }
    ];
    renderMultiPaymentRows();
}

function renderMultiPaymentRows() {
    const container = document.getElementById('pos-multi-rows-container');
    const remLabel = document.getElementById('pos-multi-remaining');
    if (!container) return;

    const total = getPosComandaTotal();
    let sum = 0;
    let html = '';

    state.posMultiPayments.forEach((p, idx) => {
        sum += parseFloat(p.amount) || 0;
        html += `
            <div class="pos-multi-row">
                <select onchange="updateMultiPaymentMethod(${idx}, this.value)" style="flex: 1.2;">
                    <option value="Efectivo" ${p.payment_method === 'Efectivo' ? 'selected' : ''}>Efectivo</option>
                    <option value="Payway" ${p.payment_method === 'Payway' ? 'selected' : ''}>Payway (Déb/Créd)</option>
                    <option value="Mercado Pago" ${p.payment_method === 'Mercado Pago' ? 'selected' : ''}>Mercado Pago</option>
                    <option value="Transferencia" ${p.payment_method === 'Transferencia' ? 'selected' : ''}>Transferencia</option>
                </select>
                <input type="number" step="0.01" value="${p.amount}" onchange="updateMultiPaymentAmount(${idx}, this.value)" style="flex: 1; font-weight: 700; text-align: right;">
                <button type="button" class="btn-delete" onclick="removeMultiPaymentRow(${idx})" title="Quitar">&times;</button>
            </div>
        `;
    });

    container.innerHTML = html;

    const diff = total - sum;
    if (remLabel) {
        if (Math.abs(diff) < 0.01) {
            remLabel.textContent = 'Monto cubierto 100%';
            remLabel.style.color = '#10b981';
        } else if (diff > 0) {
            remLabel.textContent = `Resta cubrir: $${diff.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
            remLabel.style.color = '#ef4444';
        } else {
            remLabel.textContent = `Excedente: $${Math.abs(diff).toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
            remLabel.style.color = '#f59e0b';
        }
    }
}

function updateMultiPaymentMethod(idx, method) {
    if (state.posMultiPayments[idx]) state.posMultiPayments[idx].payment_method = method;
}

function updateMultiPaymentAmount(idx, amount) {
    if (state.posMultiPayments[idx]) {
        state.posMultiPayments[idx].amount = parseFloat(amount) || 0;
        renderMultiPaymentRows();
    }
}

function removeMultiPaymentRow(idx) {
    state.posMultiPayments.splice(idx, 1);
    renderMultiPaymentRows();
}

const btnAddMulti = document.getElementById('btn-pos-add-multi-row');
if (btnAddMulti) {
    btnAddMulti.addEventListener('click', () => {
        state.posMultiPayments.push({ payment_method: 'Efectivo', amount: 0 });
        renderMultiPaymentRows();
    });
}

// --- SUBMIT FINAL DE VENTA Y EMISIÓN DE TICKET ---

async function submitPosCheckout(isInvoiced) {
    const validItems = state.posComanda.filter(i => i.subtotal > 0 && i.description);
    if (validItems.length === 0) {
        Alert.warning('No hay productos válidos para cobrar.');
        return;
    }

    const total = getPosComandaTotal();
    const cashReceivedVal = parseFloat(document.getElementById('pos-cash-received')?.value) || null;
    const changeVal = (cashReceivedVal !== null && cashReceivedVal >= total) ? (cashReceivedVal - total) : 0;

    // Si es Pago Multi, validar que la suma coincida con el total
    if (state.posCheckoutMethod === 'Pago Multi') {
        const sumMulti = state.posMultiPayments.reduce((s, p) => s + (parseFloat(p.amount) || 0), 0);
        if (Math.abs(sumMulti - total) > 1) {
            Alert.warning(`La suma de los pagos múltiples ($${sumMulti.toFixed(2)}) no coincide con el total ($${total.toFixed(2)}).`);
            return;
        }
    }

    const payload = {
        items: validItems,
        table_id: state.posCurrentTableId,
        payment_method: state.posCheckoutMethod,
        payments: state.posCheckoutMethod === 'Pago Multi' ? state.posMultiPayments : null,
        cash_received: cashReceivedVal,
        cash_change: changeVal,
        is_invoiced: isInvoiced,
        invoice_type: parseInt(document.getElementById('pos-invoice-type')?.value) || 11,
        client_doc_type: parseInt(document.getElementById('pos-client-doc-type')?.value) || 99,
        client_doc_number: document.getElementById('pos-client-doc-number')?.value.trim() || '',
        client_name: document.getElementById('pos-client-name')?.value.trim() || 'Consumidor Final',
        notes: state.posOrderNotes || '',
        date: new Date().toISOString().split('T')[0]
    };

    try {
        const response = await fetch(`${API_URL}/api/pos/checkout`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${state.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        const result = await safeResponseJSON(response, 'Error al procesar la venta');

        closePosCheckoutModal();

        // Guardar copia del último ticket para reimpresión instantánea
        state.posLastReceipt = {
            order: result.order,
            items: result.items,
            config: result.config,
            isInvoiced: isInvoiced
        };

        // Limpiar comanda y estado
        state.posComanda = [];
        state.posOrderNotes = '';
        state.posCurrentTableId = null;
        state.posCurrentTableNum = null;
        renderPosComanda();
        updatePosTableIndicator();

        // Disparar de inmediato la impresión a la comandera térmica
        printPosThermalReceipt(result.order, result.items, result.config, isInvoiced);

        // Modal de confirmación con botón manual de reimpresión
        Swal.fire({
            title: isInvoiced ? '¡Venta Facturada con Éxito!' : '¡Comanda Registrada!',
            html: `
                <div style="text-align: center; margin: 8px 0;">
                    <p style="font-size: 1.15rem; font-weight: 700; color: #16a34a; margin-bottom: 6px;">
                        ${isInvoiced ? `Factura C (CAE: ${result.order.cae || 'Generado'})` : `Comanda #${result.order.order_number}`}
                    </p>
                    <p style="color: #475569; font-size: 0.95rem; margin-bottom: 14px;">
                        Total: <strong>$${parseFloat(result.order.total_amount).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</strong> (${result.order.payment_method})
                    </p>
                    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 10px; margin-bottom: 12px; font-size: 0.88rem; color: #334155;">
                        🖨️ Ticket enviado a la impresora térmica. Si necesitas otra copia o no imprimió:
                    </div>
                    <button id="btn-swal-reprint" type="button" class="btn-primary" style="display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 0.65rem 1.2rem; font-size: 0.95rem; background: #0284c7; border: none; border-radius: 8px; color: white; cursor: pointer; font-weight: 600; width: 100%;">
                        🖨️ Imprimir / Reimprimir Ticket Ahora
                    </button>
                </div>
            `,
            icon: 'success',
            confirmButtonColor: '#d97706',
            confirmButtonText: 'Nueva Venta',
            customClass: {
                popup: 'premium-swal-popup',
                confirmButton: 'premium-swal-button'
            },
            didOpen: () => {
                const btnReprint = document.getElementById('btn-swal-reprint');
                if (btnReprint) {
                    btnReprint.addEventListener('click', () => {
                        printPosThermalReceipt(result.order, result.items, result.config, isInvoiced);
                    });
                }
            }
        });

        // Recargar productos (para reflejar stock actualizado si descontó) y mesas
        loadPosData();

    } catch (err) {
        Alert.error(err.message);
    }
}

// --- IMPRESIÓN DE TICKET TÉRMICO (80MM) Y REIMPRESIÓN ---

function handlePosTestOrReprintTicket() {
    if (state.posLastReceipt) {
        printPosThermalReceipt(
            state.posLastReceipt.order,
            state.posLastReceipt.items,
            state.posLastReceipt.config,
            state.posLastReceipt.isInvoiced
        );
        Alert.info(`Reimprimiendo ${state.posLastReceipt.isInvoiced ? 'Factura' : 'Comanda #' + state.posLastReceipt.order.order_number}...`);
    } else {
        const testOrder = {
            order_number: 'TEST',
            date: new Date().toISOString().split('T')[0],
            time: new Date().toTimeString().split(' ')[0],
            total_amount: 1500,
            payment_method: 'Efectivo',
            cash_received: 2000,
            cash_change: 500
        };
        const testItems = [
            { description: 'Ticket de Prueba Comandera', quantity: 1, unit_price: 1500, subtotal: 1500 }
        ];
        printPosThermalReceipt(testOrder, testItems, null, false);
        Alert.info('Enviando ticket de prueba a la impresora térmica...');
    }
}
window.handlePosTestOrReprintTicket = handlePosTestOrReprintTicket;

function printPosThermalReceipt(order, items, config, isInvoiced) {
    const cfg = config || {
        trade_name: 'Dulce Hora Villa Pueyrredon',
        business_owner: 'DONATO PABLO GABRIEL',
        cuit: '20443621033',
        gross_income: '20443621033',
        address: 'MOSCONI GRAL AV. 2268',
        iva_condition: 'Monotributista'
    };

    // Eliminar iframe previo si existiera para garantizar documento limpio
    const prevIframe = document.getElementById('pos-receipt-print-iframe');
    if (prevIframe) {
        prevIframe.remove();
    }

    // Crear iframe con ancho real positivo (requerido por el motor de render de Chromium)
    const iframe = document.createElement('iframe');
    iframe.id = 'pos-receipt-print-iframe';
    iframe.style.position = 'fixed';
    iframe.style.bottom = '0';
    iframe.style.right = '0';
    iframe.style.width = '80mm';
    iframe.style.height = '400px';
    iframe.style.border = 'none';
    iframe.style.opacity = '0.01';
    iframe.style.pointerEvents = 'none';
    iframe.style.zIndex = '-9999';
    document.body.appendChild(iframe);

    // Filas de productos para el ticket
    let itemsRowsHtml = '';
    (items || []).forEach(it => {
        const qty = parseFloat(it.quantity) || 1;
        const price = parseFloat(it.unit_price) || 0;
        const sub = parseFloat(it.subtotal || (qty * price)).toFixed(2);
        itemsRowsHtml += `
            <tr>
                <td style="padding: 2px 0;">${it.description || it.name || 'Producto'}</td>
                <td style="text-align: center; padding: 2px 0;">${qty}</td>
                <td style="text-align: right; padding: 2px 0;">$${price.toFixed(2)}</td>
                <td style="text-align: right; padding: 2px 0;">$${sub}</td>
            </tr>
        `;
    });

    const qrUrl = (order && order.afip_qr_url) ? `https://api.qrserver.com/v1/create-qr-code/?size=130x130&margin=2&data=${encodeURIComponent(order.afip_qr_url)}` : '';

    const orderNum = order ? (order.order_number || order.id || '1') : '1';
    const orderDate = order ? (order.date || new Date().toISOString().split('T')[0]) : '';
    const orderTime = order ? (order.time || new Date().toTimeString().split(' ')[0]) : '';
    const totalAmount = order ? parseFloat(order.total_amount || 0).toFixed(2) : '0.00';
    const paymentMethod = order ? (order.payment_method || 'Efectivo') : 'Efectivo';

    const receiptHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Ticket #${orderNum}</title>
            <style>
                @page { 
                    margin: 0; 
                    size: 80mm auto; 
                }
                * {
                    box-sizing: border-box;
                    margin: 0;
                    padding: 0;
                }
                body {
                    font-family: 'Courier New', Courier, monospace;
                    font-size: 11px;
                    line-height: 1.25;
                    width: 72mm;
                    margin: 0 auto;
                    padding: 4mm 0;
                    color: #000;
                    background: #fff;
                }
                .text-center { text-align: center; }
                .text-right { text-align: right; }
                .bold { font-weight: bold; }
                .divider { border-bottom: 1px dashed #000; margin: 5px 0; }
                table { width: 100%; border-collapse: collapse; font-size: 11px; margin: 4px 0; }
                .qr-box { text-align: center; margin: 8px 0; }
                .qr-box img { width: 110px; height: 110px; display: inline-block; }
            </style>
        </head>
        <body>
            <div class="text-center bold" style="font-size: 14px;">${cfg.trade_name}</div>
            <div class="text-center">${cfg.business_owner}</div>
            <div class="text-center">CUIT: ${cfg.cuit}</div>
            <div class="text-center">Ing. Brutos: ${cfg.gross_income}</div>
            <div class="text-center">${cfg.address}</div>
            <div class="text-center">IVA: ${cfg.iva_condition}</div>
            <div class="divider"></div>

            ${isInvoiced ? `
                <div class="text-center bold" style="font-size: 13px;">FACTURA C</div>
                <div class="text-center">P.Vta: ${String(order.pto_venta || 2).padStart(4, '0')} Comp. Nro: ${String(order.invoice_number || 1).padStart(8, '0')}</div>
                <div class="text-center">Fecha: ${orderDate}  Hora: ${orderTime}</div>
                <div class="divider"></div>
                <div>A: ${order.client_name || 'Consumidor Final'}</div>
                <div>Doc: ${order.client_doc_number ? (order.client_doc_type === 80 ? 'CUIT ' : 'DNI ') + order.client_doc_number : 'Consumidor Final'}</div>
            ` : `
                <div class="text-center bold" style="font-size: 13px;">COMANDA / TICKET</div>
                <div class="text-center">Comanda Nro: #${orderNum}</div>
                <div class="text-center">Fecha: ${orderDate}  Hora: ${orderTime}</div>
                <div class="text-center bold">*** NO VÁLIDO COMO FACTURA ***</div>
            `}

            <div class="divider"></div>
            <table>
                <thead>
                    <tr class="bold" style="border-bottom: 1px solid #000;">
                        <th style="text-align: left; padding: 2px 0;">Detalle</th>
                        <th style="padding: 2px 0;">Cant</th>
                        <th style="text-align: right; padding: 2px 0;">P.Unit</th>
                        <th style="text-align: right; padding: 2px 0;">Subt</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsRowsHtml}
                </tbody>
            </table>
            <div class="divider"></div>

            <table>
                <tr>
                    <td class="bold">TOTAL:</td>
                    <td class="text-right bold" style="font-size: 13px;">$${totalAmount}</td>
                </tr>
                <tr>
                    <td>Forma de Pago:</td>
                    <td class="text-right">${paymentMethod}</td>
                </tr>
                ${(order && order.cash_received) ? `
                <tr>
                    <td>Abona con:</td>
                    <td class="text-right">$${parseFloat(order.cash_received).toFixed(2)}</td>
                </tr>
                <tr>
                    <td>Su Vuelto:</td>
                    <td class="text-right bold">$${parseFloat(order.cash_change || 0).toFixed(2)}</td>
                </tr>
                ` : ''}
            </table>

            ${isInvoiced ? `
                <div class="divider"></div>
                <div class="text-center bold">CAE: ${order.cae}</div>
                <div class="text-center">Vto. CAE: ${order.cae_due_date}</div>
                <div class="qr-box">
                    <img src="${qrUrl}" alt="QR AFIP">
                    <div style="font-size: 8px;">Comprobante Autorizado por ARCA / AFIP</div>
                </div>
            ` : ''}

            <div class="divider"></div>
            <div class="text-center bold" style="margin-top: 6px;">¡Gracias por su compra!</div>
            <div class="text-center" style="font-size: 9px; margin-top: 2px;">Dulce Hora</div>
        </body>
        </html>
    `;

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(receiptHtml);
    doc.close();

    const doPrint = () => {
        try {
            iframe.contentWindow.focus();
            iframe.contentWindow.print();
        } catch (err) {
            console.error('Error al imprimir ticket con iframe:', err);
            try {
                const win = window.open('', '_blank', 'width=380,height=600');
                if (win) {
                    win.document.write(receiptHtml);
                    win.document.close();
                    win.focus();
                    win.print();
                }
            } catch (winErr) {
                console.error('Fallback window.open también falló:', winErr);
            }
        }
    };

    // Si tiene imagen de QR fiscal, esperar a que cargue antes de imprimir
    const img = doc.querySelector('img');
    if (img && !img.complete) {
        img.onload = () => setTimeout(doPrint, 100);
        img.onerror = () => setTimeout(doPrint, 100);
        setTimeout(doPrint, 600);
    } else {
        setTimeout(doPrint, 300);
    }
}

// --- GESTIÓN DE MESAS DE SALÓN ---

function initTablesModalEvents() {
    const modal = document.getElementById('modal-pos-tables');
    const btnClose = document.getElementById('btn-pos-tables-close');
    const btnCancel = document.getElementById('btn-pos-tables-cancel');
    const btnAddTable = document.getElementById('btn-pos-add-table');
    const btnMostrador = document.getElementById('btn-pos-select-mostrador');

    if (btnClose) btnClose.addEventListener('click', closePosTablesModal);
    if (btnCancel) btnCancel.addEventListener('click', closePosTablesModal);

    if (btnAddTable) {
        btnAddTable.addEventListener('click', async () => {
            const numInput = document.getElementById('pos-new-table-num');
            const num = parseInt(numInput?.value);
            if (!num) {
                Alert.warning('Ingresa un número de mesa válido.');
                return;
            }
            try {
                const response = await fetch(`${API_URL}/api/pos/tables`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${state.token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ table_number: num, name: `Mesa ${num}` })
                });
                await safeResponseJSON(response, 'Error al crear mesa');
                if (numInput) numInput.value = '';
                loadPosData();
                renderPosTablesModal();
                Alert.success(`Mesa ${num} agregada con éxito.`);
            } catch (err) {
                Alert.error(err.message);
            }
        });
    }

    if (btnMostrador) {
        btnMostrador.addEventListener('click', () => {
            state.posCurrentTableId = null;
            state.posCurrentTableNum = null;
            updatePosTableIndicator();
            closePosTablesModal();
        });
    }
}

function openPosTablesModal() {
    renderPosTablesModal();
    const modal = document.getElementById('modal-pos-tables');
    if (modal) modal.classList.remove('hide');
}

function closePosTablesModal() {
    const modal = document.getElementById('modal-pos-tables');
    if (modal) modal.classList.add('hide');
}

function renderPosTablesModal() {
    const grid = document.getElementById('pos-tables-grid');
    if (!grid) return;

    if (!state.posTables || state.posTables.length === 0) {
        grid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">No hay mesas configuradas.</p>';
        return;
    }

    let html = '';
    state.posTables.forEach(t => {
        const isOpen = t.status === 'open';
        html += `
            <div class="pos-table-card ${isOpen ? 'open' : 'closed'}" onclick="selectPosTable(${t.id}, ${t.table_number}, '${t.status}')">
                <div class="pos-table-card-num">${t.name || 'Mesa ' + t.table_number}</div>
                <div class="pos-table-card-status">${isOpen ? 'Ocupada' : 'Libre'}</div>
                ${isOpen && t.total_amount ? `<div class="pos-table-card-total">$${parseFloat(t.total_amount).toFixed(2)}</div>` : ''}
            </div>
        `;
    });

    grid.innerHTML = html;
}

async function selectPosTable(tableId, tableNum, currentStatus) {
    state.posCurrentTableId = tableId;
    state.posCurrentTableNum = tableNum;
    updatePosTableIndicator();

    if (currentStatus === 'closed') {
        try {
            await fetch(`${API_URL}/api/pos/tables/${tableId}/open`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${state.token}` }
            });
            loadPosData();
        } catch (e) {}
    }

    closePosTablesModal();
}

// --- MODAL DE PRODUCTOS PERSONALIZADOS Y ACCESO RÁPIDO (ABM) ---

function initCustomProductsModalEvents() {
    const modal = document.getElementById('modal-pos-custom-products');
    const btnClose = document.getElementById('btn-pos-custom-prod-close');
    const btnCancel = document.getElementById('btn-pos-cancel-prod-form');
    const tabList = document.getElementById('tab-btn-prod-list');
    const tabForm = document.getElementById('tab-btn-prod-form');
    const filterInput = document.getElementById('pos-custom-prod-filter');
    const catFilter = document.getElementById('pos-custom-prod-cat-filter');
    const form = document.getElementById('pos-product-form');

    if (btnClose) btnClose.addEventListener('click', closePosCustomProductsModal);
    if (btnCancel) btnCancel.addEventListener('click', () => switchPosCustomProdTab('list'));

    if (tabList) tabList.addEventListener('click', () => switchPosCustomProdTab('list'));
    if (tabForm) tabForm.addEventListener('click', () => {
        resetPosProductForm();
        switchPosCustomProdTab('form');
    });

    if (filterInput) filterInput.addEventListener('input', renderPosCustomProductsTable);
    if (catFilter) catFilter.addEventListener('change', renderPosCustomProductsTable);

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('pos-pf-id').value;
            const code = document.getElementById('pos-pf-code').value.trim();
            const name = document.getElementById('pos-pf-name').value.trim();
            const category = document.getElementById('pos-pf-category').value.trim();
            const description = document.getElementById('pos-pf-desc').value.trim();
            const price = parseFloat(document.getElementById('pos-pf-price').value) || 0;
            const unit_measure = document.getElementById('pos-pf-unit').value;
            const iva_rate = parseFloat(document.getElementById('pos-pf-iva').value) || 10.5;
            const auto_deduct_stock = document.querySelector('input[name="pos-pf-stock-rule"]:checked')?.value || 1;
            const is_quick_access = document.getElementById('pos-pf-quick-access').checked ? 1 : 0;
            const quick_access_order = parseInt(document.getElementById('pos-pf-quick-order').value) || 0;

            const payload = {
                code, name, category, description, price, unit_measure,
                iva_rate, auto_deduct_stock: parseInt(auto_deduct_stock),
                is_quick_access, quick_access_order
            };

            try {
                const url = id ? `${API_URL}/api/pos/products/${id}` : `${API_URL}/api/pos/products`;
                const method = id ? 'PUT' : 'POST';

                const response = await fetch(url, {
                    method,
                    headers: {
                        'Authorization': `Bearer ${state.token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });

                await safeResponseJSON(response, 'Error al guardar producto');
                Alert.success(id ? 'Producto actualizado correctamente.' : 'Producto creado con éxito.');
                switchPosCustomProdTab('list');
                loadPosData();
            } catch (err) {
                Alert.error(err.message);
            }
        });
    }
}

function openPosCustomProductsModal() {
    switchPosCustomProdTab('list');
    populatePosCategoriesDatalist();
    renderPosCustomProductsTable();
    const modal = document.getElementById('modal-pos-custom-products');
    if (modal) modal.classList.remove('hide');
}

function closePosCustomProductsModal() {
    const modal = document.getElementById('modal-pos-custom-products');
    if (modal) modal.classList.add('hide');
}

function switchPosCustomProdTab(tabName) {
    const listView = document.getElementById('pos-prod-list-view');
    const formView = document.getElementById('pos-prod-form-view');
    const tabListBtn = document.getElementById('tab-btn-prod-list');
    const tabFormBtn = document.getElementById('tab-btn-prod-form');

    if (tabName === 'list') {
        if (listView) listView.classList.remove('hide');
        if (formView) formView.classList.add('hide');
        if (tabListBtn) tabListBtn.classList.add('active');
        if (tabFormBtn) tabFormBtn.classList.remove('active');
        renderPosCustomProductsTable();
    } else {
        if (listView) listView.classList.add('hide');
        if (formView) formView.classList.remove('hide');
        if (tabListBtn) tabListBtn.classList.remove('active');
        if (tabFormBtn) tabFormBtn.classList.add('active');
    }
}

function populatePosCategoriesDatalist() {
    const datalist = document.getElementById('pos-categories-datalist');
    const selectFilter = document.getElementById('pos-custom-prod-cat-filter');
    if (!datalist || !selectFilter) return;

    datalist.innerHTML = '';
    selectFilter.innerHTML = '<option value="">Todas las categorías</option>';

    if (state.posCategories) {
        state.posCategories.forEach(c => {
            const opt1 = document.createElement('option');
            opt1.value = c.category;
            datalist.appendChild(opt1);

            const opt2 = document.createElement('option');
            opt2.value = c.category;
            opt2.textContent = c.category;
            selectFilter.appendChild(opt2);
        });
    }
}

function renderPosCustomProductsTable() {
    const tbody = document.getElementById('pos-custom-prod-tbody');
    if (!tbody) return;

    const filterText = (document.getElementById('pos-custom-prod-filter')?.value || '').toLowerCase().trim();
    const filterCat = document.getElementById('pos-custom-prod-cat-filter')?.value || '';

    let prods = state.posProducts || [];
    if (filterCat) prods = prods.filter(p => p.category === filterCat);
    if (filterText) {
        prods = prods.filter(p => (p.name && p.name.toLowerCase().includes(filterText)) || (p.code && p.code.toLowerCase().includes(filterText)));
    }

    if (prods.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 1.5rem;">No se encontraron productos.</td></tr>';
        return;
    }

    let html = '';
    prods.forEach(p => {
        const isQuick = p.is_quick_access === 1;
        const autoDeduct = p.auto_deduct_stock === 1;
        html += `
            <tr>
                <td><strong>${p.code || '—'}</strong></td>
                <td>${p.name}</td>
                <td><span class="badge">${p.category}</span></td>
                <td style="font-weight: 700;">$${parseFloat(p.price).toFixed(2)}</td>
                <td>
                    <span class="badge ${autoDeduct ? 'badge-success' : 'badge-warning'}" title="${autoDeduct ? 'Descuento automático en venta' : 'Stock manual - No descuenta'}">
                        ${autoDeduct ? 'Auto' : 'Manual'}
                    </span>
                </td>
                <td style="text-align: center;">
                    <button type="button" class="btn-icon" onclick="toggleQuickAccessProduct(${p.id}, ${isQuick ? 0 : 1})" title="${isQuick ? 'Quitar de acceso rápido' : 'Agregar a acceso rápido'}" style="font-size: 1.1rem; color: ${isQuick ? '#f59e0b' : 'var(--text-muted)'}; background:none; border:none; cursor:pointer;">
                        ${isQuick ? '★' : '☆'}
                    </button>
                </td>
                <td style="display: flex; gap: 4px;">
                    <button type="button" class="btn-icon" onclick="editCustomProduct(${p.id})" title="Editar">✏️</button>
                    <button type="button" class="btn-delete" onclick="deleteCustomProduct(${p.id}, '${p.name}')" title="Desactivar">🗑️</button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

function openPosNewProductModal() {
    openPosCustomProductsModal();
    resetPosProductForm();
    switchPosCustomProdTab('form');
    setTimeout(() => {
        const nameInput = document.getElementById('pos-pf-name');
        if (nameInput) nameInput.focus();
    }, 150);
}

function quickEditPosProduct(prodId) {
    openPosCustomProductsModal();
    editCustomProduct(prodId);
    setTimeout(() => {
        const priceInput = document.getElementById('pos-pf-price');
        if (priceInput) {
            priceInput.focus();
            priceInput.select();
        }
    }, 150);
}

function resetPosProductForm() {
    document.getElementById('pos-pf-id').value = '';
    document.getElementById('pos-pf-code').value = '';
    document.getElementById('pos-pf-name').value = '';
    document.getElementById('pos-pf-category').value = '';
    document.getElementById('pos-pf-desc').value = '';
    document.getElementById('pos-pf-price').value = '';
    document.getElementById('pos-pf-unit').value = 'unidad';
    document.getElementById('pos-pf-iva').value = '21.0';
    document.getElementById('pos-pf-stock-auto').checked = true;
    document.getElementById('pos-pf-quick-access').checked = false;
    document.getElementById('pos-pf-quick-order').value = '0';

    const btnDeleteFromForm = document.getElementById('btn-pos-delete-prod-from-form');
    if (btnDeleteFromForm) btnDeleteFromForm.classList.add('hide');
}

function editCustomProduct(prodId) {
    const p = state.posProducts.find(x => x.id === prodId);
    if (!p) return;

    document.getElementById('pos-pf-id').value = p.id;
    document.getElementById('pos-pf-code').value = p.code || '';
    document.getElementById('pos-pf-name').value = p.name;
    document.getElementById('pos-pf-category').value = p.category;
    document.getElementById('pos-pf-desc').value = p.description || '';
    document.getElementById('pos-pf-price').value = p.price;
    document.getElementById('pos-pf-unit').value = p.unit_measure || 'unidad';
    document.getElementById('pos-pf-iva').value = p.iva_rate || '21.0';

    if (p.auto_deduct_stock === 0) {
        document.getElementById('pos-pf-stock-manual').checked = true;
    } else {
        document.getElementById('pos-pf-stock-auto').checked = true;
    }

    document.getElementById('pos-pf-quick-access').checked = p.is_quick_access === 1;
    document.getElementById('pos-pf-quick-order').value = p.quick_access_order || 0;

    const btnDeleteFromForm = document.getElementById('btn-pos-delete-prod-from-form');
    if (btnDeleteFromForm) {
        btnDeleteFromForm.classList.remove('hide');
        btnDeleteFromForm.onclick = () => {
            deleteCustomProduct(p.id, p.name).then(() => {
                switchPosCustomProdTab('list');
            });
        };
    }

    switchPosCustomProdTab('form');
}

async function toggleQuickAccessProduct(prodId, nextState) {
    try {
        await fetch(`${API_URL}/api/pos/products/${prodId}/quick-access`, {
            method: 'PATCH',
            headers: {
                'Authorization': `Bearer ${state.token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ is_quick_access: nextState, quick_access_order: 0 })
        });
        loadPosData();
        renderPosCustomProductsTable();
    } catch (err) {
        Alert.error('Error al actualizar acceso rápido');
    }
}

async function deleteCustomProduct(prodId, prodName) {
    const confirmed = await Alert.confirm(`¿Estás seguro de desactivar el producto "${prodName}"?`, 'Desactivar Producto', 'Sí, desactivar', 'Cancelar');
    if (!confirmed) return;

    try {
        const response = await fetch(`${API_URL}/api/pos/products/${prodId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${state.token}` }
        });
        await safeResponseJSON(response, 'Error al dar de baja el producto');
        Alert.success('Producto desactivado correctamente.');
        loadPosData();
        renderPosCustomProductsTable();
    } catch (err) {
        Alert.error(err.message);
    }
}

// --- MODAL DE NOTAS Y CLIENTE ---

function initNotesModalEvents() {
    const modal = document.getElementById('modal-pos-notes');
    const btnClose = document.getElementById('btn-pos-notes-close');
    const btnCancel = document.getElementById('btn-pos-notes-cancel');
    const btnSave = document.getElementById('btn-pos-notes-save');

    if (btnClose) btnClose.addEventListener('click', closePosNotesModal);
    if (btnCancel) btnCancel.addEventListener('click', closePosNotesModal);

    if (btnSave) {
        btnSave.addEventListener('click', () => {
            const notesInput = document.getElementById('pos-order-notes-input');
            const clientInput = document.getElementById('pos-order-client-input');
            state.posOrderNotes = notesInput ? notesInput.value.trim() : '';
            state.posOrderClient = clientInput ? clientInput.value.trim() : '';
            closePosNotesModal();
            Alert.success('Notas registradas en la comanda actual.');
        });
    }
}

function openPosNotesModal() {
    const notesInput = document.getElementById('pos-order-notes-input');
    const clientInput = document.getElementById('pos-order-client-input');
    if (notesInput) notesInput.value = state.posOrderNotes || '';
    if (clientInput) clientInput.value = state.posOrderClient || '';

    const modal = document.getElementById('modal-pos-notes');
    if (modal) modal.classList.remove('hide');
}

function closePosNotesModal() {
    const modal = document.getElementById('modal-pos-notes');
    if (modal) modal.classList.add('hide');
}

// Global window assignments for inline onclick handlers
window.loadPosData = loadPosData;
window.addPosProductToComanda = addPosProductToComanda;
window.addEmptyPosComandaRows = addEmptyPosComandaRows;
window.handlePosCodeLookup = handlePosCodeLookup;
window.updatePosRowQty = updatePosRowQty;
window.updatePosRowPrice = updatePosRowPrice;
window.removePosRow = removePosRow;
window.clearPosComanda = clearPosComanda;
window.openPosCheckoutModal = openPosCheckoutModal;
window.closePosCheckoutModal = closePosCheckoutModal;
window.openPosTablesModal = openPosTablesModal;
window.closePosTablesModal = closePosTablesModal;
window.selectPosTable = selectPosTable;
window.openPosCustomProductsModal = openPosCustomProductsModal;
window.closePosCustomProductsModal = closePosCustomProductsModal;
window.editCustomProduct = editCustomProduct;
window.deleteCustomProduct = deleteCustomProduct;
window.toggleQuickAccessProduct = toggleQuickAccessProduct;
window.openPosNotesModal = openPosNotesModal;
window.closePosNotesModal = closePosNotesModal;
window.updateMultiPaymentMethod = updateMultiPaymentMethod;
window.updateMultiPaymentAmount = updateMultiPaymentAmount;
window.removeMultiPaymentRow = removeMultiPaymentRow;




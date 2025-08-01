/**
 * =================================================================================
 * CS ENSIGNA - main.js (Versión Final Definitiva - Enfoque de Ocultar/Mostrar)
 * ---------------------------------------------------------------------------------
 * Lógica centralizada de la aplicación.
 * ESTRATEGIA:
 * 1. Cada página HTML carga el sidebar maestro completo.
 * 2. Los scripts de la plantilla Mazer (`app.js`, `dark.js`) se encargan de la
 *    interactividad (hamburguesa, modo oscuro).
 * 3. Este script se ejecuta al final para gestionar la lógica de negocio:
 *    - Maneja el formulario de login.
 *    - Oculta los enlaces del menú que no corresponden al rol del usuario.
 *    - Puebla los datos del perfil y ejecuta la lógica específica de cada página.
 * =================================================================================
 */

// --- SECCIÓN 1: LÓGICA DE LA PÁGINA DE LOGIN ---
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const username = document.getElementById('username').value.trim().toLowerCase();
        let role = '', fullName = '', dashboardUrl = '';
        switch (username) {
            case 'admin': role = 'Administrador'; fullName = 'Danna Andrade'; dashboardUrl = 'html/admin_dashboard.html'; break;
            case 'asesor': role = 'Asesor'; fullName = 'Ariel Llumiquinga'; dashboardUrl = 'html/asesor_dashboard.html'; break;
            case 'vendedor': role = 'Vendedor'; fullName = 'Jeancarlo Santi'; dashboardUrl = 'html/vendedor_dashboard.html'; break;
            default: alert('Usuario no válido.'); return;
        }
        localStorage.setItem('userRole', role);
        localStorage.setItem('userName', fullName);
        window.location.href = dashboardUrl;
    });
}

// --- SECCIÓN 2: ORQUESTADOR PARA PÁGINAS AUTENTICADAS ---
document.addEventListener('DOMContentLoaded', function() {
    // Si no estamos en la página de login, inicializamos la página interna.
    if (!loginForm) {
        initAuthenticatedPage();
    }
});

/**
 * Función principal que se ejecuta en cada página protegida.
 */
function initAuthenticatedPage() {
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName');

    // Verificación de seguridad
    if (!userRole || !userName) {
        console.error("Acceso denegado. No se encontró información de la sesión.");
        window.location.href = '../index.html';
        return;
    }

    // El sidebar ya está en el HTML y es funcional gracias a los scripts de la plantilla.
    // Nuestra única tarea es gestionar la visibilidad de los enlaces.
    manageSidebarVisibility(userRole);
    
    // El resto de nuestras funciones personalizadas.
    setActiveMenuItem();
    initializeLogoutButtons();
    populateProfileData(userName, userRole);
    runPageSpecificLogic();
    controlElementVisibility(userRole);
}

// --- SECCIÓN 3: LÓGICA DE VISIBILIDAD DEL MENÚ ---

/**
 * Oculta y muestra los elementos del menú basados en el rol del usuario.
 * @param {string} role El rol del usuario actual.
 */
function manageSidebarVisibility(role) {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    // 1. Ocultamos todos los elementos con rol específico para empezar de cero.
    sidebar.querySelectorAll('.role-admin, .role-asesor, .role-vendedor').forEach(el => {
        el.style.display = 'none';
    });

    // 2. Determinamos qué clase de rol debemos mostrar.
    let roleClassToShow = '';
    switch (role) {
        case 'Administrador': roleClassToShow = '.role-admin'; break;
        case 'Asesor': roleClassToShow = '.role-asesor'; break;
        case 'Vendedor': roleClassToShow = '.role-vendedor'; break;
    }

    // 3. Mostramos solo los elementos para el rol actual.
    if (roleClassToShow) {
        sidebar.querySelectorAll(roleClassToShow).forEach(el => {
            el.style.display = ''; // Usar '' resetea al estilo por defecto (block, list-item, etc.)
        });
    }
}


// --- SECCIÓN 4: OTRAS FUNCIONES AUXILIARES ---

/**
 * Marca como activo el enlace del menú correspondiente a la página actual.
 */
function setActiveMenuItem() {
    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('#sidebar .sidebar-item').forEach(li => {
        const link = li.querySelector('a');
        if (link) {
            const linkPage = link.getAttribute('href').split('/').pop();
            // Solo marcamos como activo si el link coincide Y el elemento está visible.
            if (linkPage === currentPage && li.style.display !== 'none') {
                li.classList.add('active');
            } else {
                li.classList.remove('active');
            }
        }
    });
}

/**
 * Asigna la funcionalidad de logout a los botones de cerrar sesión.
 */
function initializeLogoutButtons() {
    const setupLogout = (buttonId) => {
        const btn = document.getElementById(buttonId);
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.clear();
                window.location.href = '../index.html';
            });
        }
    };
    setupLogout('logout-btn-sidebar');
    setupLogout('logout-btn');
}

/**
 * Rellena la información del perfil del usuario en el header.
 * @param {string} name El nombre del usuario.
 * @param {string} role El rol del usuario.
 */
function populateProfileData(name, role) {
    const profileNameEl = document.getElementById('profile-name');
    const profileRoleEl = document.getElementById('profile-role');
    const greetingNameEl = document.getElementById('profile-greeting-name');
    if (profileNameEl) profileNameEl.textContent = name;
    if (profileRoleEl) profileRoleEl.textContent = role;
    if (greetingNameEl) greetingNameEl.textContent = name.split(' ')[0];
}

/**
 * Ejecuta la lógica específica de la página actual basándose en la URL.
 */
function runPageSpecificLogic() {
    const url = window.location.href;
    if (url.includes('admin_dashboard.html')) loadAdminDashboard();
    else if (url.includes('asesor_dashboard.html')) loadAsesorDashboard();
    else if (url.includes('vendedor_dashboard.html')) loadVendedorDashboard();
    else if (url.includes('gestion_clientes.html')) loadGestionClientes();
}

/**
 * Controla la visibilidad de elementos específicos en una página según el rol.
 * @param {string} role El rol del usuario.
 */
function controlElementVisibility(role) {
    const url = window.location.href;
    if (url.includes('gestion_clientes.html')) {
        const addClientButton = document.querySelector('[data-bs-target="#addClientModal"]');
        if (addClientButton && role !== 'Administrador' && role !== 'Asesor') {
            addClientButton.style.display = 'none';
        }
    }
}


// --- SECCIÓN 5: IMPLEMENTACIÓN DE LÓGICA DE PÁGINAS ---

const mockInsuranceData = {
    basico: { name: 'Plan Básico', price: 50, features: { responsabilidadCivil: 'Hasta $20,000', roboTotal: true, asistenciaVial: 'Básica', colision: null, autoReemplazo: null } },
    intermedio: { name: 'Plan Intermedio', price: 85, features: { responsabilidadCivil: 'Hasta $50,000', roboTotal: true, asistenciaVial: 'Completa 24/7', colision: 'Deducible 5%', autoReemplazo: null } },
    completo: { name: 'Plan Completo', price: 120, features: { responsabilidadCivil: 'Hasta $100,000', roboTotal: true, asistenciaVial: 'VIP Ilimitada', colision: 'Sin Deducible', autoReemplazo: 'Hasta 15 días' } }
};
const featureLabels = { responsabilidadCivil: 'Responsabilidad Civil', roboTotal: 'Robo Total', asistenciaVial: 'Asistencia Vial', colision: 'Daños por Colisión', autoReemplazo: 'Auto de Reemplazo' };

function buildComparisonTable(selectedPlans, tableHead, tableBody, tableFoot) {
    tableHead.innerHTML = ''; tableBody.innerHTML = ''; tableFoot.innerHTML = '';
    let headRow = '<tr><th>Cobertura</th>';
    selectedPlans.forEach(planKey => { headRow += `<th><h5>${mockInsuranceData[planKey].name}</h5></th>`; });
    tableHead.innerHTML = headRow + '</tr>';
    Object.keys(featureLabels).forEach(featureKey => {
        let bodyRow = `<tr><td><strong>${featureLabels[featureKey]}</strong></td>`;
        selectedPlans.forEach(planKey => {
            const val = mockInsuranceData[planKey].features[featureKey];
            bodyRow += val ? `<td><i class="bi bi-check-circle-fill text-success fs-4"></i><br><small>${val === true ? '' : val}</small></td>` : `<td><i class="bi bi-x-circle-fill text-danger fs-4"></i></td>`;
        });
        tableBody.innerHTML += bodyRow + '</tr>';
    });
    let footRow = '<tr class="table-light"><td><strong>Precio Mensual</strong></td>';
    selectedPlans.forEach(planKey => { footRow += `<td><h4>$${mockInsuranceData[planKey].price}</h4></td>`; });
    tableFoot.innerHTML = footRow + '</tr>';
}

function loadAdminDashboard() {
    const mockUsers = [ { id: 1, name: 'Andrade Lucio Danna Valentina', email: 'daandrade9@espe.edu.ec', role: 'Diseñador' }, { id: 2, name: 'Santi Cruz Jeancarlo Javier', email: 'jjsanti@espe.edu.ec', role: 'Programador' }, { id: 3, name: 'Llumiquinga Ñacato Ariel Jose', email: 'ajllumiquinga2@espe.edu.ec', role: 'Analista' }, { id: 4, name: 'Manangón Vinueza Zaith Alejandro', email: 'zamanangon@espe.edu.ec', role: 'Programador' } ];
    const userTableBody = document.getElementById('user-table-body');
    if (userTableBody) {
        userTableBody.innerHTML = '';
        mockUsers.forEach(user => { userTableBody.innerHTML += `<tr><td>${user.id}</td><td>${user.name}</td><td>${user.email}</td><td><span class="badge bg-success">${user.role}</span></td><td><button class="btn btn-sm btn-info">Editar</button><button class="btn btn-sm btn-danger ms-1">Desactivar</button></td></tr>`; });
    }
}

function loadAsesorDashboard() {
    const form = document.getElementById('quote-form');
    if (!form) return;
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        const selectedPlans = Array.from(form.querySelectorAll('input[type=checkbox]:checked')).map(cb => cb.value);
        if (selectedPlans.length === 0) { alert('Por favor, seleccione al menos un plan.'); return; }
        const area = document.getElementById('comparison-area');
        buildComparisonTable(selectedPlans, document.getElementById('comparison-table-head'), document.getElementById('comparison-table-body'), document.getElementById('comparison-table-foot'));
        document.getElementById('client-name-display').textContent = document.getElementById('client-name').value;
        area.style.display = 'block';
        area.scrollIntoView({ behavior: 'smooth' });
    });
    const pdfBtn = document.getElementById('generate-pdf-btn');
    if (pdfBtn) pdfBtn.addEventListener('click', () => alert(`Simulación: PDF generado para ${document.getElementById('client-name-display').textContent}.`));
}

function loadVendedorDashboard() {
    const form = document.getElementById('quick-quote-form');
    if (!form) return;
    form.addEventListener('submit', function(event) {
        event.preventDefault();
        const selectedPlans = Array.from(form.querySelectorAll('input[type=checkbox]:checked')).map(cb => cb.value);
        if (selectedPlans.length === 0) { alert('Por favor, seleccione al menos un paquete.'); return; }
        const area = document.getElementById('vendedor-comparison-area');
        buildComparisonTable(selectedPlans, document.getElementById('vendedor-comparison-head'), document.getElementById('vendedor-comparison-body'), document.getElementById('vendedor-comparison-foot'));
        area.style.display = 'block';
        area.scrollIntoView({ behavior: 'smooth' });
    });
    const pdfBtn = document.getElementById('vendedor-generate-pdf-btn');
    if (pdfBtn) pdfBtn.addEventListener('click', () => alert(`Simulación: PDF generado para ${document.getElementById('vendedor-client-name').value || 'el cliente'}.`));
}

function loadGestionClientes() {
    // Aquí iría la lógica futura para la página de gestión de clientes.
}
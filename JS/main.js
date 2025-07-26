/**
 * =================================================================================
 * CS ENSIGNA - main.js (Versión Robusta y Simplificada)
 * =================================================================================
 */

// --- SECCIÓN 1: LÓGICA DE LOGIN ---
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

// --- SECCIÓN 2: ORQUESTADOR PARA PÁGINAS INTERNAS ---
document.addEventListener('DOMContentLoaded', function() {
    if (!loginForm) {
        initAuthenticatedPage();
    }
});

function initAuthenticatedPage() {
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName');

    if (!userRole || !userName) {
        console.error("Acceso denegado. No hay sesión.");
        window.location.href = '../index.html';
        return;
    }

    loadSidebar(userRole)
        .then(() => {
            populateProfileData(userName, userRole);
            runPageSpecificLogic();
            controlElementVisibility(userRole);
        })
        .catch(error => {
            console.error("Fallo al inicializar la página:", error);
            alert("Ocurrió un error al cargar el menú: " + error.message);
        });
}

// --- SECCIÓN 3: FUNCIONES DE CARGA DINÁMICA ---
function loadSidebar(role) {
    return new Promise((resolve, reject) => {
        const sidebarContainer = document.getElementById('sidebar');
        if (!sidebarContainer) return reject(new Error("Contenedor #sidebar no encontrado."));

        let sidebarPath;
        switch (role) {
            case 'Administrador': sidebarPath = '_admin_sidebar.html'; break;
            case 'Asesor': sidebarPath = '_asesor_sidebar.html'; break;
            case 'Vendedor': sidebarPath = '_vendedor_sidebar.html'; break;
            default: return reject(new Error(`Rol no reconocido: ${role}`));
        }

        fetch(sidebarPath)
            .then(response => {
                if (!response.ok) throw new Error(`Error ${response.status} al cargar ${sidebarPath}`);
                return response.text();
            })
            .then(html => {
                sidebarContainer.innerHTML = html;

                // --- INICIO DE LA NUEVA SOLUCIÓN ---
                // No dependemos de objetos globales. Asignamos los eventos nosotros mismos.

                // 1. Reactivar el Sidebar (menú hamburguesa)
                const burgerBtn = document.querySelector('.burger-btn');
                const sidebarHideBtn = document.querySelector('.sidebar-hide');
                if (burgerBtn) {
                    burgerBtn.addEventListener('click', () => sidebarContainer.classList.toggle('active'));
                }
                if(sidebarHideBtn) {
                    sidebarHideBtn.addEventListener('click', () => sidebarContainer.classList.toggle('active'));
                }
                
                // 2. Reactivar el Tema Oscuro
                const themeTogglers = document.querySelectorAll('#toggle-dark');
                const storedTheme = localStorage.getItem('theme') || (window.matchMedia("(prefers-color-scheme: dark)").matches ? 'dark' : 'light');

                themeTogglers.forEach(toggler => {
                    if (toggler) {
                        toggler.checked = storedTheme === 'dark';
                        toggler.addEventListener('input', (e) => {
                            const newTheme = e.target.checked ? 'dark' : 'light';
                            document.documentElement.setAttribute('data-bs-theme', newTheme);
                            localStorage.setItem('theme', newTheme);
                        });
                    }
                });

                // 3. Funciones personalizadas
                setActiveMenuItem();
                initializeLogoutButtons();
                // --- FIN DE LA NUEVA SOLUCIÓN ---
                
                resolve();
            })
            .catch(error => reject(error));
    });
}

// --- RESTO DEL CÓDIGO (SIN CAMBIOS) ---
function populateProfileData(name, role) {
    const profileNameEl = document.getElementById('profile-name');
    const profileRoleEl = document.getElementById('profile-role');
    const greetingNameEl = document.getElementById('profile-greeting-name');
    if (profileNameEl) profileNameEl.textContent = name;
    if (profileRoleEl) profileRoleEl.textContent = role;
    if (greetingNameEl) greetingNameEl.textContent = name.split(' ')[0];
}

function setActiveMenuItem() {
    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('#sidebar .sidebar-link').forEach(link => {
        const linkPage = link.getAttribute('href').split('/').pop();
        if (currentPage === linkPage) {
            link.parentElement.classList.add('active');
        }
    });
}

function initializeLogoutButtons() {
    const logoutAction = (event) => {
        event.preventDefault();
        localStorage.clear();
        window.location.href = '../index.html';
    };
    document.querySelectorAll('#logout-btn, #logout-btn-sidebar').forEach(btn => {
        btn.addEventListener('click', logoutAction);
    });
}

function runPageSpecificLogic() {
    const url = window.location.href;
    if (url.includes('admin_dashboard.html')) loadAdminDashboard();
    else if (url.includes('asesor_dashboard.html')) loadAsesorDashboard();
    else if (url.includes('vendedor_dashboard.html')) loadVendedorDashboard();
    else if (url.includes('gestion_clientes.html')) loadGestionClientes();
}

function controlElementVisibility(role) {
    const url = window.location.href;
    if (url.includes('gestion_clientes.html')) {
        const addClientButton = document.querySelector('[data-bs-target="#addClientModal"]');
        if (addClientButton && role !== 'Administrador' && role !== 'Asesor') {
            addClientButton.style.display = 'none';
        }
    }
}

// ... (El resto de tus funciones como buildComparisonTable, loadAdminDashboard, etc. van aquí sin cambios) ...
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
    //
}
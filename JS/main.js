/**
 * =================================================================================
 * CS ENSIGNA - main.js (Versión Corregida - Solo para páginas autenticadas)
 * ---------------------------------------------------------------------------------
 * Lógica centralizada de la aplicación.
 * ESTRATEGIA:
 * 1. El login se maneja completamente por PHP (login.php)
 * 2. Este script solo se ejecuta en páginas autenticadas para:
 *    - Ocultar los enlaces del menú que no corresponden al rol del usuario.
 *    - Poblar los datos del perfil y ejecutar la lógica específica de cada página.
 * =================================================================================
 */

// --- ORQUESTADOR PARA PÁGINAS AUTENTICADAS ---
document.addEventListener('DOMContentLoaded', function() {
    // Solo inicializamos si NO estamos en la página de login
    const isLoginPage = window.location.pathname.includes('index.html') || 
                       window.location.pathname.endsWith('/') || 
                       window.location.pathname.includes('login.php');
    
    if (!isLoginPage) {
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

// --- LÓGICA DE VISIBILIDAD DEL MENÚ ---

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

// --- OTRAS FUNCIONES AUXILIARES ---

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
    else if (url.includes('gestion_usuarios.html')) loadGestionUsuarios();
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

// --- IMPLEMENTACIÓN DE LÓGICA DE PÁGINAS ---

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

// Dashboard del administrador: empleados conectados recientemente (por ultimo_login)
function loadAdminDashboard() {
    console.log('Cargando dashboard de administrador...');
    const userTableBody = document.getElementById('user-table-body');
    if (!userTableBody) {
        console.error('No se encontró el elemento user-table-body');
        return;
    }

    // Mostrar mensaje de carga
    userTableBody.innerHTML = '<tr><td colspan="5" class="text-center">Cargando usuarios...</td></tr>';

    fetch('../usuarios_api.php')
        .then(res => {
            console.log('Respuesta del servidor:', res.status);
            return res.json();
        })
        .then(users => {
            console.log('Usuarios recibidos:', users);
            userTableBody.innerHTML = '';
            
            if (!users || users.length === 0) {
                userTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-muted">No hay usuarios registrados</td></tr>';
                return;
            }

            users.forEach(user => {
                const estadoBadge = user.estado === 'activo' ? 
                    '<span class="badge bg-success">Activo</span>' : 
                    '<span class="badge bg-secondary">Inactivo</span>';
                
                const lastLogin = user.ultimo_login ? 
                    new Date(user.ultimo_login).toLocaleString() : 
                    'Nunca';

                userTableBody.innerHTML += `
                    <tr data-user-id="${user.id}">
                        <td>${user.id}</td>
                        <td>${user.nombre}</td>
                        <td>${user.correo}</td>
                        <td><span class="badge bg-primary">${user.rol}</span></td>
                        <td>
                            <button class="btn btn-sm btn-info btn-editar" title="Editar usuario">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm ${user.estado === 'activo' ? 'btn-warning' : 'btn-success'} btn-desactivar ms-1" 
                                    title="${user.estado === 'activo' ? 'Desactivar' : 'Activar'} usuario">
                                <i class="bi bi-${user.estado === 'activo' ? 'pause' : 'play'}"></i>
                                ${user.estado === 'activo' ? 'Desactivar' : 'Activar'}
                            </button>
                        </td>
                    </tr>`;
            });

            // Asignar eventos a los botones
            userTableBody.querySelectorAll('.btn-desactivar').forEach(btn => {
                btn.addEventListener('click', function() {
                    const tr = this.closest('tr');
                    const userId = tr.getAttribute('data-user-id');
                    const currentText = this.textContent.trim();
                    const newEstado = currentText === 'Desactivar' ? 'inactivo' : 'activo';
                    const actionText = newEstado === 'inactivo' ? 'desactivar' : 'activar';
                    
                    if (confirm(`¿Seguro que deseas ${actionText} este usuario?`)) {
                        // Deshabilitar el botón mientras se procesa
                        this.disabled = true;
                        this.innerHTML = '<i class="bi bi-hourglass-split"></i> Procesando...';
                        
                        fetch('../usuarios_api.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'update_estado', id: userId, estado: newEstado })
                        })
                        .then(res => res.json())
                        .then(resp => {
                            if (resp.success) {
                                loadAdminDashboard(); // Recargar la tabla
                            } else {
                                alert('Error al cambiar el estado del usuario');
                                this.disabled = false;
                                this.innerHTML = `<i class="bi bi-${newEstado === 'activo' ? 'pause' : 'play'}"></i> ${currentText}`;
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            alert('Error de conexión');
                            this.disabled = false;
                            this.innerHTML = `<i class="bi bi-${newEstado === 'activo' ? 'pause' : 'play'}"></i> ${currentText}`;
                        });
                    }
                });
            });

            userTableBody.querySelectorAll('.btn-editar').forEach(btn => {
                btn.addEventListener('click', function() {
                    const tr = this.closest('tr');
                    const userId = tr.getAttribute('data-user-id');
                    alert('Funcionalidad de edición pendiente para el usuario ID: ' + userId);
                });
            });
        })
        .catch(error => {
            console.error('Error al cargar usuarios:', error);
            userTableBody.innerHTML = '<tr><td colspan="5" class="text-center text-danger">Error al cargar los usuarios</td></tr>';
        });
}

// Gestión de usuarios: todos los usuarios ordenados alfabéticamente
function loadGestionUsuarios() {
    console.log('Cargando gestión de usuarios...');
    const userTableBody = document.getElementById('all-users-table');
    if (!userTableBody) {
        console.error('No se encontró el elemento all-users-table');
        return;
    }

    // Mostrar mensaje de carga
    userTableBody.innerHTML = '<tr><td colspan="7" class="text-center">Cargando usuarios...</td></tr>';

    fetch('../usuarios_api.php?all=1')
        .then(res => {
            console.log('Respuesta del servidor:', res.status);
            return res.json();
        })
        .then(users => {
            console.log('Usuarios recibidos:', users);
            // Ordenar alfabéticamente por nombre
            users.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
            userTableBody.innerHTML = '';
            
            if (!users || users.length === 0) {
                userTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No hay usuarios registrados</td></tr>';
                return;
            }

            users.forEach(user => {
                const estadoBadge = user.estado === 'activo' ? 
                    '<span class="badge bg-success">Activo</span>' : 
                    '<span class="badge bg-secondary">Inactivo</span>';
                
                userTableBody.innerHTML += `
                    <tr data-user-id="${user.id}">
                        <td>${user.id}</td>
                        <td>${user.nombre}</td>
                        <td>${user.cedula || 'N/A'}</td>
                        <td>${user.correo}</td>
                        <td><span class="badge bg-primary">${user.rol}</span></td>
                        <td>${estadoBadge}</td>
                        <td>
                            <button class="btn btn-sm btn-info btn-editar" title="Editar usuario">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm ${user.estado === 'activo' ? 'btn-warning' : 'btn-success'} btn-desactivar ms-1" 
                                    title="${user.estado === 'activo' ? 'Desactivar' : 'Activar'} usuario">
                                <i class="bi bi-${user.estado === 'activo' ? 'pause' : 'play'}"></i>
                                ${user.estado === 'activo' ? 'Desactivar' : 'Activar'}
                            </button>
                        </td>
                    </tr>`;
            });

            // Asignar eventos a los botones
            userTableBody.querySelectorAll('.btn-desactivar').forEach(btn => {
                btn.addEventListener('click', function() {
                    const tr = this.closest('tr');
                    const userId = tr.getAttribute('data-user-id');
                    const currentText = this.textContent.trim();
                    const newEstado = currentText === 'Desactivar' ? 'inactivo' : 'activo';
                    const actionText = newEstado === 'inactivo' ? 'desactivar' : 'activar';
                    
                    if (confirm(`¿Seguro que deseas ${actionText} este usuario?`)) {
                        // Deshabilitar el botón mientras se procesa
                        this.disabled = true;
                        this.innerHTML = '<i class="bi bi-hourglass-split"></i> Procesando...';
                        
                        fetch('../usuarios_api.php', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ action: 'update_estado', id: userId, estado: newEstado })
                        })
                        .then(res => res.json())
                        .then(resp => {
                            if (resp.success) {
                                loadGestionUsuarios(); // Recargar la tabla
                            } else {
                                alert('Error al cambiar el estado del usuario');
                                this.disabled = false;
                                this.innerHTML = `<i class="bi bi-${newEstado === 'activo' ? 'pause' : 'play'}"></i> ${currentText}`;
                            }
                        })
                        .catch(error => {
                            console.error('Error:', error);
                            alert('Error de conexión');
                            this.disabled = false;
                            this.innerHTML = `<i class="bi bi-${newEstado === 'activo' ? 'pause' : 'play'}"></i> ${currentText}`;
                        });
                    }
                });
            });

            userTableBody.querySelectorAll('.btn-editar').forEach(btn => {
                btn.addEventListener('click', function() {
                    const tr = this.closest('tr');
                    const userId = tr.getAttribute('data-user-id');
                    alert('Funcionalidad de edición pendiente para el usuario ID: ' + userId);
                });
            });
        })
        .catch(error => {
            console.error('Error al cargar usuarios:', error);
            userTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error al cargar los usuarios</td></tr>';
        });
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
    console.log('Página de gestión de clientes cargada');
    // Aquí iría la lógica futura para la página de gestión de clientes.
}
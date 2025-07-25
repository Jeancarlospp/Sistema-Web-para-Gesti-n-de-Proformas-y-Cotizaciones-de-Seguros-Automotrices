// --- Lógica para el formulario de login en index.html ---
if (document.getElementById('login-form')) {
    document.getElementById('login-form').addEventListener('submit', function(event) {
        event.preventDefault();
        const username = document.getElementById('username').value.trim().toLowerCase();
        if (username === 'admin') {
            window.location.href = 'html/admin_dashboard.html';
        } else if (username === 'asesor') {
            window.location.href = 'html/asesor_dashboard.html';
        } else if (username === 'vendedor') {
            window.location.href = 'html/vendedor_dashboard.html';
        } else {
            alert('Usuario no válido. Por favor, intente con "admin", "asesor" o "vendedor".');
        }
    });
}

// --- DATOS Y LÓGICA COMÚN PARA COMPARATIVAS ---
const mockInsuranceData = {
    basico: { name: 'Plan Básico', price: 50, features: { responsabilidadCivil: 'Hasta $20,000', roboTotal: true, asistenciaVial: 'Básica', colision: null, autoReemplazo: null } },
    intermedio: { name: 'Plan Intermedio', price: 85, features: { responsabilidadCivil: 'Hasta $50,000', roboTotal: true, asistenciaVial: 'Completa 24/7', colision: 'Deducible 5%', autoReemplazo: null } },
    completo: { name: 'Plan Completo', price: 120, features: { responsabilidadCivil: 'Hasta $100,000', roboTotal: true, asistenciaVial: 'VIP Ilimitada', colision: 'Sin Deducible', autoReemplazo: 'Hasta 15 días' } }
};

const featureLabels = {
    responsabilidadCivil: 'Responsabilidad Civil',
    roboTotal: 'Robo Total',
    asistenciaVial: 'Asistencia Vial',
    colision: 'Daños por Colisión',
    autoReemplazo: 'Auto de Reemplazo'
};

// Función genérica para crear la tabla de comparación
function buildComparisonTable(selectedPlans, tableHead, tableBody, tableFoot) {
    // Limpiar tablas anteriores
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';
    tableFoot.innerHTML = '';
    
    // --- Construir Encabezado ---
    let headRow = '<tr><th>Cobertura</th>';
    selectedPlans.forEach(planKey => {
        headRow += `<th><h5>${mockInsuranceData[planKey].name}</h5></th>`;
    });
    headRow += '</tr>';
    tableHead.innerHTML = headRow;

    // --- Construir Cuerpo ---
    Object.keys(featureLabels).forEach(featureKey => {
        let bodyRow = `<tr><td><strong>${featureLabels[featureKey]}</strong></td>`;
        selectedPlans.forEach(planKey => {
            const featureValue = mockInsuranceData[planKey].features[featureKey];
            if (featureValue) {
                bodyRow += `<td><i class="bi bi-check-circle-fill text-success fs-4"></i><br><small>${featureValue === true ? '' : featureValue}</small></td>`;
            } else {
                bodyRow += `<td><i class="bi bi-x-circle-fill text-danger fs-4"></i></td>`;
            }
        });
        bodyRow += '</tr>';
        tableBody.innerHTML += bodyRow;
    });

    // --- Construir Pie ---
    let footRow = '<tr class="table-light"><td><strong>Precio Mensual</strong></td>';
    selectedPlans.forEach(planKey => {
        footRow += `<td><h4>$${mockInsuranceData[planKey].price}</h4></td>`;
    });
    footRow += '</tr>';
    tableFoot.innerHTML = footRow;
}


// --- Lógica para el Panel de Administrador ---
function loadAdminDashboard() {
    const mockUsers = [
        { id: 1, name: 'Andrade Lucio Danna Valentina', email: 'daandrade9@espe.edu.ec', role: 'Diseñador' },
        { id: 2, name: 'Santi Cruz Jeancarlo Javier', email: 'jjsanti@espe.edu.ec', role: 'Programador' },
        { id: 3, name: 'Llumiquinga Ñacato Ariel Jose', email: 'ajllumiquinga2@espe.edu.ec', role: 'Analista' },
        { id: 4, name: 'Manangón Vinueza Zaith Alejandro', email: 'zamanangon@espe.edu.ec', role: 'Programador' }
    ];
    const userTableBody = document.getElementById('user-table-body');
    if (userTableBody) {
        userTableBody.innerHTML = '';
        mockUsers.forEach(user => {
            let row = `<tr><td>${user.id}</td><td>${user.name}</td><td>${user.email}</td><td><span class="badge bg-success">${user.role}</span></td><td><button class="btn btn-sm btn-info">Editar</button><button class="btn btn-sm btn-danger">Desactivar</button></td></tr>`;
            userTableBody.innerHTML += row;
        });
    }
}

// --- Lógica para el Panel del Asesor ---
function loadAsesorDashboard() {
    const quoteForm = document.getElementById('quote-form');
    if (!quoteForm) return;

    quoteForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const selectedPlans = Array.from(quoteForm.querySelectorAll('input[type=checkbox]:checked')).map(cb => cb.value);
        if (selectedPlans.length === 0) {
            alert('Por favor, seleccione al menos un plan para comparar.');
            return;
        }

        const comparisonArea = document.getElementById('comparison-area');
        buildComparisonTable(
            selectedPlans,
            document.getElementById('comparison-table-head'),
            document.getElementById('comparison-table-body'),
            document.getElementById('comparison-table-foot')
        );

        document.getElementById('client-name-display').textContent = document.getElementById('client-name').value;
        comparisonArea.style.display = 'block';
        comparisonArea.scrollIntoView({ behavior: 'smooth' });
    });

    document.getElementById('generate-pdf-btn').addEventListener('click', function() {
        const clientName = document.getElementById('client-name-display').textContent;
        alert(`Simulación: Generando PDF con la comparativa para ${clientName}...`);
    });
}

// --- Lógica para el Panel del Vendedor ---
function loadVendedorDashboard() {
    const quoteForm = document.getElementById('quick-quote-form');
    if (!quoteForm) return;

    quoteForm.addEventListener('submit', function(event) {
        event.preventDefault();
        const selectedPlans = Array.from(quoteForm.querySelectorAll('input[type=checkbox]:checked')).map(cb => cb.value);
        if (selectedPlans.length === 0) {
            alert('Por favor, seleccione al menos un paquete para comparar.');
            return;
        }
        
        const comparisonArea = document.getElementById('vendedor-comparison-area');
        buildComparisonTable(
            selectedPlans,
            document.getElementById('vendedor-comparison-head'),
            document.getElementById('vendedor-comparison-body'),
            document.getElementById('vendedor-comparison-foot')
        );
        
        comparisonArea.style.display = 'block';
        comparisonArea.scrollIntoView({ behavior: 'smooth' });
    });

    document.getElementById('vendedor-generate-pdf-btn').addEventListener('click', function() {
        const clientName = document.getElementById('vendedor-client-name').value;
        alert(`Simulación: Generando PDF rápido para ${clientName || 'el cliente'}...`);
    });
}


// --- EJECUTOR PRINCIPAL ---
document.addEventListener('DOMContentLoaded', function() {
    const url = window.location.href;
    if (url.includes('admin_dashboard')) {
        loadAdminDashboard();
    } else if (url.includes('asesor_dashboard')) {
        loadAsesorDashboard();
    } else if (url.includes('vendedor_dashboard')) {
        loadVendedorDashboard();
    }
});
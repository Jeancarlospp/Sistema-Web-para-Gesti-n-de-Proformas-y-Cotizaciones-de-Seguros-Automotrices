/**
 * js/reportesAuditoria.js
 * Lógica para la página de Reportes y Auditoría.
 */

// --- FUNCIÓN PARA RENDERIZAR LA TABLA DE AUDITORÍA ---
function renderAuditLogTable(logs, tableBody) {
    tableBody.innerHTML = '';

    if (!logs || logs.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay registros de auditoría.</td></tr>';
        return;
    }

    logs.forEach(log => {
        let resultadoBadge = '';
        switch (log.resultado) {
            case 'EXITOSO': resultadoBadge = '<span class="badge bg-success">Exitoso</span>'; break;
            case 'FALLIDO': resultadoBadge = '<span class="badge bg-warning">Fallido</span>'; break;
            case 'ERROR':   resultadoBadge = '<span class="badge bg-danger">Error</span>'; break;
            default:        resultadoBadge = `<span class="badge bg-secondary">${log.resultado}</span>`;
        }

        const row = document.createElement('tr');
        // Usamos los nombres de columna de tu tabla `auditoria_accesos`
        row.innerHTML = `
            <td>${log.id_auditoria}</td>
            <td>${log.id_usuario || 'Sistema'}</td>
            <td>${log.tipo_evento}</td>
            <td>${log.modulo || 'N/A'}</td>
            <td>${resultadoBadge}</td>
            <td>${new Date(log.fecha_evento).toLocaleString('es-ES')}</td>
        `;
        tableBody.appendChild(row);
    });
}

// --- FUNCIÓN PARA CARGAR LOS LOGS DE AUDITORÍA DESDE LA API ---
async function fetchAndRenderAuditLogs() {
    const tableBody = document.getElementById('audit-log-table-body');
    if (!tableBody) return;

    try {
        // En el futuro, crearás `auditoria_api.php`
        const response = await fetch('../php/auditoria_api.php');
        if (!response.ok) throw new Error('La respuesta de la red no fue correcta.');
        
        const logs = await response.json();
        renderAuditLogTable(logs, tableBody);
    } catch (error) {
        console.error('Error al cargar los logs de auditoría:', error);
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error al cargar los registros.</td></tr>';
    }
}

// --- FUNCIÓN PRINCIPAL EXPORTADA ---
export function loadReportesAuditoria() {
    console.log("Módulo de Reportes y Auditoría cargado.");

    const reportForm = document.getElementById('report-generator-form');
    const reportResultsContainer = document.getElementById('report-results-container');

    // 1. Cargar la tabla de auditoría al iniciar la página
    fetchAndRenderAuditLogs();

    // 2. Manejar el envío del formulario de generación de reportes
    reportForm.addEventListener('submit', (event) => {
        event.preventDefault(); // Evitar que la página se recargue

        const reportType = document.getElementById('reportType').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        // Simulación de la generación de un reporte
        reportResultsContainer.innerHTML = `
            <div class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Generando reporte de tipo "<strong>${reportType}</strong>" desde <strong>${startDate || 'el inicio'}</strong> hasta <strong>${endDate || 'hoy'}</strong>...</p>
            </div>
        `;
        
        // Aquí iría la lógica de fetch a una API de reportes.
        // Por ahora, solo mostramos un mensaje después de un tiempo.
        setTimeout(() => {
            reportResultsContainer.innerHTML = `
                <div class="alert alert-info">
                    <strong>Reporte Generado (Simulación)</strong><br>
                    Tipo: ${reportType}<br>
                    Rango de Fechas: ${startDate || 'N/A'} a ${endDate || 'N/A'}<br>
                    <p class="mt-2">Aquí se mostraría una tabla o un gráfico con los datos del reporte.</p>
                </div>
            `;
        }, 1500); // Simula una carga de 1.5 segundos
    });
}
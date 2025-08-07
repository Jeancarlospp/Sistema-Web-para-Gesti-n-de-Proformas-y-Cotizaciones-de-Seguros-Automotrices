/**
 * js/reportesAuditoria.js
 * Lógica para la página de Reportes y Auditoría, adaptada al esquema SQL.
 */

// --- FUNCIÓN PARA RENDERIZAR LA TABLA DE AUDITORÍA ---
function renderAuditLogTable(logs, tableBody) {
  tableBody.innerHTML = "";

  if (!logs || logs.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="7" class="text-center text-muted">No hay registros de auditoría.</td></tr>';
    return;
  }

  logs.forEach((log) => {
    const row = document.createElement("tr");

    // Usamos los nombres de columna EXACTOS de tu tabla `auditoria`
    // Y el nombre del usuario que vendrá del JOIN en la API
    row.innerHTML = `
            <td>${log.idAuditoria}</td>
            <td>${log.nombre_usuario || log.idUsuario}</td>
            <td>${log.Aud_accion}</td>
            <td>${log.Aud_tabla}</td>
            <td>${log.Aud_descripcion}</td>
            <td>${new Date(log.Aud_fecha).toLocaleString("es-ES")}</td>
            <td>${log.Aud_IP}</td>
        `;
    tableBody.appendChild(row);
  });
}

// --- FUNCIÓN PARA CARGAR LOS LOGS DE AUDITORÍA DESDE LA API ---
async function fetchAndRenderAuditLogs() {
  const tableBody = document.getElementById("audit-log-table-body");
  if (!tableBody) return;

  tableBody.innerHTML =
    '<tr><td colspan="7" class="text-center">Cargando registros de auditoría...</td></tr>';
  try {
    const response = await fetch("../php/auditoria_api.php");
    if (!response.ok)
      throw new Error("La respuesta de la red no fue correcta.");

    const logs = await response.json();
    renderAuditLogTable(logs, tableBody);
  } catch (error) {
    console.error("Error al cargar los logs de auditoría:", error);
    tableBody.innerHTML =
      '<tr><td colspan="7" class="text-center text-danger">Error al cargar los registros.</td></tr>';
  }
}

// --- FUNCIÓN PRINCIPAL EXPORTADA ---
export function loadReportesAuditoria() {
  console.log("Módulo de Reportes y Auditoría (sincronizado con SQL) cargado.");

  const reportForm = document.getElementById("report-generator-form");
  const reportResultsContainer = document.getElementById(
    "report-results-container"
  );

  // 1. Cargar la tabla de auditoría al iniciar la página
  fetchAndRenderAuditLogs();

  // 2. Manejar el envío del formulario de generación de reportes (simulado)
  reportForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const reportType = document.getElementById("reportType").value;
    const startDate = document.getElementById("startDate").value;
    const endDate = document.getElementById("endDate").value;

    reportResultsContainer.innerHTML = `
            <div class="text-center">
                <div class="spinner-border text-primary" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Generando reporte de tipo "<strong>${reportType}</strong>" desde <strong>${
      startDate || "el inicio"
    }</strong> hasta <strong>${endDate || "hoy"}</strong>...</p>
            </div>
        `;

    // Simulación: en una aplicación real, aquí harías un fetch a `reportes_api.php`
    setTimeout(() => {
      reportResultsContainer.innerHTML = `
                <div class="alert alert-info">
                    <strong>Reporte Generado (Simulación)</strong><br>
                    Tipo: ${reportType}<br>
                    Rango de Fechas: ${startDate || "N/A"} a ${
        endDate || "N/A"
      }<br>
                    <p class="mt-2">Aquí se mostraría una tabla o un gráfico con los datos del reporte.</p>
                </div>
            `;
    }, 1500);
  });
}

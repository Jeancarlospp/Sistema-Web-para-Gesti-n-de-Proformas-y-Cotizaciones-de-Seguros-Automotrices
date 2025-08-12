/**
 * js/reportesAuditoria.js
 * Lógica para la página de Reportes y Auditoría con paginación, filtros, ordenamiento y exportación a PDF.
 */

// --- ESTADO Y CONFIGURACIÓN ---
let auditState = {
  logs: [],
  currentPage: 1,
  limit: 10,
  totalPages: 1,
  totalRecords: 0,
  search: "",
  action: "",
  startDate: "",
  endDate: "",
  sortBy: "Aud_fecha DESC", // Valor inicial de ordenamiento
};

// --- FUNCIONES AUXILIARES (DEFINIDAS UNA SOLA VEZ) ---

function debounce(func, delay = 500) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

function renderAuditLogTable(logs, tableBody) {
  tableBody.innerHTML = "";
  if (!logs || logs.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="6" class="text-center text-muted py-4">No se encontraron registros con los filtros actuales.</td></tr>';
    return;
  }
  logs.forEach((log) => {
    const row = document.createElement("tr");
    const accionClass = (log.Aud_accion || "").toLowerCase();
    row.innerHTML = `
      <td>${log.idAuditoria}</td>
      <td>${log.nombre_usuario || "Sistema"}</td>
      <td><span class="badge bg-light-${accionClass}">${
      log.Aud_accion
    }</span></td>
      <td>${log.Aud_tabla}</td>
      <td>${log.Aud_descripcion}</td>
  <td>${new Date(log.Aud_fecha).toLocaleString("es-ES")}</td>
    `;
    tableBody.appendChild(row);
  });
}

function renderPaginationControls(controlsContainer) {
  controlsContainer.innerHTML = "";
  const { currentPage, totalPages } = auditState;
  if (totalPages <= 1) return;

  let html = `<ul class="pagination pagination-sm mb-0">`;
  html += `<li class="page-item ${
    currentPage === 1 ? "disabled" : ""
  }"><a class="page-link" href="#" data-page="${
    currentPage - 1
  }">Anterior</a></li>`;

  const pagesToShow = 3;
  let startPage = Math.max(1, currentPage - Math.floor(pagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + pagesToShow - 1);
  if (endPage - startPage + 1 < pagesToShow)
    startPage = Math.max(1, endPage - pagesToShow + 1);

  for (let i = startPage; i <= endPage; i++) {
    html += `<li class="page-item ${
      i === currentPage ? "active" : ""
    }"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
  }

  html += `<li class="page-item ${
    currentPage === totalPages ? "disabled" : ""
  }"><a class="page-link" href="#" data-page="${
    currentPage + 1
  }">Siguiente</a></li>`;
  html += `</ul>`;
  controlsContainer.innerHTML = html;
}

function updatePaginationInfo(infoContainer) {
  const { currentPage, limit, totalRecords } = auditState;
  if (totalRecords === 0) {
    infoContainer.textContent = "No hay registros";
    return;
  }
  const startRecord = (currentPage - 1) * limit + 1;
  const endRecord = Math.min(currentPage * limit, totalRecords);
  infoContainer.textContent = `Mostrando ${startRecord} a ${endRecord} de ${totalRecords}`;
}

function generatePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const tableHeaders = [
    ["ID", "Usuario", "Acción", "Tabla", "Descripción", "Fecha"],
  ];
  const tableBody = auditState.logs.map((log) => [
    log.idAuditoria,
    log.nombre_usuario || "Sistema",
    log.Aud_accion,
    log.Aud_tabla,
    log.Aud_descripcion,
    new Date(log.Aud_fecha).toLocaleString("es-ES"),
  ]);
  doc.setFontSize(18);
  doc.text("Reporte de Auditoría", 14, 22);
  doc.autoTable({
    head: tableHeaders,
    body: tableBody,
    startY: 30,
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185] },
  });
  const fecha = new Date().toLocaleDateString("es-ES").replace(/\//g, "-");
  doc.save(`reporte_auditoria_${fecha}.pdf`);
}

async function fetchAndRenderAuditLogs() {
  const tableBody = document.getElementById("audit-log-table-body");
  const paginationControls = document.getElementById(
    "audit-pagination-controls"
  );
  const paginationInfo = document.getElementById("audit-pagination-info");

  if (!tableBody || !paginationControls) return;

  tableBody.innerHTML =
    '<tr><td colspan="6" class="text-center py-4">Cargando...</td></tr>';
  const params = new URLSearchParams({
    page: auditState.currentPage,
    limit: auditState.limit,
    search: auditState.search,
    action: auditState.action,
    startDate: auditState.startDate,
    endDate: auditState.endDate,
    sortBy: auditState.sortBy,
  });

  try {
    const response = await fetch(
      `../php/auditoria_api.php?${params.toString()}`
    );
    if (!response.ok)
      throw new Error("La respuesta de la red no fue correcta.");
    const result = await response.json();

    auditState = { ...auditState, ...result.pagination, logs: result.data };

    renderAuditLogTable(result.data, tableBody);
    renderPaginationControls(paginationControls);
    updatePaginationInfo(paginationInfo);
  } catch (error) {
    console.error("Error al cargar los logs de auditoría:", error);
    tableBody.innerHTML =
      '<tr><td colspan="6" class="text-center text-danger py-4">Error al cargar los registros.</td></tr>';
  }
}

// --- FUNCIÓN PRINCIPAL EXPORTADA ---
export function loadReportesAuditoria() {
  console.log("Módulo de Reportes y Auditoría cargado.");
  fetchAndRenderAuditLogs();

  const searchInput = document.getElementById("audit-search-input");
  const actionFilter = document.getElementById("audit-action-filter");
  const startDateInput = document.getElementById("audit-start-date");
  const endDateInput = document.getElementById("audit-end-date");
  const limitSelect = document.getElementById("audit-limit-select");
  const sortSelect = document.getElementById("audit-sort-by-select");
  const paginationControls = document.getElementById(
    "audit-pagination-controls"
  );
  const btnReset = document.getElementById("btn-reset-filters");
  const btnPDF = document.getElementById("btn-generate-pdf");

  searchInput.addEventListener(
    "input",
    debounce(() => {
      auditState.search = searchInput.value;
      auditState.currentPage = 1;
      fetchAndRenderAuditLogs();
    })
  );

  [actionFilter, startDateInput, endDateInput, limitSelect, sortSelect].forEach(
    (element) => {
      element.addEventListener("change", () => {
        auditState.action = actionFilter.value;
        auditState.startDate = startDateInput.value;
        auditState.endDate = endDateInput.value;
        auditState.limit = limitSelect.value;
        auditState.sortBy = sortSelect.value;
        auditState.currentPage = 1;
        fetchAndRenderAuditLogs();
      });
    }
  );

  paginationControls.addEventListener("click", (e) => {
    e.preventDefault();
    const target = e.target;
    if (target.tagName === "A" && target.dataset.page) {
      const page = parseInt(target.dataset.page, 10);
      if (page >= 1 && page <= auditState.totalPages) {
        auditState.currentPage = page;
        fetchAndRenderAuditLogs();
      }
    }
  });

  btnReset.addEventListener("click", () => {
    searchInput.value = "";
    actionFilter.value = "";
    startDateInput.value = "";
    endDateInput.value = "";
    limitSelect.value = 10;
    sortSelect.value = "Aud_fecha DESC";

    auditState = {
      ...auditState,
      currentPage: 1,
      search: "",
      action: "",
      startDate: "",
      endDate: "",
      limit: 10,
      sortBy: "Aud_fecha DESC",
    };
    fetchAndRenderAuditLogs();
  });

  btnPDF.addEventListener("click", generatePDF);
}

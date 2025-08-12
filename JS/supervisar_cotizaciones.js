/**
 * js/supervisarCotizaciones.js
 * Lógica completa para supervisar cotizaciones con filtros, paginación, ordenamiento y exportación a PDF.
 */

// --- ESTADO GLOBAL DE LA PÁGINA ---
let quotesState = {
  quotes: [],
  currentPage: 1,
  limit: 10,
  totalPages: 1,
  totalRecords: 0,
  search: "",
  idUsuario: "",
  fecha_inicio: "",
  fecha_fin: "",
  sortBy: "Cot_fechaCreacion DESC", // Orden por defecto
};

// --- FUNCIONES DE UTILIDAD ---

/**
 * Retrasa la ejecución de una función para evitar llamadas excesivas (ej. en un input de búsqueda).
 * @param {Function} func - La función a ejecutar.
 * @param {number} delay - El tiempo de espera en milisegundos.
 * @returns {Function}
 */
function debounce(func, delay = 500) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

// --- FUNCIONES PARA MOSTRAR DETALLES DE COTIZACIÓN ---

/**
 * Muestra los detalles de una cotización en un modal o área expandida
 * @param {number} idCotizacion - ID de la cotización a mostrar
 */
async function showQuoteDetails(idCotizacion) {
  try {
    const response = await fetch(
      `../php/cotizaciones_api.php?id=${idCotizacion}`
    );
    if (!response.ok) throw new Error("Error al cargar los detalles");

    const result = await response.json();
    if (!result.success) throw new Error(result.message);

    const { cotizacion, detalles } = result;

    // Crear contenido HTML para mostrar detalles
    const modalContent = `
      <div class="modal fade" id="quoteDetailsModal" tabindex="-1">
        <div class="modal-dialog modal-lg">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">Detalles de Cotización #${
                cotizacion.idCotizacion
              }</h5>
              <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body">
              <div class="row mb-3">
                <div class="col-md-6">
                  <strong>Cliente:</strong> ${cotizacion.Cli_nombre}<br>
                  <strong>Cédula:</strong> ${cotizacion.Cli_cedula}<br>
                  <strong>Usuario Creador:</strong> ${cotizacion.nombre_usuario}
                </div>
                <div class="col-md-6">
                  <strong>Fecha:</strong> ${new Date(cotizacion.Cot_fechaCreacion).toLocaleDateString('es-ES')}<br>
                  <strong>Monto Total:</strong> ${parseFloat(cotizacion.Cot_montoAsegurable).toLocaleString('es-ES', {minimumFractionDigits: 2})}
                </div>
              </div>
              <hr>
              <h6>Productos Incluidos:</h6>
              <div class="table-responsive">
                <table class="table table-sm">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>Empresa</th>
                      <th>Cantidad</th>
                      <th>Precio Unit.</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${detalles
                      .map(
                        (detalle) => `
                      <tr>
                        <td>${detalle.Pro_nombre}</td>
                        <td>${detalle.Emp_nombre}</td>
                        <td>${detalle.Det_numServicios}</td>
                        <td>${parseFloat(
                          detalle.Det_precioUnitario
                        ).toLocaleString("es-ES", {
                          minimumFractionDigits: 2,
                        })}</td>
                        <td>${parseFloat(detalle.Det_subtotal).toLocaleString(
                          "es-ES",
                          { minimumFractionDigits: 2 }
                        )}</td>
                      </tr>
                    `
                      )
                      .join("")}
                  </tbody>
                </table>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
              <button type="button" class="btn btn-primary" onclick="downloadQuotePDF(${idCotizacion})">
                <i class="bi bi-file-earmark-pdf"></i> Descargar PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    // Eliminar modal anterior si existe
    const existingModal = document.getElementById("quoteDetailsModal");
    if (existingModal) existingModal.remove();

    // Agregar modal al DOM
    document.body.insertAdjacentHTML("beforeend", modalContent);

    // Mostrar modal
    const modal = new bootstrap.Modal(
      document.getElementById("quoteDetailsModal")
    );
    modal.show();
  } catch (error) {
    console.error("Error mostrando detalles:", error);
    alert("Error al cargar los detalles de la cotización: " + error.message);
  }
}

/**
 * Retorna la clase CSS apropiada para el badge del estado
 * @param {string} estado - Estado de la cotización
 * @returns {string}
 */
function getStatusBadgeClass(estado) {
  const statusMap = {
    aceptada: "success",
    enviada: "info",
    rechazada: "danger",
    borrador: "secondary",
    vencida: "warning",
  };
  return statusMap[estado?.toLowerCase()] || "secondary";
}

/**
 * Descarga el PDF de una cotización específica
 * @param {number} idCotizacion - ID de la cotización
 */
async function downloadQuotePDF(idCotizacion) {
  try {
    const response = await fetch(
      `../php/cotizaciones_api.php?id=${idCotizacion}`
    );
    if (!response.ok) throw new Error("Error al cargar los datos");

    const result = await response.json();
    if (!result.success) throw new Error(result.message);

    const { cotizacion, detalles } = result;

    // Verificar que jsPDF esté disponible
    if (
      typeof window.jspdf === "undefined" ||
      typeof window.jspdf.jsPDF === "undefined"
    ) {
      alert(
        "Error: La librería para generar PDF no se ha cargado correctamente."
      );
      return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Título y información general
    doc.setFontSize(18);
    doc.text("Cotización de Seguros", 14, 22);

    doc.setFontSize(12);
    doc.text(`ID Cotización: #${cotizacion.idCotizacion}`, 14, 35);
    doc.text(`Cliente: ${cotizacion.Cli_nombre}`, 14, 42);
    doc.text(`Cédula: ${cotizacion.Cli_cedula}`, 14, 49);
    doc.text(`Fecha: ${new Date(cotizacion.Cot_fechaCreacion).toLocaleDateString('es-ES')}`, 14, 56);
    // Tabla de detalles
// Tabla de detalles rediseñada
const tableHeaders = [['Producto', 'Empresa', 'Precio Mensual', 'Precio Unitario']];
// Filas de productos
const tableBody = detalles.map(detalle => [
  detalle.Pro_nombre,
  detalle.Emp_nombre,
  `${parseFloat(detalle.Pro_precioMensual ?? 0).toFixed(2)}`, // Si el dato no existe, muestra 0.00
  `${parseFloat(detalle.Det_precioUnitario).toFixed(2)}`,
]);
// Calcular suma total
const total = detalles.reduce((acc, d) => acc + parseFloat(d.Det_precioUnitario), 0);
// Agregar fila de total al final
doc.autoTable({
  head: tableHeaders,
  body: tableBody,
  startY: 63,
  theme: 'grid',
  headStyles: { fillColor: [41, 128, 185], textColor: [255, 255, 255] },
  bodyStyles: { valign: 'middle' },
  columnStyles: {
    0: { cellWidth: 50 }, // Producto
    1: { cellWidth: 50 }, // Empresa
    2: { cellWidth: 40, halign: 'right' },  // Precio Mensual
    3: { cellWidth: 40, halign: 'right' }, // Precio Unitario

  }
});
    // Guardar PDF
    const fileName = `cotizacion_${idCotizacion}_${cotizacion.Cli_nombre.replace(
      /\s+/g,
      "_"
    )}.pdf`;
    doc.save(fileName);
  } catch (error) {
    console.error("Error generando PDF:", error);
    alert("Error al generar el PDF: " + error.message);
  }
}

// --- FUNCIONES DE RENDERIZADO (MANEJO DEL DOM) ---

/**
 * Dibuja las filas en la tabla de cotizaciones.
 * @param {Array} quotes - La lista de cotizaciones a mostrar.
 * @param {HTMLElement} tableBody - El elemento <tbody> de la tabla.
 */
function renderQuotesTable(quotes, tableBody) {
  tableBody.innerHTML = "";
  if (!quotes || quotes.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="6" class="text-center text-muted py-4">No se encontraron cotizaciones con los filtros aplicados.</td></tr>';
    return;
  }
  

  quotes.forEach((quote) => {
    const estado = (quote.Cot_estado || "").toLowerCase();
    let estadoBadge;
    switch (estado) {
      case "aceptada":
        estadoBadge = `<span class="badge bg-success">Aceptada</span>`;
        break;
      case "enviada":
        estadoBadge = `<span class="badge bg-info">Enviada</span>`;
        break;
      case "rechazada":
        estadoBadge = `<span class="badge bg-danger">Rechazada</span>`;
        break;
      case "borrador":
        estadoBadge = `<span class="badge bg-secondary">Borrador</span>`;
        break;
      case "vencida":
        estadoBadge = `<span class="badge bg-warning">Vencida</span>`;
        break;
      default:
        estadoBadge = `<span class="badge bg-secondary">${estado}</span>`;
    }

    const row = document.createElement("tr");
    row.innerHTML = `
            <td>#${quote.idCotizacion}</td>
            <td><strong>${quote.Cli_nombre || "N/A"}</strong></td>
            <td>${quote.nombre_usuario || "N/A"}</td>
            <td>${parseFloat(quote.Cot_montoAsegurable).toLocaleString(
              "es-ES",
              { minimumFractionDigits: 2 }
            )}</td>
            
            <td>${new Date(quote.Cot_fechaCreacion).toLocaleDateString(
              "es-ES"
            )}</td>
            <td>
                <button class="btn btn-sm btn-info view-details-btn" data-id="${
                  quote.idCotizacion
                }" title="Ver Detalles"><i class="bi bi-eye"></i></button>
                <button class="btn btn-sm btn-secondary ms-1 download-pdf-btn" data-id="${
                  quote.idCotizacion
                }" title="Descargar PDF"><i class="bi bi-file-earmark-pdf"></i></button>
            </td>
        `;
    tableBody.appendChild(row);
  });

  // Agregar event listeners a los botones de acción
  document.querySelectorAll(".view-details-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const idCotizacion = parseInt(e.currentTarget.dataset.id);
      showQuoteDetails(idCotizacion);
    });
  });

  document.querySelectorAll(".download-pdf-btn").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      const idCotizacion = parseInt(e.currentTarget.dataset.id);
      downloadQuotePDF(idCotizacion);
    });
  });
}

/**
 * Dibuja los botones de control de paginación.
 * @param {HTMLElement} container - El elemento <nav> que contendrá los botones.
 */
function renderPaginationControls(container) {
  container.innerHTML = "";
  const { currentPage, totalPages } = quotesState;
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
  if (endPage - startPage + 1 < pagesToShow) {
    startPage = Math.max(1, endPage - pagesToShow + 1);
  }

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
  container.innerHTML = html;
}

/**
 * Actualiza el texto informativo de la paginación (ej. "Mostrando 1-10 de 50").
 * @param {HTMLElement} container - El elemento <span> que mostrará la información.
 */
function updatePaginationInfo(container) {
  const { currentPage, limit, totalRecords } = quotesState;
  if (totalRecords === 0) {
    container.textContent = "No hay resultados";
    return;
  }
  const start = (currentPage - 1) * limit + 1;
  const end = Math.min(currentPage * limit, totalRecords);
  container.textContent = `Mostrando ${start}-${end} de ${totalRecords}`;
}

// --- LÓGICA DE DATOS (COMUNICACIÓN CON API) ---

/**
 * Realiza la petición a la API para obtener y luego renderizar las cotizaciones.
 */
async function fetchAndRenderQuotes() {
  const tableBody = document.getElementById("quotes-table-body");
  const paginationControls = document.getElementById(
    "quote-pagination-controls"
  );
  const paginationInfo = document.getElementById("quote-pagination-info");

  if (!tableBody || !paginationControls || !paginationInfo) return;

  tableBody.innerHTML =
    '<tr><td colspan="7" class="text-center py-4">Cargando...</td></tr>';

  const params = new URLSearchParams({
    page: quotesState.currentPage,
    limit: quotesState.limit,
    search: quotesState.search,
    idUsuario: quotesState.idUsuario,
    fecha_inicio: quotesState.fecha_inicio,
    fecha_fin: quotesState.fecha_fin,
    sortBy: quotesState.sortBy,
  });

  try {
    const response = await fetch(
      `../php/cotizaciones_api.php?${params.toString()}`
    );
    if (!response.ok)
      throw new Error(`Error en la red: ${response.statusText}`);

    const result = await response.json();

    // Actualizar el estado global con la nueva información de la API
    quotesState = { ...quotesState, ...result.pagination, quotes: result.data };

    // Volver a dibujar la interfaz con los nuevos datos
    renderQuotesTable(result.data, tableBody);
    renderPaginationControls(paginationControls);
    updatePaginationInfo(paginationInfo);
  } catch (error) {
    console.error("Error al cargar las cotizaciones:", error);
    tableBody.innerHTML =
      '<tr><td colspan="7" class="text-center text-danger py-4">Error al cargar los datos.</td></tr>';
  }
}

/**
 * Obtiene la lista de usuarios desde la API y la añade al filtro de selección.
 */
async function populateUserFilter() {
  const userFilterSelect = document.getElementById("filter-user");
  if (!userFilterSelect) return;
  try {
    const response = await fetch("../php/usuarios_api.php?limit=500");
    if (!response.ok)
      throw new Error("ERROR CAMBIO DE PRUEBA - usuarios no disponibles.");

    const result = await response.json();
    if (result && result.data) {
      result.data.forEach((user) => {
        const option = document.createElement("option");
        option.value = user.id_usuario;
        option.textContent = `${user.nombre} (${user.rol})`;
        userFilterSelect.appendChild(option);
      });
    }
  } catch (error) {
    console.error("Error poblando el filtro de usuarios:", error);
  }
}

// --- FUNCIONES DE ACCIONES DE USUARIO ---

/**
 * Genera un PDF con los datos de las cotizaciones actualmente visibles.
 */
function generatePDF() {
  if (
    typeof window.jspdf === "undefined" ||
    typeof window.jspdf.jsPDF === "undefined"
  ) {
    alert(
      "Error: La librería para generar PDF no se ha cargado correctamente."
    );
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const tableHeaders = [
    [
      "ID",
      "Cliente",
      "Usuario Creador",
      "Monto ($)",
      "Estado",
      "Fecha Creación",
    ],
  ];
  const tableBody = quotesState.quotes.map((q) => [
    q.idCotizacion,
    q.Cli_nombre,
    q.nombre_usuario,
    parseFloat(q.Cot_montoAsegurable).toFixed(2),
    q.Cot_estado,
    new Date(q.Cot_fechaCreacion).toLocaleDateString("es-ES"),
  ]);

  doc.setFontSize(18);
  doc.text("Reporte de Cotizaciones", 14, 22);
  doc.setFontSize(10);
  doc.text(`Generado el: ${new Date().toLocaleDateString("es-ES")}`, 14, 30);
  doc.text(`Total de registros: ${quotesState.totalRecords}`, 14, 36);

  doc.autoTable({
    head: tableHeaders,
    body: tableBody,
    startY: 45,
    theme: "grid",
    headStyles: { fillColor: [22, 160, 133] }, // Color verde azulado
    didDrawPage: (data) => {
      // Añadir pie de página
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(10);
      doc.text(
        `Página ${data.pageNumber} de ${pageCount}`,
        data.settings.margin.left,
        doc.internal.pageSize.height - 10
      );
    },
  });

  const fecha = new Date().toISOString().split("T")[0];
  doc.save(`reporte_cotizaciones_${fecha}.pdf`);
}

// --- FUNCIÓN PRINCIPAL EXPORTADA ---

/**
 * Inicializa la lógica de la página de Supervisar Cotizaciones.
 */
export function loadSupervisarCotizaciones() {
  console.log("Módulo de Supervisar Cotizaciones cargado.");

  // Cargas iniciales
  populateUserFilter();
  fetchAndRenderQuotes();

  // Selectores de elementos del DOM
  const searchInput = document.getElementById("quote-search-input");
  const userFilter = document.getElementById("filter-user");
  const startDate = document.getElementById("filter-start-date");
  const endDate = document.getElementById("filter-end-date");
  const limitSelect = document.getElementById("quote-limit-select");
  const sortSelect = document.getElementById("quote-sort-by-select");
  const paginationControls = document.getElementById(
    "quote-pagination-controls"
  );
  const btnReset = document.getElementById("btn-reset-filters");
  const btnPDF = document.getElementById("btn-generate-pdf");

  // Asignación de Event Listeners a todos los filtros
  if (searchInput) {
    searchInput.addEventListener(
      "input",
      debounce(() => {
        quotesState.search = searchInput.value;
        quotesState.currentPage = 1;
        fetchAndRenderQuotes();
      })
    );
  }

  [userFilter, startDate, endDate, limitSelect, sortSelect].forEach((el) => {
    if (el) {
      el.addEventListener("change", () => {
        if (userFilter) quotesState.idUsuario = userFilter.value;
        if (startDate) quotesState.fecha_inicio = startDate.value;
        if (endDate) quotesState.fecha_fin = endDate.value;
        if (limitSelect) quotesState.limit = limitSelect.value;
        if (sortSelect) quotesState.sortBy = sortSelect.value;
        quotesState.currentPage = 1;
        fetchAndRenderQuotes();
      });
    }
  });

  // Event listener para los botones de paginación
  if (paginationControls) {
    paginationControls.addEventListener("click", (e) => {
      e.preventDefault();
      if (e.target.tagName === "A" && e.target.dataset.page) {
        const page = parseInt(e.target.dataset.page, 10);
        if (
          page !== quotesState.currentPage &&
          page > 0 &&
          page <= quotesState.totalPages
        ) {
          quotesState.currentPage = page;
          fetchAndRenderQuotes();
        }
      }
    });
  }

  // Event listener para el botón de limpiar filtros
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      // Limpiar los inputs del formulario
      if (searchInput) searchInput.value = "";
      if (userFilter) userFilter.value = "";
      if (startDate) startDate.value = "";
      if (endDate) endDate.value = "";
      if (limitSelect) limitSelect.value = 10;
      if (sortSelect) sortSelect.value = "Cot_fechaCreacion DESC";

      // Resetear el estado y recargar los datos
      quotesState = {
        ...quotesState,
        currentPage: 1,
        search: "",
        idUsuario: "",
        fecha_inicio: "",
        fecha_fin: "",
        limit: 10,
        sortBy: "Cot_fechaCreacion DESC",
      };
      fetchAndRenderQuotes();
    });
  }

  // Event listener para el botón de generar PDF
  if (btnPDF) {
    btnPDF.addEventListener("click", generatePDF);
  }

  // Hacer las funciones disponibles globalmente para uso en modales
  window.showQuoteDetails = showQuoteDetails;
  window.downloadQuotePDF = downloadQuotePDF;
}

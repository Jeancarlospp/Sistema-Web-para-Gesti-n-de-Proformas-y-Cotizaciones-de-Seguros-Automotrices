/**
 * =================================================================================
 * js/mis_cotizaciones.js
 * Lógica para la página "Mis Cotizaciones" con filtros, paginación y exportación a PDF.
 * (Versión sin manejo de estado de cotización)
 * =================================================================================
 */

// --- ESTADO GLOBAL DE LA VISTA ---
let viewState = {
  currentPage: 1,
  limit: 10,
  searchTerm: "",
  startDate: "",
  endDate: "",
  sortBy: "Cot_fechaCreacion DESC",
  totalRecords: 0,
  quotesForPDF: [],
};

// --- FUNCIONES DE UTILIDAD ---
function debounce(func, delay = 500) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, delay);
  };
}

// --- FUNCIONES DE RENDERIZADO (MANEJO DEL DOM) ---

/** Dibuja las filas de la tabla con las cotizaciones del usuario. */
function renderMyQuotesTable(quotes, tableBody) {
  tableBody.innerHTML = "";
  if (!quotes || quotes.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">No se encontraron cotizaciones con los filtros actuales.</td></tr>`;
    return;
  }
  quotes.forEach((quote) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>#${quote.idCotizacion}</td>
            <td><strong>${quote.Cli_nombre || "N/A"}</strong></td>
            <td>${new Date(quote.Cot_fechaCreacion).toLocaleDateString(
              "es-ES",
              { year: "numeric", month: "long", day: "numeric" }
            )}</td>
            <td>${quote.Cot_descripcion || ""}</td>
            <td>$${parseFloat(quote.Cot_montoAsegurable).toLocaleString(
              "es-ES",
              { minimumFractionDigits: 2, maximumFractionDigits: 2 }
            )}</td>
            <td class="text-center">
                <div class="btn-group" role="group">
                    <button class="btn btn-sm btn-info btn-view-details" data-id="${
                      quote.idCotizacion
                    }" title="Ver Detalles">
                        <i class="bi bi-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-danger btn-download-pdf" data-id="${
                      quote.idCotizacion
                    }" title="Descargar PDF de la Cotización">
                        <i class="bi bi-file-earmark-pdf"></i>
                    </button>
                </div>
            </td>
        `;
    tableBody.appendChild(row);
  });
}

/** Dibuja los controles de paginación. */
function renderPaginationControls(container) {
  const totalPages = Math.ceil(viewState.totalRecords / viewState.limit);
  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }
  let buttonsHtml = '<ul class="pagination pagination-sm mb-0">';
  buttonsHtml += `<li class="page-item ${
    viewState.currentPage === 1 ? "disabled" : ""
  }"><a class="page-link" href="#" data-page="${
    viewState.currentPage - 1
  }">Anterior</a></li>`;
  for (let i = 1; i <= totalPages; i++) {
    buttonsHtml += `<li class="page-item ${
      viewState.currentPage === i ? "active" : ""
    }"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
  }
  buttonsHtml += `<li class="page-item ${
    viewState.currentPage === totalPages ? "disabled" : ""
  }"><a class="page-link" href="#" data-page="${
    viewState.currentPage + 1
  }">Siguiente</a></li>`;
  buttonsHtml += "</ul>";
  container.innerHTML = buttonsHtml;
}

/** Actualiza el texto informativo de la paginación. */
function updatePaginationInfo(element) {
  if (viewState.totalRecords === 0) {
    element.textContent = "0 cotizaciones encontradas";
    return;
  }
  const start = (viewState.currentPage - 1) * viewState.limit + 1;
  const end = Math.min(start + viewState.limit - 1, viewState.totalRecords);
  element.textContent = `Mostrando ${start} a ${end} de ${viewState.totalRecords} cotizaciones`;
}

// --- LÓGICA DE DATOS Y ACCIONES ---

/** Llama a la API para obtener las cotizaciones del usuario con filtros. */
async function fetchAndRenderMyQuotes() {
  const tableBody = document.getElementById("my-quotes-table-body");
  const controls = document.getElementById("my-quotes-pagination-controls");
  const info = document.getElementById("my-quotes-pagination-info");
  if (!tableBody || !controls || !info) return;

  tableBody.innerHTML = `<tr><td colspan="6" class="text-center py-4"><div class="spinner-border text-primary" role="status"></div></td></tr>`;
  viewState.quotesForPDF = [];

  const params = new URLSearchParams({
    page: viewState.currentPage,
    limit: viewState.limit,
    sortBy: viewState.sortBy,
    search: viewState.searchTerm,
    fecha_inicio: viewState.startDate,
    fecha_fin: viewState.endDate,
    mis_cotizaciones: "1",
  });

  try {
    const response = await fetch(
      `../php/cotizaciones_api.php?${params.toString()}`
    );
    if (!response.ok) throw new Error(`Error de red: ${response.status}`);
    const data = await response.json();

    viewState.quotesForPDF = data.data;
    viewState.totalRecords = data.pagination.totalRecords;

    renderMyQuotesTable(data.data, tableBody);
    renderPaginationControls(controls);
    updatePaginationInfo(info);
  } catch (error) {
    console.error("Error al cargar mis cotizaciones:", error);
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-4">Error al cargar las cotizaciones.</td></tr>`;
  }
}

/** Genera un PDF con la lista de cotizaciones visible. */
function generatePDF() {
  if (viewState.quotesForPDF.length === 0) {
    alert("No hay cotizaciones para exportar.");
    return;
  }
  if (typeof window.jspdf === "undefined") {
    alert("Error: La librería para generar PDF no se ha cargado.");
    return;
  }

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();
  const userName = localStorage.getItem("userName") || "Usuario";

  doc.setFontSize(18);
  doc.text("Reporte de Mis Cotizaciones", 14, 22);
  doc.setFontSize(11);
  doc.setTextColor(100);
  doc.text(`Generado por: ${userName}`, 14, 29);

  const tableHeaders = ["ID", "Cliente", "Fecha", "Descripción", "Monto ($)"];
  const tableBody = viewState.quotesForPDF.map((q) => [
    `#${q.idCotizacion}`,
    q.Cli_nombre,
    new Date(q.Cot_fechaCreacion).toLocaleDateString("es-ES"),
    q.Cot_descripcion,
    parseFloat(q.Cot_montoAsegurable).toLocaleString("es-ES", {
      minimumFractionDigits: 2,
    }),
  ]);

  doc.autoTable({
    head: [tableHeaders],
    body: tableBody,
    startY: 35,
    theme: "grid",
    headStyles: { fillColor: [22, 160, 133] },
    didDrawPage: (data) =>
      doc.text(
        `Página ${data.pageNumber}`,
        data.settings.margin.left,
        doc.internal.pageSize.height - 10
      ),
  });

  doc.save(
    `mis_cotizaciones_${userName.replace(/\s+/g, "_")}_${
      new Date().toISOString().split("T")[0]
    }.pdf`
  );
}

/** Genera un PDF detallado de una única cotización. */
/**
 * Obtiene los datos de una cotización específica desde la API y genera un
 * PDF de comparativa detallado con esa información.
 * @param {number} quoteId - El ID de la cotización a imprimir.
 */
async function generateQuotePDF(quoteId) {
  // --- VERIFICACIÓN INICIAL MÁS ROBUSTA ---
  if (!quoteId) {
    alert("Error: ID de cotización no válido.");
    return;
  }
  // Verificamos que tanto la librería principal como el plugin autotable estén listos.
  // La función del plugin se "engancha" a jsPDF.API.
  if (
    typeof window.jspdf === "undefined" ||
    typeof window.jspdf.jsPDF === "undefined" ||
    typeof window.jspdf.jsPDF.API.autoTable === "undefined"
  ) {
    alert(
      "Error: Las librerías para generar PDF no se han cargado correctamente. Por favor, recargue la página."
    );
    return;
  }

  try {
    // --- 1. OBTENER DATOS DE LA API ---
    console.log(`Iniciando generación de PDF para cotización #${quoteId}...`);

    // La ruta es relativa a la raíz gracias a la etiqueta <base> en el HTML.
    const response = await fetch(`../php/cotizaciones_api.php?id=${quoteId}`);

    if (!response.ok) {
      throw new Error(
        `Error de red al obtener datos: ${response.status} ${response.statusText}`
      );
    }

    const result = await response.json();

    // **PUNTO DE DEPURACIÓN CLAVE**: Revisa la consola del navegador (F12) para ver este mensaje.
    console.log("Datos recibidos de la API para el PDF:", result);

    if (
      !result.success ||
      !result.cotizacion ||
      !result.detalles ||
      result.detalles.length === 0
    ) {
      throw new Error(
        result.message ||
          "La API no devolvió los detalles necesarios para la cotización."
      );
    }

    const { cotizacion, detalles: planes } = result;

    // --- 2. CONSTRUIR EL DOCUMENTO PDF ---
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: "landscape" });

    // Títulos
    doc.setFontSize(18);
    doc.text(
      `Comparativa de Seguros - Cotización #${cotizacion.idCotizacion}`,
      14,
      22
    );
    doc.setFontSize(12);
    doc.setTextColor(100);
    doc.text(`Cliente: ${cotizacion.Cli_nombre}`, 14, 30);
    doc.text(
      `Fecha: ${new Date(cotizacion.Cot_fechaCreacion).toLocaleDateString(
        "es-ES"
      )}`,
      14,
      36
    );

    // Mapeo de características técnicas a etiquetas legibles para el PDF.
    const featureLabels = {
      Pro_descripcion: "Descripción",
      Pro_mesesCobertura: "Meses de Cobertura",
      Pro_responsabilidadCivil: "Responsabilidad Civil",
      Pro_roboTotal: "Robo Total",
      Pro_asistenciaVial: "Asistencia Vial",
      Pro_dañosColision: "Daños por Colisión",
      Pro_autoReemplazo: "Auto de Reemplazo",
      Pro_gastosLegales: "Gastos Legales",
      Pro_gastosMedicos: "Gastos Médicos",
    };
    const featureKeys = Object.keys(featureLabels);

    // Preparar datos para autoTable
    const head = [["Característica", ...planes.map((p) => p.Pro_nombre)]];
    const body = [];

    featureKeys.forEach((key) => {
      const row = [featureLabels[key]];
      planes.forEach((plan) => {
        let value = plan[key];
        if (key === "Pro_descripcion") {
          // Limitar la longitud de la descripción para que no ocupe mucho espacio
          row.push(
            value
              ? value.length > 100
                ? value.substring(0, 97) + "..."
                : value
              : "N/A"
          );
        } else if (value === "si") {
          row.push("Incluido");
        } else if (value === "no" || !value || value === "0") {
          row.push("No Incluido");
        } else if (!isNaN(parseFloat(value)) && parseFloat(value) > 0) {
          row.push(`$${parseFloat(value).toLocaleString("es-EC")}`);
        } else {
          row.push(value);
        }
      });
      body.push(row);
    });

    // Fila de precios para el pie de la tabla
    const pricesRow = [
      "PRECIO MENSUAL",
      ...planes.map((p) => `$${parseFloat(p.Pro_precioMensual).toFixed(2)}`),
    ];

    // La llamada a autoTable ahora debería funcionar sin problemas.
    doc.autoTable({
      head: head,
      body: body,
      foot: [pricesRow], // Usar 'foot' para un estilo diferenciado
      startY: 45,
      theme: "grid",
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontStyle: "bold",
      },
      footStyles: {
        fillColor: "#f0f0f0",
        textColor: 0,
        fontStyle: "bold",
        fontSize: 12,
      },
      didDrawPage: (data) => {
        // Pie de página con número
        const pageCount = doc.internal.getNumberOfPages();
        doc.setFontSize(10);
        doc.text(
          `Página ${data.pageNumber} de ${pageCount}`,
          data.settings.margin.left,
          doc.internal.pageSize.height - 10
        );
      },
    });

    // --- 3. GUARDAR EL ARCHIVO ---
    const date = new Date().toISOString().split("T")[0];
    doc.save(
      `cotizacion_${quoteId}_${cotizacion.Cli_nombre.replace(
        /\s+/g,
        "_"
      )}_${date}.pdf`
    );
  } catch (error) {
    console.error("Error al generar el PDF de la cotización:", error);
    alert(
      "No se pudo generar el PDF de la cotización. Revise la consola para más detalles."
    );
  }
}

/**
 * Muestra un modal con la información detallada de una cotización.
 * @param {number} quoteId - El ID de la cotización a mostrar.
 */
async function showQuoteDetailsModal(quoteId) {
  // Obtener referencias a los elementos del modal
  const modalElement = document.getElementById("quoteDetailsModal");
  const modal = bootstrap.Modal.getOrCreateInstance(modalElement);
  const modalTitleId = document.getElementById("detailsModalTitleId");
  const modalContent = document.getElementById("detailsModalContent");

  // 1. Poner el modal en estado de carga y mostrarlo
  modalTitleId.textContent = quoteId;
  modalContent.innerHTML = `<div class="text-center py-5"><div class="spinner-border text-info" role="status"></div><p class="mt-2">Cargando detalles...</p></div>`;
  modal.show();

  // 2. Realizar la llamada a la API para obtener los detalles
  try {
    // La ruta es relativa a la raíz del sitio gracias a la etiqueta <base>
    const response = await fetch(`../php/cotizaciones_api.php?id=${quoteId}`);
    if (!response.ok) {
      throw new Error(`Error de red: ${response.status}`);
    }

    const result = await response.json();

    if (result.success) {
      const { cotizacion, detalles } = result;

      // 3. Construir el HTML con los datos recibidos (sin estado)
      const detailsHtml = `
                <div class="row mb-3">
                    <div class="col-md-6">
                        <h6>Información del Cliente</h6>
                        <dl class="row mb-0">
                            <dt class="col-sm-4">Nombre:</dt>
                            <dd class="col-sm-8">${
                              cotizacion.Cli_nombre || "N/A"
                            }</dd>
                            <dt class="col-sm-4">Cédula:</dt>
                            <dd class="col-sm-8">${
                              cotizacion.Cli_cedula || "N/A"
                            }</dd>
                        </dl>
                    </div>
                    <div class="col-md-6">
                        <h6>Detalles de la Cotización</h6>
                        <dl class="row mb-0">
                            <dt class="col-sm-4">Creado por:</dt>
                            <dd class="col-sm-8">${
                              cotizacion.nombre_usuario || "N/A"
                            }</dd>
                            <dt class="col-sm-4">Fecha:</dt>
                            <dd class="col-sm-8">${new Date(
                              cotizacion.Cot_fechaCreacion
                            ).toLocaleString("es-ES", {
                              dateStyle: "long",
                              timeStyle: "short",
                            })}</dd>
                            <dt class="col-sm-4">Descripción:</dt>
                            <dd class="col-sm-8 fst-italic">"${
                              cotizacion.Cot_descripcion || "Sin descripción"
                            }"</dd>
                        </dl>
                    </div>
                </div>
                <hr>
                <h6>Planes Incluidos en la Cotización</h6>
                <p class="text-muted">Monto total asegurable (mensual): 
                    <strong class="text-success fs-5">$${parseFloat(
                      cotizacion.Cot_montoAsegurable
                    ).toFixed(2)}</strong>
                </p>
                
                ${
                  detalles.length > 0
                    ? `
                <ul class="list-group">
                    ${detalles
                      .map(
                        (plan) => `
                        <li class="list-group-item">
                            <div class="d-flex w-100 justify-content-between">
                                <h6 class="mb-1 text-primary">${
                                  plan.Pro_nombre
                                }</h6>
                                <small class="text-muted">${
                                  plan.Emp_nombre || "N/A"
                                }</small>
                            </div>
                            <p class="mb-1 small">${
                              plan.Pro_descripcion || "Sin descripción."
                            }</p>
                            <strong class="text-dark">$${parseFloat(
                              plan.Pro_precioMensual
                            ).toFixed(2)} / mes</strong>
                        </li>
                    `
                      )
                      .join("")}
                </ul>`
                    : '<p class="text-center text-muted">No se encontraron planes detallados para esta cotización.</p>'
                }
            `;

      // 4. Actualizar el contenido del modal
      modalContent.innerHTML = detailsHtml;
    } else {
      throw new Error(
        result.message || "No se pudo obtener la información de la cotización."
      );
    }
  } catch (error) {
    console.error("Error al obtener detalles de la cotización:", error);
    // 5. Mostrar un mensaje de error dentro del modal
    modalContent.innerHTML = `<div class="alert alert-danger"><i class="bi bi-exclamation-triangle-fill me-2"></i>Error al cargar los detalles: ${error.message}</div>`;
  }
}

// --- FUNCIÓN PRINCIPAL DE INICIALIZACIÓN ---
export function loadMisCotizaciones() {
  fetchAndRenderMyQuotes();

  const searchInput = document.getElementById("my-quotes-search-input");
  const startDateInput = document.getElementById("my-quotes-start-date");
  const endDateInput = document.getElementById("my-quotes-end-date");
  const resetButton = document.getElementById("btn-reset-filters");
  const pdfButton = document.getElementById("btn-generate-pdf");
  const tableBody = document.getElementById("my-quotes-table-body");
  const paginationControls = document.getElementById(
    "my-quotes-pagination-controls"
  );

  searchInput.addEventListener(
    "input",
    debounce(() => {
      viewState.searchTerm = searchInput.value;
      viewState.currentPage = 1;
      fetchAndRenderMyQuotes();
    })
  );

  [startDateInput, endDateInput].forEach((input) => {
    input.addEventListener("change", () => {
      viewState.startDate = startDateInput.value;
      viewState.endDate = endDateInput.value;
      viewState.currentPage = 1;
      fetchAndRenderMyQuotes();
    });
  });

  resetButton.addEventListener("click", () => {
    viewState.searchTerm = "";
    viewState.startDate = "";
    viewState.endDate = "";
    viewState.currentPage = 1;
    searchInput.value = "";
    startDateInput.value = "";
    endDateInput.value = "";
    fetchAndRenderMyQuotes();
  });

  pdfButton.addEventListener("click", generatePDF);

  paginationControls.addEventListener("click", (event) => {
    event.preventDefault();
    const pageLink = event.target.closest("a.page-link");
    if (pageLink && !pageLink.parentElement.classList.contains("disabled")) {
      const newPage = parseInt(pageLink.dataset.page, 10);
      if (newPage !== viewState.currentPage) {
        viewState.currentPage = newPage;
        fetchAndRenderMyQuotes();
      }
    }
  });

  tableBody.addEventListener("click", (event) => {
    const targetButton = event.target.closest("button");
    if (!targetButton) return;
    const quoteId = targetButton.dataset.id;
    if (!quoteId) return;

    if (targetButton.classList.contains("btn-view-details")) {
      showQuoteDetailsModal(quoteId);
    }
    if (targetButton.classList.contains("btn-download-pdf")) {
      targetButton.innerHTML = `<span class="spinner-border spinner-border-sm"></span>`;
      targetButton.disabled = true;
      generateQuotePDF(quoteId).finally(() => {
        targetButton.innerHTML = `<i class="bi bi-file-earmark-pdf"></i>`;
        targetButton.disabled = false;
      });
    }
  });
}

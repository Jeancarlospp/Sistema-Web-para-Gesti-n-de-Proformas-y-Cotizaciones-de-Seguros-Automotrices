// --- AUTOCOMPLETADO DE CLIENTES POR NOMBRE O CÉDULA ---
async function searchClients(query) {
  try {
    const response = await fetch(
      `../php/clientes_api.php?search=${encodeURIComponent(query)}`
    );
    if (!response.ok) return [];
    return await response.json();
  } catch (error) {
    console.error("Error al buscar clientes:", error);
    return [];
  }
}

const clientNameInput = document.getElementById("client-name");
const clientList = document.getElementById("client-list");
const clientIdInput = document.getElementById("client-id");

if (clientNameInput && clientList && clientIdInput) {
  clientNameInput.addEventListener("input", async () => {
    const query = clientNameInput.value.trim();
    if (query.length < 2) return;
    const clients = await searchClients(query);
    clientList.innerHTML = "";
    clients.forEach((cli) => {
      const option = document.createElement("option");
      option.value = `${cli.Cli_nombre} (${cli.Cli_cedula})`;
      option.dataset.id = cli.idCliente;
      clientList.appendChild(option);
    });
  });

  clientNameInput.addEventListener("change", () => {
    const selected = Array.from(clientList.options).find(
      (opt) => opt.value === clientNameInput.value
    );
    if (selected) {
      clientIdInput.value = selected.dataset.id;
    } else {
      clientIdInput.value = "";
    }
  });
}

/**
 * js/asesor_dashboard.js
 * Lógica 100% dinámica para la página: Dashboard del Asesor,
 * con generación real de PDF para la comparativa.
 */

// Importamos la función reutilizable para crear la tabla de comparación.
import { buildComparisonTable } from "./comparison_table.js";

/**
 * Muestra un mensaje de carga o error en un contenedor.
 */
function showPlansMessage(message, isError = false, container) {
  container.innerHTML = `<p class="text-center p-3 text-${
    isError ? "danger" : "muted"
  }">${message}</p>`;
}

/**
 * Carga las categorías de vehículos desde la API y las añade al <select>.
 */
async function populateVehicleTypes(selectElement) {
  try {
    const response = await fetch(
      "../php/productos_api.php?action=get_categories"
    );
    if (!response.ok)
      throw new Error("No se pudieron cargar las categorías de vehículos.");

    const categories = await response.json();
    selectElement.innerHTML =
      '<option value="" disabled selected>-- Seleccione un tipo --</option>';

    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category.idcategoria;
      option.textContent = category.Cat_nombre;
      selectElement.appendChild(option);
    });
  } catch (error) {
    console.error("Error al poblar tipos de vehículo:", error);
    selectElement.innerHTML =
      '<option value="" disabled selected>Error al cargar</option>';
  }
}

/**
 * Carga los planes (productos) para una categoría específica desde la API.
 */
async function fetchAndRenderPlans(categoryId, container) {
  showPlansMessage("Cargando planes disponibles...", false, container);
  try {
    const response = await fetch(
      `../php/productos_api.php?category_id=${categoryId}`
    );
    if (!response.ok) throw new Error("No se pudieron cargar los planes.");

    const plans = await response.json();
    container.innerHTML = "";
    if (!plans || plans.length === 0) {
      showPlansMessage(
        "No hay planes disponibles para este tipo de vehículo.",
        true,
        container
      );
      return;
    }

    plans.forEach((plan) => {
      const checkboxHtml = `
          <div class="form-check form-check-inline">
              <input class="form-check-input" type="checkbox" id="plan-${plan.idproducto}" value="${plan.idproducto}">
              <label class="form-check-label" for="plan-${plan.idproducto}">${plan.Pro_nombre}</label>
          </div>`;
      container.innerHTML += checkboxHtml;
    });
  } catch (error) {
    console.error(
      `Error al cargar planes para la categoría ${categoryId}:`,
      error
    );
    showPlansMessage("Error al cargar los planes.", true, container);
  }
}

/**
 * Obtener el ID de usuario de la sesión vía API
 */
async function obtenerIdUsuarioSesion() {
  try {
    const resp = await fetch("../php/usuarios_api.php?me=1");
    if (!resp.ok) {
      throw new Error("No se pudo obtener la información del usuario");
    }
    const data = await resp.json();
    return data.id_usuario;
  } catch (error) {
    console.error("Error obteniendo ID de usuario:", error);
    return null;
  }
}

/**
 * Función para guardar la cotización - COMPLETAMENTE CORREGIDA
 */
async function guardarCotizacion() {
  const idCliente = document.getElementById("client-id")?.value;
  const selectedPlanIds = Array.from(
    document.querySelectorAll(
      "#plans-checkbox-container input[type=checkbox]:checked"
    )
  ).map((cb) => parseInt(cb.value));

  // Validaciones básicas
  if (!idCliente) {
    alert("Debe seleccionar un cliente válido.");
    return;
  }

  if (selectedPlanIds.length === 0) {
    alert("Debe seleccionar al menos un plan.");
    return;
  }

  // Obtener el idUsuario de la sesión
  const idUsuario = await obtenerIdUsuarioSesion();
  if (!idUsuario) {
    alert(
      "Error: No se pudo obtener la información del usuario. Intente cerrar sesión e iniciar nuevamente."
    );
    return;
  }

  // Mostrar loading
  const btnGuardar = document.getElementById("btnGuardar");
  const originalText = btnGuardar.innerHTML;
  btnGuardar.innerHTML = '<i class="bi bi-hourglass-split"></i> Guardando...';
  btnGuardar.disabled = true;

  try {
    console.log("Enviando datos:", {
      idCliente: parseInt(idCliente),
      idUsuario: parseInt(idUsuario),
      planes: selectedPlanIds,
    });

    const response = await fetch("../php/cotizaciones_api.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        idCliente: parseInt(idCliente),
        idUsuario: parseInt(idUsuario),
        planes: selectedPlanIds,
      }),
    });

    console.log("Response status:", response.status);
    console.log("Response headers:", response.headers);

    // Verificar si la respuesta es válida
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response text:", errorText);
      throw new Error(
        `Error HTTP: ${response.status} - ${response.statusText}`
      );
    }

    // Leer la respuesta como texto primero para debug
    const responseText = await response.text();
    console.log("Response text:", responseText);

    // Intentar parsear como JSON
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (jsonError) {
      console.error("Error parsing JSON:", jsonError);
      console.error("Response that failed to parse:", responseText);
      throw new Error(
        "La respuesta del servidor no es un JSON válido. Posible error PHP."
      );
    }

    if (data.success) {
      alert(`Cotización guardada correctamente con ID: ${data.idCotizacion}`);
      console.log("Cotización guardada exitosamente:", data);
    } else {
      alert(
        "Error al guardar cotización: " + (data.message || "Error desconocido")
      );
      console.error("Detalles del error:", data);
    }
  } catch (error) {
    console.error("Error en la petición:", error);
    alert(
      "Error de conexión al guardar la cotización. Verifique su conexión a internet."
    );
  } finally {
    // Restaurar botón
    btnGuardar.innerHTML = originalText;
    btnGuardar.disabled = false;
  }
}

/**
 * Genera un documento PDF a partir de la tabla de comparación visible.
 */
function generateComparisonPDF() {
  // Verificar que las librerías PDF estén cargadas
  if (
    typeof window.jspdf === "undefined" ||
    typeof window.jspdf.jsPDF === "undefined" ||
    typeof window.jspdf.jsPDF.API.autoTable === "undefined"
  ) {
    alert(
      "Error: Las librerías para generar PDF no se han cargado correctamente."
    );
    return;
  }

  const { jsPDF } = window.jspdf;
  const comparisonArea = document.getElementById("comparison-area");
  const clientNameElement = document.getElementById("client-name-display");
  const clientName = clientNameElement?.textContent || "Cliente";
  const comparisonTable = document.getElementById("comparison-table");

  // Verificar que la tabla de comparación esté visible
  if (!comparisonTable || comparisonArea.style.display === "none") {
    alert(
      "Por favor, genere primero una comparación para poder exportarla a PDF."
    );
    return;
  }

  const doc = new jsPDF({ orientation: "landscape" });

  // Obtener datos del cliente seleccionado
  const clientInput = document.getElementById("client-name");
  const clientIdInput = document.getElementById("client-id");
  const vehicleTypeSelect = document.getElementById("vehicle-type");
  
  const clientInputValue = clientInput ? clientInput.value : "N/A";
  const vehicleType = vehicleTypeSelect ? vehicleTypeSelect.options[vehicleTypeSelect.selectedIndex]?.text || "N/A" : "N/A";

  // Encabezado del documento
  doc.setFontSize(18);
  doc.text(`Comparativa de Seguros`, 14, 22);
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`Cliente: ${clientName}`, 14, 30);
  doc.text(`Tipo de Vehículo: ${vehicleType}`, 14, 36);
  doc.text(`Fecha: ${new Date().toLocaleDateString("es-ES")}`, 14, 42);

  // Extraer datos de la tabla HTML
  const tableHead = comparisonTable.querySelector("thead");
  const tableBody = comparisonTable.querySelector("tbody");
  const tableFoot = comparisonTable.querySelector("tfoot");

  if (!tableHead || !tableBody) {
    alert("Error: No se pudo extraer los datos de la tabla de comparación.");
    return;
  }

  // Procesar encabezado
  const headRow = tableHead.querySelector("tr");
  const head = [];
  if (headRow) {
    const headCells = Array.from(headRow.querySelectorAll("th"));
    head.push(headCells.map(cell => cell.textContent.trim()));
  }

  // Procesar cuerpo de la tabla
  const body = [];
  const bodyRows = Array.from(tableBody.querySelectorAll("tr"));
  bodyRows.forEach(row => {
    const cells = Array.from(row.querySelectorAll("td, th"));
    const rowData = cells.map(cell => {
      let text = cell.textContent.trim();
      // Limpiar texto para el PDF
      if (text.length > 100) {
        text = text.substring(0, 97) + "...";
      }
      return text;
    });
    if (rowData.length > 0) {
      body.push(rowData);
    }
  });

  // Procesar pie de tabla (precios)
  const foot = [];
  if (tableFoot) {
    const footRows = Array.from(tableFoot.querySelectorAll("tr"));
    footRows.forEach(row => {
      const cells = Array.from(row.querySelectorAll("td, th"));
      const rowData = cells.map(cell => cell.textContent.trim());
      if (rowData.length > 0) {
        foot.push(rowData);
      }
    });
  }

  // Renderizar tabla en PDF
  doc.autoTable({
    head: head,
    body: body,
    foot: foot,
    startY: 50,
    theme: "grid",
    headStyles: { 
      fillColor: [41, 128, 185], 
      textColor: 255, 
      fontStyle: "bold" 
    },
    footStyles: { 
      fillColor: "#f0f0f0", 
      textColor: 0, 
      fontStyle: "bold", 
      fontSize: 12 
    },
    bodyStyles: {
      fontSize: 10
    },
    didDrawPage: (data) => {
      // Añadir pie de página con número de página
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(
        `Página ${data.pageNumber} de ${pageCount} - Generado el ${new Date().toLocaleDateString("es-ES")}`,
        data.settings.margin.left,
        doc.internal.pageSize.height - 10
      );
    }
  });

  // Generar nombre de archivo y guardar
  const date = new Date().toISOString().split("T")[0];
  const fileName = `comparativa_seguros_${clientName.replace(/\s+/g, "_")}_${date}.pdf`;
  doc.save(fileName);
}

/**
 * Función principal que se exporta y se llama desde main.js.
 */
export function loadAsesorDashboard() {
  console.log(
    "Módulo del Dashboard del Asesor (sincronizado con SQL) cargado."
  );

  // Elementos del DOM
  const form = document.getElementById("quote-form");
  const vehicleTypeSelect = document.getElementById("vehicle-type");
  const plansContainer = document.getElementById("plans-checkbox-container");
  const comparisonArea = document.getElementById("comparison-area");
  const clientNameInput = document.getElementById("client-name");
  const clientNameDisplay = document.getElementById("client-name-display");
  const pdfBtn = document.getElementById("generate-pdf-btn");
  const resetBtn = document.getElementById("btn-reset-form");
  const compareBtn = document.getElementById("btn-compare");
  const btnGuardar = document.getElementById("btnGuardar");

  if (
    !form ||
    !vehicleTypeSelect ||
    !plansContainer ||
    !comparisonArea ||
    !clientNameInput ||
    !clientNameDisplay ||
    !pdfBtn ||
    !resetBtn ||
    !compareBtn ||
    !btnGuardar
  ) {
    console.error(
      "Faltan elementos HTML esenciales en el dashboard del asesor. Abortando inicialización."
    );
    return;
  }

  // --- LÓGICA DE INICIALIZACIÓN ---
  populateVehicleTypes(vehicleTypeSelect);

  // --- MANEJO DE EVENTOS ---

  // 1. Cuando se cambia el tipo de vehículo.
  vehicleTypeSelect.addEventListener("change", () => {
    const selectedCategoryId = vehicleTypeSelect.value;
    if (selectedCategoryId) {
      fetchAndRenderPlans(selectedCategoryId, plansContainer);
      compareBtn.disabled = false;
    } else {
      showPlansMessage(
        "Por favor, seleccione primero un tipo de vehículo.",
        false,
        plansContainer
      );
      compareBtn.disabled = true;
    }
    comparisonArea.style.display = "none";
  });

  // 2. Cuando se envía el formulario para cotizar/comparar.
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const selectedPlanIds = Array.from(
      plansContainer.querySelectorAll("input[type=checkbox]:checked")
    ).map((cb) => cb.value);

    if (selectedPlanIds.length === 0) {
      alert("Por favor, seleccione al menos un plan para comparar.");
      return;
    }

    const clientName = clientNameInput.value || "Cliente";

    try {
      // Llamar a la función que construye la tabla HTML
      await buildComparisonTable(
        selectedPlanIds,
        document.getElementById("comparison-table-head"),
        document.getElementById("comparison-table-body"),
        document.getElementById("comparison-table-foot")
      );

      // Mostrar los resultados
      clientNameDisplay.textContent = clientName;
      comparisonArea.style.display = "block";

      // Scroll seguro sin getBoundingClientRect
      setTimeout(() => {
        try {
          if (comparisonArea && comparisonArea.scrollIntoView) {
            comparisonArea.scrollIntoView({ behavior: "smooth" });
          }
        } catch (scrollError) {
          console.warn("No se pudo hacer scroll automático:", scrollError);
        }
      }, 200);
    } catch (error) {
      console.error("Error al generar la comparación:", error);
      alert("Error al generar la comparación. Por favor, intente nuevamente.");
    }
  });

  // 3. Cuando se limpia el formulario.
  resetBtn.addEventListener("click", () => {
    comparisonArea.style.display = "none";
    plansContainer.innerHTML = ""; // Limpiar también los checkboxes
    showPlansMessage(
      "Por favor, seleccione primero un tipo de vehículo.",
      false,
      plansContainer
    );
    compareBtn.disabled = true;
  });

  // 4. Lógica del botón PDF.
  pdfBtn.addEventListener("click", generateComparisonPDF);

  // 5. Lógica del botón GUARDAR COTIZACIÓN (CORREGIDA)
  btnGuardar.addEventListener("click", guardarCotizacion);
}

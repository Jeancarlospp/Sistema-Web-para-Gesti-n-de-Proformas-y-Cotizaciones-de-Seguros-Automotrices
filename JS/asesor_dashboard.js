// --- AUTOCOMPLETADO DE CLIENTES POR NOMBRE O CÉDULA ---
async function searchClients(query) {
  const response = await fetch(`../php/clientes_api.php?search=${encodeURIComponent(query)}`);
  if (!response.ok) return [];
  return await response.json();
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
    clients.forEach(cli => {
      const option = document.createElement("option");
      option.value = `${cli.Cli_nombre} (${cli.Cli_cedula})`;
      option.dataset.id = cli.idCliente;
      clientList.appendChild(option);
    });
  });

  clientNameInput.addEventListener("change", () => {
    const selected = Array.from(clientList.options).find(
      opt => opt.value === clientNameInput.value
    );
    if (selected) {
      clientIdInput.value = selected.dataset.id;
    } else {
      clientIdInput.value = "";
    }
  });
}

// --- GUARDAR COTIZACIÓN ---
// --- Obtener el ID de usuario de la sesión vía API ---
async function obtenerIdUsuarioSesion() {
  const resp = await fetch('../php/usuarios_api.php?me=1');
  const data = await resp.json();
  return data.id_usuario;
}

document.getElementById("btnGuardar")?.addEventListener("click", async () => {
  const idCliente = document.getElementById("client-id")?.value;
  const selectedPlanIds = Array.from(
    document.querySelectorAll("#plans-checkbox-container input[type=checkbox]:checked")
  ).map(cb => parseInt(cb.value));

  // Obtener el idUsuario de la sesión
  const idUsuario = await obtenerIdUsuarioSesion();

  if (!idCliente || !idUsuario || selectedPlanIds.length === 0) {
    alert("Debe seleccionar un cliente y al menos un plan.");
    return;
  }

  const res = await fetch("../php/cotizaciones_api.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      idCliente,
      idUsuario,
      planes: selectedPlanIds
    })
  });
  const data = await res.json();
  if (data.success) {
    alert("Cotización guardada correctamente.");
    // Opcional: limpiar formulario o mostrar detalles
  } else {
    alert("Error al guardar cotización: " + (data.message || "Error desconocido"));
  }
});
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

// --- INICIO: NUEVA FUNCIÓN PARA GENERAR PDF ---
/**
 * Genera un documento PDF a partir de la tabla de comparación visible.
 */
function generateComparisonPDF() {
  // Verificar que las librerías PDF estén cargadas
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
  const comparisonArea = document.getElementById("comparison-area");
  const clientName =
    document.getElementById("client-name-display").textContent || "Cliente";
  const comparisonTable = document.getElementById("comparison-table");

  // Verificar que la tabla de comparación esté visible
  if (!comparisonTable || comparisonArea.style.display === "none") {
    alert(
      "Por favor, genere primero una comparación para poder exportarla a PDF."
    );
    return;
  }

  const doc = new jsPDF({
    orientation: "landscape", // Tabla ancha, mejor en horizontal
  });

  // Añadir Títulos
  doc.setFontSize(18);
  doc.text("Comparativa de Planes de Seguros", 14, 22);
  doc.setFontSize(12);
  doc.text(`Cliente: ${clientName}`, 14, 30);

  // Usar autoTable para convertir la tabla HTML a PDF
  doc.autoTable({
    html: "#comparison-table",
    startY: 35,
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185], textColor: 255 }, // Cabecera azul
    footStyles: { fillColor: [230, 230, 230], textColor: 0, fontStyle: "bold" },
    didDrawPage: (data) => {
      // Añadir pie de página con número de página
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(10);
      doc.text(
        `Página ${data.pageNumber} de ${pageCount}`,
        data.settings.margin.left,
        doc.internal.pageSize.height - 10
      );
    },
  });

  // Generar nombre de archivo y guardar
  const date = new Date().toISOString().split("T")[0];
  const fileName = `comparativa_seguros_${clientName.replace(
    /\s+/g,
    "_"
  )}_${date}.pdf`;
  doc.save(fileName);
}
// --- FIN: NUEVA FUNCIÓN PARA GENERAR PDF ---

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

  if (
    !form ||
    !vehicleTypeSelect ||
    !plansContainer ||
    !comparisonArea ||
    !clientNameInput ||
    !clientNameDisplay ||
    !pdfBtn ||
    !resetBtn ||
    !compareBtn
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
    comparisonArea.scrollIntoView({ behavior: "smooth" });
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

  // 4. Lógica del botón PDF (¡CORREGIDA!).
  pdfBtn.addEventListener("click", generateComparisonPDF);
}

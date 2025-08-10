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
async function generateComparisonPDF() {
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

  //1. OBTENER LOS PLANES SELECCIONADOS
  const selectedPlanIds = Array.from(
    document.querySelectorAll(
      "#plans-checkbox-container input[type=checkbox]:checked"
    )
  ).map((cb) => cb.value);

  if (selectedPlanIds.length === 0) {
    alert("No hay planes seleccionados para guardar la cotización.");
    return;
  }

  //2. GUARDAR EN EL SERVIDOR (cotizacion + detalle_cotizacion)
  try {
    const saveResponse = await fetch("../php/cotizacion_api.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        idCliente: document.getElementById("client-id").value, // Asegúrate de tener este campo oculto en el HTML
        idUsuario: document.getElementById("user-id").value,   // Lo mismo para el usuario
        clienteNombre: clientName,
        planes: selectedPlanIds
      }),
    });

    const saveResult = await saveResponse.json();
    if (!saveResult.success) {
      alert("La cotización no pudo guardarse en el servidor.");
      console.error(saveResult.error || saveResult.message);
      return;
    }
    console.log("Cotización guardada con ID:", saveResult.idCotizacion);
  } catch (error) {
    console.error("Error guardando la cotización:", error);
    alert("Error al guardar la cotización en el servidor.");
    return;
  }

  // 📌 3. GENERAR EL PDF
  const doc = new jsPDF({ orientation: "landscape" });

  doc.setFontSize(18);
  doc.text("Comparativa de Planes de Seguros", 14, 22);
  doc.setFontSize(12);
  doc.text(`Cliente: ${clientName}`, 14, 30);

  doc.autoTable({
    html: "#comparison-table",
    startY: 35,
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
    footStyles: { fillColor: [230, 230, 230], textColor: 0, fontStyle: "bold" },
    didDrawPage: (data) => {
      const pageCount = doc.internal.getNumberOfPages();
      doc.setFontSize(10);
      doc.text(
        `Página ${data.pageNumber} de ${pageCount}`,
        data.settings.margin.left,
        doc.internal.pageSize.height - 10
      );
    },
  });

  const date = new Date().toISOString().split("T")[0];
  const fileName = `comparativa_seguros_${clientName.replace(/\s+/g, "_")}_${date}.pdf`;
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

/**
 * js/visualizarProductos.js
 * Lógica avanzada con Paginación y Filtros para la página de Visualización de Productos.
 */

// --- ESTADO GLOBAL DE LA TABLA ---
let tableState = {
  currentPage: 1,
  limit: 10,
  searchTerm: "",
  categoryId: "",
  sortBy: "Pro_nombre ASC", // Orden por defecto
  totalRecords: 0,
};

// --- RENDERIZADO Y LÓGICA DE LA INTERFAZ ---

/** Dibuja las filas de la tabla con los datos de la página actual. */
function renderProductTable(products, tableBody) {
  tableBody.innerHTML = "";
  if (!products || products.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="5" class="text-center text-muted">No se encontraron productos que coincidan con los criterios.</td></tr>';
    return;
  }

  products.forEach((product) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td><strong>${product.Pro_nombre}</strong></td>
            <td>${product.Pro_descripcion}</td>
            <td><span class="badge bg-secondary">${
              product.nombre_categoria || "N/A"
            }</span></td>
            <td>${product.nombre_empresa || "N/A"}</td>
            <td>$${parseFloat(product.Pro_precioMensual).toFixed(2)}</td>
        `;
    tableBody.appendChild(row);
  });
}

/** Dibuja los controles de paginación. */
function renderPaginationControls(container) {
  const totalPages = Math.ceil(tableState.totalRecords / tableState.limit);
  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }
  let buttonsHtml = '<ul class="pagination pagination-sm">';
  buttonsHtml += `<li class="page-item ${
    tableState.currentPage === 1 ? "disabled" : ""
  }"><a class="page-link" href="#" data-page="${
    tableState.currentPage - 1
  }">Anterior</a></li>`;
  for (let i = 1; i <= totalPages; i++) {
    buttonsHtml += `<li class="page-item ${
      tableState.currentPage === i ? "active" : ""
    }"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
  }
  buttonsHtml += `<li class="page-item ${
    tableState.currentPage === totalPages ? "disabled" : ""
  }"><a class="page-link" href="#" data-page="${
    tableState.currentPage + 1
  }">Siguiente</a></li>`;
  buttonsHtml += "</ul>";
  container.innerHTML = buttonsHtml;
}

/** Actualiza el texto informativo de la paginación. */
function updatePaginationInfo(element) {
  if (tableState.totalRecords === 0) {
    element.textContent = "No hay productos";
    return;
  }
  const start = (tableState.currentPage - 1) * tableState.limit + 1;
  const end = Math.min(start + tableState.limit - 1, tableState.totalRecords);
  element.textContent = `Mostrando ${start} a ${end} de ${tableState.totalRecords} productos`;
}

// --- LÓGICA DE DATOS ---

/** Función principal para obtener datos de la API aplicando filtros. */
async function fetchAndRenderProducts() {
  const tableBody = document.getElementById("product-table-body");
  const controls = document.getElementById("pagination-controls");
  const info = document.getElementById("pagination-info");
  if (!tableBody || !controls || !info) return;

  tableBody.innerHTML =
    '<tr><td colspan="5" class="text-center">Cargando productos...</td></tr>';

  const params = new URLSearchParams({
    page: tableState.currentPage,
    limit: tableState.limit,
    sort_by: tableState.sortBy,
    search: tableState.searchTerm,
    category_id: tableState.categoryId,
  });

  try {
    const response = await fetch(
      `../php/productos_api.php?${params.toString()}`
    );
    if (!response.ok)
      throw new Error("La respuesta de la red no fue correcta.");
    const data = await response.json();

    tableState.totalRecords = data.total;
    renderProductTable(data.data, tableBody);
    renderPaginationControls(controls);
    updatePaginationInfo(info);
  } catch (error) {
    console.error("Error al cargar productos:", error);
    tableBody.innerHTML =
      '<tr><td colspan="5" class="text-center text-danger">No se pudieron cargar los productos.</td></tr>';
  }
}

/** Pobla el select de categorías. */
async function populateCategoryFilter(selectElement) {
  try {
    const response = await fetch(
      "../php/productos_api.php?action=get_categories"
    );
    if (!response.ok) throw new Error("No se pudieron cargar las categorías.");
    const categories = await response.json();

    // Limpiar opciones existentes (excepto la primera)
    selectElement.innerHTML = '<option value="" selected>Todas</option>';
    categories.forEach((cat) => {
      selectElement.innerHTML += `<option value="${cat.idcategoria}">${cat.Cat_nombre}</option>`;
    });
  } catch (error) {
    console.error("Error al poblar filtro de categorías:", error);
  }
}

// --- FUNCIÓN PRINCIPAL DE INICIALIZACIÓN ---
export function loadVisualizarProductos() {
  console.log("Módulo de Visualizar Productos con filtros cargado.");

  // Elementos de la interfaz
  const searchInput = document.getElementById("product-search-input");
  const categoryFilter = document.getElementById("product-category-filter");
  const limitSelect = document.getElementById("product-limit-select");
  const paginationControls = document.getElementById("pagination-controls");

  // Cargar datos iniciales y poblar filtros
  fetchAndRenderProducts();
  populateCategoryFilter(categoryFilter);

  // --- EVENT LISTENERS ---

  let searchTimeout;
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      tableState.searchTerm = searchInput.value;
      tableState.currentPage = 1;
      fetchAndRenderProducts();
    }, 300); // Debounce para no saturar la API
  });

  categoryFilter.addEventListener("change", () => {
    tableState.categoryId = categoryFilter.value;
    tableState.currentPage = 1;
    fetchAndRenderProducts();
  });

  limitSelect.addEventListener("change", () => {
    tableState.limit = parseInt(limitSelect.value, 10);
    tableState.currentPage = 1;
    fetchAndRenderProducts();
  });

  paginationControls.addEventListener("click", (event) => {
    event.preventDefault();
    const pageLink = event.target.closest(".page-link");
    if (pageLink && !pageLink.parentElement.classList.contains("disabled")) {
      tableState.currentPage = parseInt(pageLink.dataset.page, 10);
      fetchAndRenderProducts();
    }
  });
}

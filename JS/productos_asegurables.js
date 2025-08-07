/**
 * js/productosAsegurables.js
 * Lógica avanzada con Paginación, Filtros y CRUD completo para la Gestión de Productos Asegurables.
 */

// --- ESTADO GLOBAL DE LA VISTA DE PRODUCTOS ---
let viewState = {
  currentPage: 1,
  limit: 6,
  searchTerm: "",
  categoryId: "",
  sortBy: "Pro_nombre ASC",
  totalRecords: 0,
};

// --- RENDERIZADO Y LÓGICA DE LA INTERFAZ ---

/** Dibuja las tarjetas de productos detalladas en el contenedor. */
function renderProductCards(products, container) {
  container.innerHTML = "";
  if (!products || products.length === 0) {
    container.innerHTML =
      '<div class="col-12"><p class="text-center text-muted">No se encontraron productos que coincidan con los criterios.</p></div>';
    return;
  }
  products.forEach((product) => {
    let featuresHtml = "";
    const features = [
      {
        label: "Meses de Cobertura",
        value: product.Pro_mesesCobertura,
        unit: " meses",
      },
      {
        label: "Responsabilidad Civil",
        value: product.Pro_responsabilidadCivil,
        unit: "$",
      },
      { label: "Robo Total", value: product.Pro_roboTotal },
      { label: "Asistencia Vial", value: product.Pro_asistenciaVial },
      {
        label: "Daños por Colisión",
        value: product.Pro_dañosColision,
        unit: "$",
      },
      { label: "Auto de Reemplazo", value: product.Pro_autoReemplazo },
      { label: "Gastos Legales", value: product.Pro_gastosLegales, unit: "$" },
      { label: "Gastos Médicos", value: product.Pro_gastosMedicos, unit: "$" },
    ];

    features.forEach((feature) => {
      let content = `<i class="bi bi-x-circle text-danger"></i> ${feature.label}`;
      if (feature.value && feature.value !== "no" && feature.value != 0) {
        let displayValue = feature.value;
        if (feature.unit === "$" && !isNaN(parseFloat(feature.value)))
          displayValue = `$${parseFloat(feature.value).toLocaleString(
            "es-EC"
          )}`;
        else if (feature.unit) displayValue = `${feature.value}${feature.unit}`;
        else if (feature.value === "si") displayValue = "Sí";
        content = `<i class="bi bi-check-circle-fill text-success"></i> ${feature.label}: <strong>${displayValue}</strong>`;
      }
      featuresHtml += `<li class="list-group-item py-1 px-0">${content}</li>`;
    });

    const estadoButtonText =
      product.Pro_estado === "activo" ? "Desactivar" : "Activar";
    const estadoButtonClass =
      product.Pro_estado === "activo"
        ? "btn-outline-warning"
        : "btn-outline-success";

    const cardHtml = `
            <div class="col-12 col-md-6 col-lg-4 mb-4">
                <div class="card h-100 shadow-sm">
                    <div class="card-header"><div class="d-flex justify-content-between align-items-center"><h5 class="card-title mb-0">${
                      product.Pro_nombre
                    }</h5><span class="badge ${
      product.Pro_estado === "activo" ? "bg-success" : "bg-secondary"
    }">${
      product.Pro_estado
    }</span></div><p class="card-subtitle text-muted small mt-1">${
      product.nombre_empresa || "Sin empresa"
    } - Cat: ${product.nombre_categoria || "N/A"}</p></div>
                    <div class="card-body"><p class="card-text small fst-italic">"${
                      product.Pro_descripcion
                    }"</p><ul class="list-group list-group-flush small">${featuresHtml}</ul></div>
                    <div class="card-footer d-flex justify-content-between align-items-center"><h4 class="mb-0">$${parseFloat(
                      product.Pro_precioMensual
                    ).toFixed(
                      2
                    )}</h4><div class="btn-group" role="group"><button class="btn btn-sm btn-info btn-edit" data-id="${
      product.idproducto
    }" title="Editar Producto"><i class="bi bi-pencil"></i></button><button class="btn btn-sm ${estadoButtonClass} btn-toggle-status" data-id="${
      product.idproducto
    }" data-new-status="${
      product.Pro_estado === "activo" ? "inactivo" : "activo"
    }" title="${estadoButtonText} Producto">${estadoButtonText}</button></div></div>
                </div>
            </div>`;
    container.innerHTML += cardHtml;
  });
}

/** Dibuja los controles de paginación. */
function renderPaginationControls(container) {
  const totalPages = Math.ceil(viewState.totalRecords / viewState.limit);
  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }
  let buttonsHtml = '<ul class="pagination pagination-sm">';
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
    element.textContent = "No hay productos";
    return;
  }
  const start = (viewState.currentPage - 1) * viewState.limit + 1;
  const end = Math.min(start + viewState.limit - 1, viewState.totalRecords);
  element.textContent = `Mostrando ${start} a ${end} de ${viewState.totalRecords} productos`;
}

// --- LÓGICA DE DATOS ---

/** Función principal para obtener datos de la API aplicando filtros. */
async function fetchAndRenderProducts() {
  const container = document.getElementById("product-cards-container");
  const controls = document.getElementById("product-pagination-controls");
  const info = document.getElementById("product-pagination-info");
  if (!container || !controls || !info) return;

  container.innerHTML =
    '<div class="col-12 text-center"><p>Cargando productos...</p><div class="spinner-border" role="status"></div></div>';

  const params = new URLSearchParams({
    page: viewState.currentPage,
    limit: viewState.limit,
    sort_by: viewState.sortBy,
    search: viewState.searchTerm,
    category_id: viewState.categoryId,
  });

  try {
    const response = await fetch(
      `../php/productos_api.php?${params.toString()}`
    );
    if (!response.ok)
      throw new Error("La respuesta de la red no fue correcta.");
    const data = await response.json();

    viewState.totalRecords = data.total;
    renderProductCards(data.data, container);
    renderPaginationControls(controls);
    updatePaginationInfo(info);
  } catch (error) {
    console.error("Error al cargar productos:", error);
    container.innerHTML =
      '<div class="col-12"><p class="text-center text-danger">Error al cargar productos.</p></div>';
  }
}

/** Pobla los selects de los modales y filtros. */
async function populateSelects(...elements) {
  try {
    const [categories, companies] = await Promise.all([
      fetch("../php/productos_api.php?action=get_categories").then((res) =>
        res.json()
      ),
      fetch("../php/empresas_api.php").then((res) => res.json()),
    ]);

    elements.forEach(({ element, type }) => {
      if (element) {
        element.innerHTML = `<option value="">${
          type === "category-filter" ? "Todas" : "-- Seleccione --"
        }</option>`;
        const source = type.startsWith("category") ? categories : companies;
        const valueField = type.startsWith("category")
          ? "idcategoria"
          : "idEmpresas_Proveedora";
        const textField = type.startsWith("category")
          ? "Cat_nombre"
          : "Emp_nombre";

        source.forEach((item) => {
          element.innerHTML += `<option value="${item[valueField]}">${item[textField]}</option>`;
        });
      }
    });
  } catch (error) {
    console.error("Error al poblar selects:", error);
  }
}

/** Abre y llena el modal de edición. */
async function openEditProductModal(productId) {
  try {
    const response = await fetch(`../php/productos_api.php?id=${productId}`);
    if (!response.ok)
      throw new Error("No se pudo obtener la info del producto.");
    const product = await response.json();
    if (!product || product.error)
      throw new Error(product.error || "Producto no encontrado.");

    document.getElementById("edit-idproducto").value = product.idproducto;
    document.getElementById("edit-Pro_nombre").value = product.Pro_nombre;
    document.getElementById("edit-Pro_precioMensual").value =
      product.Pro_precioMensual;
    document.getElementById("edit-idCategoria").value = product.idCategoria;
    document.getElementById("edit-idEmpresaProveedora").value =
      product.idEmpresaProveedora;
    document.getElementById("edit-Pro_descripcion").value =
      product.Pro_descripcion;
    document.getElementById("edit-Pro_responsabilidadCivil").value =
      product.Pro_responsabilidadCivil;
    document.getElementById("edit-Pro_asistenciaVial").value =
      product.Pro_asistenciaVial;
    document.getElementById("edit-Pro_dañosColision").value =
      product.Pro_dañosColision;
    document.getElementById("edit-Pro_gastosMedicos").value =
      product.Pro_gastosMedicos;
    document.getElementById("edit-Pro_roboTotal").checked =
      product.Pro_roboTotal === "si";
    document.getElementById("edit-Pro_autoReemplazo").checked =
      product.Pro_autoReemplazo === "si";

    const editModal = new bootstrap.Modal(
      document.getElementById("editProductModal")
    );
    editModal.show();
  } catch (error) {
    console.error("Error al preparar edición:", error);
    alert("No se pudo cargar la info del producto.");
  }
}

// --- FUNCIÓN PRINCIPAL DE INICIALIZACIÓN ---
export function loadProductosAsegurables() {
  console.log("Módulo de Productos Asegurables con filtros y CRUD cargado.");

  // Elementos de la interfaz
  const container = document.getElementById("product-cards-container");
  const searchInput = document.getElementById("product-search-input");
  const categoryFilter = document.getElementById("product-category-filter");
  const limitSelect = document.getElementById("product-limit-select");
  const paginationControls = document.getElementById(
    "product-pagination-controls"
  );

  const addProductModalEl = document.getElementById("addProductModal");
  const addProductForm = document.getElementById("add-product-form");
  const btnGuardarProducto = document.getElementById("btnGuardarProducto");

  const editProductModalEl = document.getElementById("editProductModal");
  const editProductForm = document.getElementById("edit-product-form");
  const btnActualizarProducto = document.getElementById(
    "btnActualizarProducto"
  );

  // Cargar datos iniciales y poblar filtros/modales
  fetchAndRenderProducts();
  populateSelects(
    { element: categoryFilter, type: "category-filter" },
    { element: document.getElementById("add-idCategoria"), type: "category" },
    {
      element: document.getElementById("add-idEmpresaProveedora"),
      type: "company",
    },
    { element: document.getElementById("edit-idCategoria"), type: "category" },
    {
      element: document.getElementById("edit-idEmpresaProveedora"),
      type: "company",
    }
  );

  // --- EVENT LISTENERS ---

  let searchTimeout;
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      viewState.searchTerm = searchInput.value;
      viewState.currentPage = 1;
      fetchAndRenderProducts();
    }, 300);
  });

  categoryFilter.addEventListener("change", () => {
    viewState.categoryId = categoryFilter.value;
    viewState.currentPage = 1;
    fetchAndRenderProducts();
  });

  limitSelect.addEventListener("change", () => {
    viewState.limit = parseInt(limitSelect.value, 10);
    viewState.currentPage = 1;
    fetchAndRenderProducts();
  });

  paginationControls.addEventListener("click", (event) => {
    event.preventDefault();
    const pageLink = event.target.closest(".page-link");
    if (pageLink && !pageLink.parentElement.classList.contains("disabled")) {
      viewState.currentPage = parseInt(pageLink.dataset.page, 10);
      fetchAndRenderProducts();
    }
  });

  // Delegación de eventos para botones en las tarjetas
  container.addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const productId = button.dataset.id;
    if (!productId) return;

    if (button.classList.contains("btn-edit")) {
      openEditProductModal(productId);
    }

    if (button.classList.contains("btn-toggle-status")) {
      const newStatus = button.dataset.newStatus;
      if (confirm(`¿Seguro que deseas ${newStatus} este producto?`)) {
        try {
          const response = await fetch("../php/productos_api.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "update_status",
              id: productId,
              estado: newStatus,
            }),
          });
          const result = await response.json();
          if (result.success) await fetchAndRenderProducts();
          else throw new Error(result.message);
        } catch (error) {
          alert("Error al cambiar el estado: " + error.message);
        }
      }
    }
  });

  // Lógica para el modal de Añadir Producto
  btnGuardarProducto.addEventListener("click", async () => {
    if (!addProductForm.checkValidity()) {
      addProductForm.reportValidity();
      return;
    }
    const nuevoProducto = {
      action: "create_product",
      Pro_nombre: document.getElementById("add-Pro_nombre").value,
      Pro_precioMensual: document.getElementById("add-Pro_precioMensual").value,
      idCategoria: document.getElementById("add-idCategoria").value,
      idEmpresaProveedora: document.getElementById("add-idEmpresaProveedora")
        .value,
      Pro_descripcion: document.getElementById("add-Pro_descripcion").value,
      Pro_responsabilidadCivil: document.getElementById(
        "add-Pro_responsabilidadCivil"
      ).value,
      Pro_asistenciaVial: document.getElementById("add-Pro_asistenciaVial")
        .value,
      Pro_dañosColision: document.getElementById("add-Pro_dañosColision").value,
      Pro_gastosMedicos: document.getElementById("add-Pro_gastosMedicos").value,
      Pro_roboTotal: document.getElementById("add-Pro_roboTotal").checked
        ? "si"
        : "no",
      Pro_autoReemplazo: document.getElementById("add-Pro_autoReemplazo")
        .checked
        ? "si"
        : "no",
    };
    try {
      const response = await fetch("../php/productos_api.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoProducto),
      });
      const result = await response.json();
      if (result.success) {
        bootstrap.Modal.getInstance(addProductModalEl).hide();
        addProductForm.reset();
        await fetchAndRenderProducts();
        alert("¡Producto guardado!");
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      alert("Error al guardar: " + error.message);
    }
  });

  // Lógica para el modal de Editar Producto
  btnActualizarProducto.addEventListener("click", async () => {
    if (!editProductForm.checkValidity()) {
      editProductForm.reportValidity();
      return;
    }
    const productoActualizado = {
      action: "update_product",
      idproducto: document.getElementById("edit-idproducto").value,
      Pro_nombre: document.getElementById("edit-Pro_nombre").value,
      Pro_precioMensual: document.getElementById("edit-Pro_precioMensual")
        .value,
      idCategoria: document.getElementById("edit-idCategoria").value,
      idEmpresaProveedora: document.getElementById("edit-idEmpresaProveedora")
        .value,
      Pro_descripcion: document.getElementById("edit-Pro_descripcion").value,
      Pro_responsabilidadCivil: document.getElementById(
        "edit-Pro_responsabilidadCivil"
      ).value,
      Pro_asistenciaVial: document.getElementById("edit-Pro_asistenciaVial")
        .value,
      Pro_dañosColision: document.getElementById("edit-Pro_dañosColision")
        .value,
      Pro_gastosMedicos: document.getElementById("edit-Pro_gastosMedicos")
        .value,
      Pro_roboTotal: document.getElementById("edit-Pro_roboTotal").checked
        ? "si"
        : "no",
      Pro_autoReemplazo: document.getElementById("edit-Pro_autoReemplazo")
        .checked
        ? "si"
        : "no",
    };
    try {
      const response = await fetch("../php/productos_api.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productoActualizado),
      });
      const result = await response.json();
      if (result.success) {
        bootstrap.Modal.getInstance(editProductModalEl).hide();
        await fetchAndRenderProducts();
        alert("¡Producto actualizado!");
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      alert("Error al actualizar: " + error.message);
    }
  });
}

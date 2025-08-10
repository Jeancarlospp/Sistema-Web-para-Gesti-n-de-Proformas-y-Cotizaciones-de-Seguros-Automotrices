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

// --- CONTROL DE PERMISOS POR ROL ---
let userPermissions = {
  canEdit: false,
  canAdd: false,
  canToggleStatus: false
};

/**
 * Inicializa los permisos del usuario basado en su rol
 */
async function initializeUserPermissions() {
  try {
    console.log('🔍 Verificando permisos del usuario...');
    const response = await fetch('../PHP/check_session.php');
    const data = await response.json();
    
    console.log('📋 Respuesta del servidor:', data);
    
    if (data.status === 'active' && data.user) {
      const userRole = data.user.Usr_rol;
      
      console.log(`👤 Rol del usuario detectado: ${userRole}`);
      
      // Configurar permisos según el rol
      switch(userRole) {
        case 'Administrador':
          userPermissions = {
            canEdit: true,
            canAdd: true,
            canToggleStatus: true
          };
          break;
        case 'Asesor':
          userPermissions = {
            canEdit: false,
            canAdd: false,
            canToggleStatus: false
          };
          break;
        default:
          userPermissions = {
            canEdit: false,
            canAdd: false,
            canToggleStatus: false
          };
      }
      
      console.log(`🔐 Permisos configurados para rol: ${userRole}`, userPermissions);
    } else {
      console.warn('⚠️ No se pudo obtener información del usuario:', data);
    }
  } catch (error) {
    console.error('❌ Error al verificar permisos:', error);
    // En caso de error, denegar todos los permisos
    userPermissions = {
      canEdit: false,
      canAdd: false,
      canToggleStatus: false
    };
  }
}

/**
 * Aplica restricciones de interfaz basadas en el rol del usuario
 */
function applyRoleBasedRestrictions() {
  const addButton = document.getElementById('btnAgregarProducto');
  const pageTitle = document.querySelector('.page-heading h3');
  
  // Controlar visibilidad del botón "Agregar Producto"
  if (addButton) {
    if (userPermissions.canAdd) {
      addButton.style.display = 'inline-block';
    } else {
      addButton.style.display = 'none';
    }
  }
  
  // Mostrar mensaje informativo para Asesores
  if (!userPermissions.canEdit) {
    // Cambiar título de la página
    if (pageTitle) {
      pageTitle.textContent = 'Catálogo de Productos - Consulta';
    }
    
    const pageHeading = document.querySelector('.page-heading');
    if (pageHeading) {
      const infoDiv = document.createElement('div');
      infoDiv.className = 'alert alert-info mb-3';
      infoDiv.innerHTML = `
        <i class="bi bi-info-circle me-2"></i>
        <strong>Modo Consulta:</strong> Tienes acceso de solo lectura a los productos asegurables. 
        Puedes consultar todos los detalles para asesorar a tus clientes.
      `;
      
      // Insertar después del page-heading
      pageHeading.parentNode.insertBefore(infoDiv, pageHeading.nextSibling);
    }
    
    // Agregar estilos CSS para tarjetas clicables
    const style = document.createElement('style');
    style.textContent = `
      .asesor-clickable {
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }
      .asesor-clickable:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(0,123,255,0.3) !important;
        border-color: #007bff;
      }
    `;
    document.head.appendChild(style);
  } else {
    // Para administradores, mantener el título original
    if (pageTitle) {
      pageTitle.textContent = 'Catálogo de Productos Asegurables';
    }
  }
}

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
      product.Pro_estado === "activo" ? "btn-warning" : "btn-success";
    const actionButtonIcon =
      product.Pro_estado === "activo" ? "bi-pause-circle" : "bi-play-circle";

    // Generar botones de acción según permisos
    let actionButtonsHtml = '';
    if (userPermissions.canEdit || userPermissions.canToggleStatus) {
      actionButtonsHtml = '<div class="btn-group" role="group">';
      
      if (userPermissions.canEdit) {
        actionButtonsHtml += `
          <button class="btn btn-sm btn-info btn-edit" data-id="${product.idproducto}" title="Editar Producto">
            <i class="bi bi-pencil"></i>
          </button>
        `;
      }
      
      if (userPermissions.canToggleStatus) {
        actionButtonsHtml += `
          <button class="btn btn-sm ${estadoButtonClass} btn-toggle-status" 
                  data-id="${product.idproducto}" 
                  data-new-status="${product.Pro_estado === "activo" ? "inactivo" : "activo"}" 
                  title="${estadoButtonText} Producto">
            <i class="bi ${actionButtonIcon}"></i>
          </button>
        `;
      }
      
      actionButtonsHtml += '</div>';
    } else {
      // Para usuarios sin permisos, mostrar mensaje informativo más detallado
      actionButtonsHtml = '<div class="text-center"><small class="text-muted"><i class="bi bi-eye me-1"></i>Solo consulta</small></div>';
    }

    const cardHtml = `
            <div class="col-12 col-md-6 col-lg-4 mb-4">
                <div class="card h-100 shadow-sm ${!userPermissions.canEdit ? 'asesor-clickable' : ''}" ${!userPermissions.canEdit ? `data-product-id="${product.idproducto}"` : ''}>
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
                    <div class="card-footer d-flex justify-content-between align-items-center">
                        <h4 class="mb-0">$${parseFloat(product.Pro_precioMensual).toFixed(2)}</h4>
                        ${actionButtonsHtml}
                        ${!userPermissions.canEdit ? '<small class="text-primary"><i class="bi bi-cursor-fill me-1"></i>Click para ver detalles</small>' : ''}
                    </div>
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
      `../PHP/productos_api.php?${params.toString()}`
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
      fetch("../PHP/productos_api.php?action=get_categories").then((res) =>
        res.json()
      ),
      fetch("../PHP/productos_api.php?action=get_empresas").then((res) => res.json()),
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
export async function loadProductosAsegurables() {
  console.log("🚀 Inicializando Gestión de Productos...");
  
  // Verificar permisos del usuario
  await initializeUserPermissions();
  
  // Aplicar restricciones de interfaz según el rol
  applyRoleBasedRestrictions();

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

  // Poblar selects de categorías y empresas
  await loadFormSelects();
  
  // Cargar productos inicialmente
  await fetchAndRenderProducts();
  
  console.log("✅ Gestión de Productos inicializada correctamente");

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

  // Event listener para cálculo automático del precio total
  setupAutomaticCalculations();

  // Event listener para validación del formulario
  setupFormValidation();

  container.addEventListener("click", async (event) => {
    // Verificar si es un clic en tarjeta para Asesor (solo consulta)
    const card = event.target.closest('.asesor-clickable');
    if (card && !userPermissions.canEdit) {
      const productId = card.dataset.productId;
      if (productId) {
        showProductInfoModal(productId);
        return;
      }
    }
    
    // Manejo de botones de acción (solo para usuarios con permisos)
    const button = event.target.closest("button");
    if (!button) return;
    const productId = button.dataset.id;
    if (!productId) return;

    if (button.classList.contains("btn-edit")) {
      // Verificar permisos para editar
      if (!userPermissions.canEdit) {
        alert("No tienes permisos para editar productos.");
        return;
      }
      openEditProductModal(productId);
    }

    if (button.classList.contains("btn-toggle-status")) {
      // Verificar permisos para cambiar estado
      if (!userPermissions.canToggleStatus) {
        alert("No tienes permisos para cambiar el estado de productos.");
        return;
      }
      
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

  btnGuardarProducto.addEventListener("click", async () => {
    // Verificar permisos para agregar productos
    if (!userPermissions.canAdd) {
      alert("No tienes permisos para agregar productos.");
      return;
    }
    
    const form = document.getElementById("formNuevoProducto");
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Mostrar indicador de carga
    const originalText = btnGuardarProducto.innerHTML;
    btnGuardarProducto.innerHTML = '<i class="bi bi-hourglass-split me-1"></i>Guardando...';
    btnGuardarProducto.disabled = true;

    try {
      const nuevoProducto = {
        action: "create_product",
        Pro_nombre: document.getElementById("nombreProducto").value.trim(),
        Pro_descripcion: document.getElementById("descripcionProducto").value.trim(),
        Pro_precioMensual: parseFloat(document.getElementById("precioMensual").value),
        Pro_mesesCobertura: parseInt(document.getElementById("mesesCobertura").value) || 12,
        Pro_precioTotal: parseFloat(document.getElementById("precioTotal").value),
        Pro_responsabilidadCivil: parseFloat(document.getElementById("responsabilidadCivil").value) || null,
        Pro_dañosColision: parseFloat(document.getElementById("danosColision").value) || null,
        Pro_gastosLegales: parseFloat(document.getElementById("gastosLegales").value) || null,
        Pro_gastosMedicos: parseFloat(document.getElementById("gastosMedicos").value) || null,
        Pro_roboTotal: document.querySelector('input[name="roboTotal"]:checked').value,
        Pro_autoReemplazo: document.querySelector('input[name="autoReemplazo"]:checked').value,
        Pro_asistenciaVial: document.getElementById("asistenciaVial").value,
        idCategoria: parseInt(document.getElementById("categoriaProducto").value),
        idEmpresaProveedora: parseInt(document.getElementById("empresaProducto").value),
        Pro_estado: document.getElementById("estadoProducto").value
      };

      console.log('📝 Datos del producto a crear:', nuevoProducto);

      const response = await fetch("../PHP/productos_api.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoProducto),
      });

      const result = await response.json();
      console.log('📥 Respuesta del servidor:', result);

      if (result.success) {
        bootstrap.Modal.getInstance(addProductModalEl).hide();
        resetAddProductForm();
        await fetchAndRenderProducts();
        
        // Mostrar mensaje de éxito
        showSuccessMessage("¡Producto guardado exitosamente!");
      } else {
        throw new Error(result.message || "Error desconocido al guardar el producto");
      }
    } catch (error) {
      console.error("Error al guardar producto:", error);
      showErrorMessage("Error al guardar el producto: " + error.message);
    } finally {
      // Restaurar botón
      btnGuardarProducto.innerHTML = originalText;
      btnGuardarProducto.disabled = false;
    }
  });

  btnActualizarProducto.addEventListener("click", async () => {
    // Verificar permisos para editar productos
    if (!userPermissions.canEdit) {
      alert("No tienes permisos para editar productos.");
      return;
    }
    
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

/**
 * Muestra un modal con información detallada del producto (para Asesores)
 */
async function showProductInfoModal(productId) {
  try {
    console.log('📋 Mostrando información del producto:', productId);
    
    const response = await fetch(`../php/productos_api.php?action=get_product&id=${productId}`);
    const result = await response.json();
    
    if (result.success && result.product) {
      const product = result.product;
      
      // Llenar información general
      document.getElementById('view-producto-nombre').textContent = product.Pro_nombre;
      document.getElementById('view-producto-categoria').textContent = product.nombre_categoria || 'N/A';
      document.getElementById('view-producto-empresa').textContent = product.nombre_empresa || 'N/A';
      document.getElementById('view-producto-precio').textContent = `$${parseFloat(product.Pro_precioMensual).toFixed(2)}`;
      document.getElementById('view-producto-descripcion').textContent = product.Pro_descripcion;
      
      // Estado con badge
      const estadoBadge = document.getElementById('view-producto-estado');
      estadoBadge.textContent = product.Pro_estado;
      estadoBadge.className = `badge ${product.Pro_estado === 'activo' ? 'bg-success' : 'bg-secondary'}`;
      
      // Llenar coberturas
      const coberturasContainer = document.getElementById('view-producto-coberturas');
      const coberturas = [
        { label: "Meses de Cobertura", value: product.Pro_mesesCobertura, unit: " meses" },
        { label: "Responsabilidad Civil", value: product.Pro_responsabilidadCivil, unit: "$" },
        { label: "Robo Total", value: product.Pro_roboTotal },
        { label: "Asistencia Vial", value: product.Pro_asistenciaVial },
        { label: "Daños por Colisión", value: product.Pro_dañosColision, unit: "$" },
        { label: "Auto de Reemplazo", value: product.Pro_autoReemplazo },
        { label: "Gastos Legales", value: product.Pro_gastosLegales, unit: "$" },
        { label: "Gastos Médicos", value: product.Pro_gastosMedicos, unit: "$" }
      ];
      
      let coberturasHtml = '<ul class="list-group list-group-flush">';
      coberturas.forEach(cobertura => {
        let content = `<i class="bi bi-x-circle text-danger me-2"></i> ${cobertura.label}`;
        if (cobertura.value && cobertura.value !== "no" && cobertura.value != 0) {
          let displayValue = cobertura.value;
          if (cobertura.unit === "$" && !isNaN(parseFloat(cobertura.value))) {
            displayValue = `$${parseFloat(cobertura.value).toLocaleString("es-EC")}`;
          } else if (cobertura.unit) {
            displayValue = `${cobertura.value}${cobertura.unit}`;
          } else if (cobertura.value === "si") {
            displayValue = "Incluido";
          }
          content = `<i class="bi bi-check-circle-fill text-success me-2"></i> ${cobertura.label}: <strong>${displayValue}</strong>`;
        }
        coberturasHtml += `<li class="list-group-item py-2 px-0 border-0">${content}</li>`;
      });
      coberturasHtml += '</ul>';
      
      coberturasContainer.innerHTML = coberturasHtml;
      
      // Mostrar el modal
      const viewModal = new bootstrap.Modal(document.getElementById('viewProductModal'));
      viewModal.show();
      
    } else {
      throw new Error(result.message || 'No se pudo obtener la información del producto');
    }
  } catch (error) {
    console.error('Error al mostrar información del producto:', error);
    alert('No se pudo cargar la información del producto: ' + error.message);
  }
}

/**
 * Carga los selects de categorías y empresas
 */
async function loadFormSelects() {
  try {
    console.log('🔄 Cargando categorías y empresas...');
    
    const [categoriesResponse, empresasResponse] = await Promise.all([
      fetch("../PHP/productos_api.php?action=get_categories"),
      fetch("../PHP/productos_api.php?action=get_empresas")
    ]);

    const categories = await categoriesResponse.json();
    const empresas = await empresasResponse.json();

    console.log('📊 Categorías cargadas:', categories);
    console.log('🏢 Empresas cargadas:', empresas);

    // Poblar select de categorías (filtro)
    const categoryFilter = document.getElementById("product-category-filter");
    if (categoryFilter) {
      categoryFilter.innerHTML = '<option value="">Todas las categorías</option>';
      categories.forEach(cat => {
        categoryFilter.innerHTML += `<option value="${cat.idcategoria}">${cat.Cat_nombre}</option>`;
      });
    }

    // Poblar select de categorías (modal agregar)
    const categoriaProducto = document.getElementById("categoriaProducto");
    if (categoriaProducto) {
      categoriaProducto.innerHTML = '<option value="">Seleccione una categoría...</option>';
      categories.forEach(cat => {
        categoriaProducto.innerHTML += `<option value="${cat.idcategoria}">${cat.Cat_nombre}</option>`;
      });
    }

    // Poblar select de empresas (modal agregar)
    const empresaProducto = document.getElementById("empresaProducto");
    if (empresaProducto) {
      empresaProducto.innerHTML = '<option value="">Seleccione una empresa...</option>';
      empresas.forEach(emp => {
        empresaProducto.innerHTML += `<option value="${emp.idEmpresas_Proveedora}">${emp.Emp_nombre}</option>`;
      });
    }

    console.log('✅ Selects cargados correctamente');
    
  } catch (error) {
    console.error('❌ Error al cargar selects:', error);
    showErrorMessage('Error al cargar las opciones del formulario');
  }
}

/**
 * Configura los cálculos automáticos del formulario
 */
function setupAutomaticCalculations() {
  const precioMensual = document.getElementById("precioMensual");
  const mesesCobertura = document.getElementById("mesesCobertura");
  const precioTotal = document.getElementById("precioTotal");

  function calcularPrecioTotal() {
    const mensual = parseFloat(precioMensual.value) || 0;
    const meses = parseInt(mesesCobertura.value) || 12;
    const total = mensual * meses;
    
    precioTotal.value = total.toFixed(2);
  }

  if (precioMensual && mesesCobertura && precioTotal) {
    precioMensual.addEventListener('input', calcularPrecioTotal);
    mesesCobertura.addEventListener('input', calcularPrecioTotal);
    
    // Calcular inicialmente
    calcularPrecioTotal();
  }
}

/**
 * Configura la validación del formulario
 */
function setupFormValidation() {
  const form = document.getElementById("formNuevoProducto");
  
  if (form) {
    // Validación personalizada para campos numéricos
    const numericInputs = form.querySelectorAll('input[type="number"]');
    numericInputs.forEach(input => {
      input.addEventListener('input', function() {
        if (this.value < 0) {
          this.setCustomValidity('El valor no puede ser negativo');
        } else {
          this.setCustomValidity('');
        }
      });
    });

    // Validación para campos requeridos
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      
      if (!this.checkValidity()) {
        e.stopPropagation();
        this.classList.add('was-validated');
      }
    });
  }
}

/**
 * Resetea el formulario de agregar producto
 */
function resetAddProductForm() {
  const form = document.getElementById("formNuevoProducto");
  if (form) {
    form.reset();
    form.classList.remove('was-validated');
    
    // Resetear valores por defecto
    document.getElementById("mesesCobertura").value = 12;
    document.getElementById("estadoProducto").value = 'activo';
    document.getElementById("asistenciaVial").value = 'basica';
    document.querySelector('#roboNo').checked = true;
    document.querySelector('#reemplazoNo').checked = true;
    
    // Limpiar precio total
    document.getElementById("precioTotal").value = '';
  }
}

/**
 * Muestra un mensaje de éxito
 */
function showSuccessMessage(message) {
  // Usar Toast de Bootstrap si está disponible, sino usar alert
  if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
    showToast(message, 'success');
  } else {
    alert(message);
  }
}

/**
 * Muestra un mensaje de error
 */
function showErrorMessage(message) {
  // Usar Toast de Bootstrap si está disponible, sino usar alert
  if (typeof bootstrap !== 'undefined' && bootstrap.Toast) {
    showToast(message, 'error');
  } else {
    alert(message);
  }
}

/**
 * Función auxiliar para mostrar toasts
 */
function showToast(message, type = 'info') {
  // Crear container de toasts si no existe
  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
    toastContainer.style.zIndex = '9999';
    document.body.appendChild(toastContainer);
  }

  // Crear toast
  const toastId = 'toast-' + Date.now();
  const bgClass = type === 'success' ? 'bg-success' : type === 'error' ? 'bg-danger' : 'bg-info';
  const iconClass = type === 'success' ? 'bi-check-circle' : type === 'error' ? 'bi-exclamation-triangle' : 'bi-info-circle';

  const toastHtml = `
    <div id="${toastId}" class="toast ${bgClass} text-white" role="alert">
      <div class="toast-body d-flex align-items-center">
        <i class="bi ${iconClass} me-2"></i>
        ${message}
        <button type="button" class="btn-close btn-close-white ms-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>
  `;

  toastContainer.insertAdjacentHTML('beforeend', toastHtml);
  
  // Mostrar toast
  const toastElement = document.getElementById(toastId);
  const toast = new bootstrap.Toast(toastElement, { delay: 4000 });
  toast.show();
  
  // Limpiar después de mostrar
  toastElement.addEventListener('hidden.bs.toast', () => {
    toastElement.remove();
  });
}

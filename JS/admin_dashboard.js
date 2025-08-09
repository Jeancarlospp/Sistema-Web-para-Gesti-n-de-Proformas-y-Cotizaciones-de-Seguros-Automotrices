/**
 * js/adminDashboard.js
 * Lógica para la página: Dashboard del Administrador.
 * Implementa paginación, ordenamiento y carga dinámica de la tabla de usuarios.
 */

// --- ESTADO GLOBAL DE LA TABLA ---
let dashboardState = {
  currentPage: 1,
  limit: 5, // Mostrar 5 por defecto
  sortBy: "ultimo_login DESC", // Carga inicial por más recientes
  totalRecords: 0,
};

// --- FUNCIONES DE RENDERIZADO (MANEJO DEL DOM) ---

/**
 * Dibuja las filas de la tabla de usuarios.
 * @param {Array} users - La lista de usuarios a mostrar.
 * @param {HTMLElement} tableBody - El elemento <tbody> de la tabla.
 */
function renderUserTable(users, tableBody) {
  tableBody.innerHTML = "";
  if (!users || users.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="6" class="text-center text-muted">No se encontraron usuarios.</td></tr>';
    return;
  }

  const tableRowsHtml = users
    .map((user) => {
      const userRoleFormatted =
        (user.rol || "N/A").charAt(0).toUpperCase() +
        (user.rol || "N/A").slice(1);
      const lastLoginFormatted = user.ultimo_login
        ? new Date(user.ultimo_login).toLocaleString("es-ES", {
            dateStyle: "medium",
            timeStyle: "short",
          })
        : "Nunca";

      return `
            <tr>
                <td>${user.id_usuario}</td>
                <td>${user.nombre}</td>
                <td>${user.cedula || "N/A"}</td>
                <td>${user.correo}</td>
                <td><span class="badge bg-primary">${userRoleFormatted}</span></td>
                <td>${lastLoginFormatted}</td>
            </tr>
        `;
    })
    .join("");

  tableBody.innerHTML = tableRowsHtml;
}

/**
 * Dibuja los botones de control de paginación.
 * @param {HTMLElement} container - El elemento <nav> que contendrá los botones.
 */
function renderPaginationControls(container) {
  const totalPages = Math.ceil(
    dashboardState.totalRecords / dashboardState.limit
  );
  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let buttonsHtml = '<ul class="pagination pagination-sm mb-0">';
  buttonsHtml += `<li class="page-item ${
    dashboardState.currentPage === 1 ? "disabled" : ""
  }"><a class="page-link" href="#" data-page="${
    dashboardState.currentPage - 1
  }">Anterior</a></li>`;

  // Lógica para mostrar un rango de páginas en lugar de todas
  const pagesToShow = 3;
  let startPage = Math.max(
    1,
    dashboardState.currentPage - Math.floor(pagesToShow / 2)
  );
  let endPage = Math.min(totalPages, startPage + pagesToShow - 1);

  if (endPage - startPage + 1 < pagesToShow) {
    startPage = Math.max(1, endPage - pagesToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    buttonsHtml += `<li class="page-item ${
      dashboardState.currentPage === i ? "active" : ""
    }"><a class="page-link" href="#" data-page="${i}">${i}</a></li>`;
  }

  buttonsHtml += `<li class="page-item ${
    dashboardState.currentPage === totalPages ? "disabled" : ""
  }"><a class="page-link" href="#" data-page="${
    dashboardState.currentPage + 1
  }">Siguiente</a></li>`;
  buttonsHtml += "</ul>";
  container.innerHTML = buttonsHtml;
}

/**
 * Actualiza el texto informativo de la paginación (ej. "Mostrando 1-5 de 20").
 * @param {HTMLElement} element - El elemento <span> que mostrará la información.
 */
function updatePaginationInfo(element) {
  if (dashboardState.totalRecords === 0) {
    element.textContent = "No hay registros";
    return;
  }
  const start = (dashboardState.currentPage - 1) * dashboardState.limit + 1;
  const end = Math.min(
    start + dashboardState.limit - 1,
    dashboardState.totalRecords
  );
  element.textContent = `Mostrando ${start} a ${end} de ${dashboardState.totalRecords} registros`;
}

// --- LÓGICA DE DATOS (COMUNICACIÓN CON API) ---

/**
 * Realiza la petición a la API para obtener y luego renderizar los usuarios.
 */
async function fetchAndRenderUsers() {
  const userTableBody = document.getElementById("user-table-body");
  const paginationControls = document.getElementById("pagination-controls");
  const paginationInfo = document.getElementById("pagination-info");

  if (!userTableBody || !paginationInfo || !paginationControls) {
    console.error("Faltan elementos del DOM para la paginación de usuarios.");
    return;
  }

  userTableBody.innerHTML =
    '<tr><td colspan="6" class="text-center">Cargando usuarios...</td></tr>';

  const params = new URLSearchParams({
    page: dashboardState.currentPage,
    limit: dashboardState.limit,
    sort_by: dashboardState.sortBy,
  });

  try {
    const response = await fetch(
      `../php/usuarios_api.php?${params.toString()}`
    );
    if (!response.ok) throw new Error(`Error de red: ${response.statusText}`);

    const responseData = await response.json();

    // Validar que la respuesta tiene la estructura esperada
    if (
      typeof responseData.total === "undefined" ||
      !Array.isArray(responseData.data)
    ) {
      throw new Error(
        "La respuesta de la API no tiene el formato esperado {total, data}."
      );
    }

    const users = responseData.data;
    dashboardState.totalRecords = responseData.total;

    renderUserTable(users, userTableBody);
    renderPaginationControls(paginationControls);
    updatePaginationInfo(paginationInfo);
  } catch (error) {
    console.error("Error al cargar la lista de usuarios:", error);
    userTableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">No se pudieron cargar los datos. Error: ${error.message}</td></tr>`;
  }
}

// --- FUNCIÓN PRINCIPAL EXPORTADA ---

/**
 * Inicializa la lógica del dashboard del administrador.
 */
export function loadAdminDashboard() {
  console.log("Cargando dashboard de administrador con paginación...");

  const limitSelect = document.getElementById("limit-select");
  const sortSelect = document.getElementById("sort-select");
  const paginationControls = document.getElementById("pagination-controls");

  // Verificar si los elementos existen antes de añadir listeners
  if (!limitSelect || !sortSelect || !paginationControls) {
    console.error(
      "Error crítico: Faltan elementos de control (limit, sort, pagination) en el DOM."
    );
    return;
  }

  // Carga inicial de datos
  fetchAndRenderUsers();

  // --- EVENT LISTENERS ---

  // Listener para el selector de límite de resultados
  limitSelect.addEventListener("change", () => {
    dashboardState.limit = parseInt(limitSelect.value, 10);
    dashboardState.currentPage = 1; // Volver a la primera página
    fetchAndRenderUsers();
  });

  // Listener para el selector de ordenamiento
  sortSelect.addEventListener("change", () => {
    dashboardState.sortBy = sortSelect.value;
    dashboardState.currentPage = 1; // Volver a la primera página
    fetchAndRenderUsers();
  });

  // Listener para los botones de paginación (usando delegación de eventos)
  paginationControls.addEventListener("click", (event) => {
    event.preventDefault();
    const pageLink = event.target.closest("a.page-link");
    if (pageLink && !pageLink.parentElement.classList.contains("disabled")) {
      const newPage = parseInt(pageLink.dataset.page, 10);
      if (newPage !== dashboardState.currentPage) {
        dashboardState.currentPage = newPage;
        fetchAndRenderUsers();
      }
    }
  });
}

/**
 * js/gestionUsuarios.js
 * Lógica completa con Paginación, Búsqueda, Ordenamiento y CRUD para la Gestión de Usuarios.
 */

// --- ESTADO GLOBAL DE LA TABLA ---
let tableState = {
  currentPage: 1,
  limit: 10,
  searchTerm: "",
  sortBy: "nombre ASC",
  totalRecords: 0,
};

// --- RENDERIZADO Y LÓGICA DE LA INTERFAZ ---

/** Dibuja las filas de la tabla con los datos de la página actual. */
function renderUsersTable(users, tableBody) {
  tableBody.innerHTML = "";
  if (!users || users.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="7" class="text-center text-muted">No se encontraron usuarios que coincidan con los criterios.</td></tr>';
    return;
  }
  users.forEach((user) => {
    const estadoBadge =
      user.estado === "activo"
        ? '<span class="badge bg-success">Activo</span>'
        : '<span class="badge bg-danger">Inactivo</span>';
    const actionButtonText =
      user.estado === "activo" ? "Desactivar" : "Activar";
    const actionButtonClass =
      user.estado === "activo" ? "btn-warning" : "btn-success";
    const actionButtonIcon =
      user.estado === "activo" ? "bi-pause-circle" : "bi-play-circle";
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${user.id_usuario}</td>
            <td>${user.nombre}</td>
            <td>${user.cedula || "N/A"}</td>
            <td>${user.correo}</td>
            <td><span class="badge bg-primary">${user.rol}</span></td>
            <td>${estadoBadge}</td>
            <td>
                <button class="btn btn-sm btn-info btn-edit" data-id="${
                  user.id_usuario
                }" title="Editar Usuario"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm ${actionButtonClass} btn-toggle-on ms-1" 
                data-id="${user.id_usuario}" 
                data-new-status="${
                user.estado === "activo" ? "inactivo" : "activo"
                }" 
                title="${actionButtonText} Usuario">
                    <i class="bi ${actionButtonIcon}"></i>
                </button>
            </td>`;
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
    element.textContent = "No hay registros";
    return;
  }
  const start = (tableState.currentPage - 1) * tableState.limit + 1;
  const end = Math.min(start + tableState.limit - 1, tableState.totalRecords);
  element.textContent = `Mostrando ${start} a ${end} de ${tableState.totalRecords} registros`;
}

// --- LÓGICA DE DATOS ---

/** Función principal para obtener datos de la API aplicando filtros. */
async function fetchAndRenderUsers() {
  const tableBody = document.getElementById("all-users-table");
  const controls = document.getElementById("pagination-controls");
  const info = document.getElementById("pagination-info");
  if (!tableBody || !controls || !info) return;
  tableBody.innerHTML =
    '<tr><td colspan="7" class="text-center">Cargando usuarios...</td></tr>';

  const params = new URLSearchParams({
    page: tableState.currentPage,
    limit: tableState.limit,
    sort_by: tableState.sortBy,
    search: tableState.searchTerm,
  });

  try {
    const response = await fetch(
      `../php/usuarios_api.php?${params.toString()}`
    );
    if (!response.ok)
      throw new Error("La respuesta de la red no fue correcta.");
    const data = await response.json();

    tableState.totalRecords = data.total;
    renderUsersTable(data.data, tableBody);
    renderPaginationControls(controls);
    updatePaginationInfo(info);
  } catch (error) {
    console.error("Error al cargar usuarios:", error);
    tableBody.innerHTML =
      '<tr><td colspan="7" class="text-center text-danger">Error al cargar usuarios.</td></tr>';
  }
}

/** Pobla los selects de los modales. */
async function populateRolesSelects(...elements) {
  try {
    const response = await fetch("../php/roles_api.php");
    if (!response.ok) throw new Error("No se pudieron cargar los roles.");
    const roles = await response.json();

    elements.forEach((selectElement) => {
      if (selectElement) {
        selectElement.innerHTML =
          '<option value="" disabled selected>-- Seleccione un rol --</option>';
        roles.forEach((rol) => {
          selectElement.innerHTML += `<option value="${rol.id}">${rol.nombre}</option>`;
        });
      }
    });
  } catch (error) {
    console.error("Error al poblar roles:", error);
    elements.forEach((el) => {
      if (el) el.innerHTML = '<option value="">Error</option>';
    });
  }
}

/** Abre y llena el modal de edición. */
async function openEditModal(userId) {
  try {
    const response = await fetch(`../php/usuarios_api.php?id=${userId}`);
    if (!response.ok)
      throw new Error("No se pudo obtener la info del usuario.");
    const user = await response.json();
    if (!user || user.error)
      throw new Error(user.error || "Usuario no encontrado.");

    document.getElementById("edit-userId").value = user.id_usuario;
    document.getElementById("edit-userName").value = user.nombre;
    document.getElementById("edit-userCedula").value = user.cedula;
    document.getElementById("edit-userEmail").value = user.correo;
    document.getElementById("edit-userRole").value = user.rol_id;
    document.getElementById("edit-userPassword").value = "";

    const editModal = new bootstrap.Modal(
      document.getElementById("editUserModal")
    );
    editModal.show();
  } catch (error) {
    console.error("Error al preparar edición:", error);
    alert("No se pudo cargar la info para editar.");
  }
}

// --- FUNCIÓN PRINCIPAL DE INICIALIZACIÓN ---
export function loadGestionUsuarios() {
  console.log("Módulo de Gestión de Usuarios con paginación cargado.");

  const usersTableBody = document.getElementById("all-users-table");
  const searchInput = document.getElementById("search-input");
  const sortSelect = document.getElementById("sort-select");
  const limitSelect = document.getElementById("limit-select");
  const paginationControls = document.getElementById("pagination-controls");

  const addUserModalEl = document.getElementById("addUserModal");
  const addUserForm = document.getElementById("add-user-form");
  const btnSaveUser = document.getElementById("btn-save-user");

  const editUserModalEl = document.getElementById("editUserModal");
  const editUserForm = document.getElementById("edit-user-form");
  const btnUpdateUser = document.getElementById("btn-update-user");

  if (
    !usersTableBody ||
    !searchInput ||
    !sortSelect ||
    !limitSelect ||
    !paginationControls ||
    !addUserModalEl ||
    !addUserForm ||
    !btnSaveUser ||
    !editUserModalEl ||
    !editUserForm ||
    !btnUpdateUser
  ) {
    console.error(
      "Faltan elementos HTML críticos en la página. La funcionalidad completa no puede ser inicializada."
    );
    return;
  }

  fetchAndRenderUsers();
  populateRolesSelects(
    document.getElementById("add-userRole"),
    document.getElementById("edit-userRole")
  );

  // --- EVENT LISTENERS ---

  let searchTimeout;
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      tableState.searchTerm = searchInput.value;
      tableState.currentPage = 1;
      fetchAndRenderUsers();
    }, 300);
  });

  sortSelect.addEventListener("change", () => {
    tableState.sortBy = sortSelect.value;
    fetchAndRenderUsers();
  });

  limitSelect.addEventListener("change", () => {
    tableState.limit = parseInt(limitSelect.value, 10);
    tableState.currentPage = 1;
    fetchAndRenderUsers();
  });

  paginationControls.addEventListener("click", (event) => {
    event.preventDefault();
    const pageLink = event.target.closest(".page-link");
    if (pageLink && !pageLink.parentElement.classList.contains("disabled")) {
      tableState.currentPage = parseInt(pageLink.dataset.page, 10);
      fetchAndRenderUsers();
    }
  });

  usersTableBody.addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const userId = button.dataset.id;
    if (!userId) return;

    if (button.classList.contains("btn-edit")) {
      openEditModal(userId);
    }

    if (button.classList.contains("btn-toggle-status")) {
      const newStatus = button.dataset.newStatus;
      if (confirm(`¿Seguro que deseas ${newStatus} este usuario?`)) {
        try {
          const response = await fetch("../php/usuarios_api.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "update_estado",
              id: userId,
              estado: newStatus,
            }),
          });
          const result = await response.json();
          if (result.success) {
            await fetchAndRenderUsers();
          } else {
            throw new Error(result.message);
          }
        } catch (error) {
          alert("Error al cambiar estado: " + error.message);
        }
      }
    }
  });

  btnSaveUser.addEventListener("click", async () => {
    if (!addUserForm.checkValidity()) {
      addUserForm.reportValidity();
      return;
    }
    const newUser = {
      action: "create_user",
      nombre: document.getElementById("add-userName").value,
      cedula: document.getElementById("add-userCedula").value,
      correo: document.getElementById("add-userEmail").value,
      contrasena: document.getElementById("add-userPassword").value,
      rol_id: document.getElementById("add-userRole").value,
    };

    btnSaveUser.disabled = true;
    btnSaveUser.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...';
    try {
      const response = await fetch("../php/usuarios_api.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });
      const result = await response.json();
      if (result.success) {
        bootstrap.Modal.getInstance(addUserModalEl).hide();
        addUserForm.reset();
        await fetchAndRenderUsers();
        alert("¡Usuario creado!");
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      alert("Error al crear: " + error.message);
    } finally {
      btnSaveUser.disabled = false;
      btnSaveUser.innerHTML = "Guardar Usuario";
    }
  });

  btnUpdateUser.addEventListener("click", async () => {
    if (!editUserForm.checkValidity()) {
      editUserForm.reportValidity();
      return;
    }
    const updatedUser = {
      action: "update_user",
      id: document.getElementById("edit-userId").value,
      nombre: document.getElementById("edit-userName").value,
      cedula: document.getElementById("edit-userCedula").value,
      correo: document.getElementById("edit-userEmail").value,
      rol_id: document.getElementById("edit-userRole").value,
      contrasena: document.getElementById("edit-userPassword").value,
    };

    btnUpdateUser.disabled = true;
    btnUpdateUser.innerHTML =
      '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Actualizando...';
    try {
      const response = await fetch("../php/usuarios_api.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedUser),
      });
      const result = await response.json();
      if (result.success) {
        bootstrap.Modal.getInstance(editUserModalEl).hide();
        await fetchAndRenderUsers();
        alert("¡Usuario actualizado!");
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      alert("Error al actualizar: " + error.message);
    } finally {
      btnUpdateUser.disabled = false;
      btnUpdateUser.innerHTML = "Actualizar Usuario";
    }
  });
}

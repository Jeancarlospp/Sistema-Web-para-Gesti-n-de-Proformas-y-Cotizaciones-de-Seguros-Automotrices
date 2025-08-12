/**
 * js/gestionUsuarios.js
 * Lógica completa con Paginación, Búsqueda, Ordenamiento y CRUD para la Gestión de Usuarios.
 */

import {
  validarCedulaEcuatoriana,
  agregarValidacionCedula,
  agregarValidacionNombre,
  agregarValidacionEmail,
  agregarValidacionTextoSeguro,
} from "./validaciones.js";

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

/** Pobla los selects de los modales con los roles disponibles. */
async function populateRolesSelects(...elements) {
  try {
    console.log("Cargando roles desde la API...");
    const response = await fetch("../php/roles_api.php?action=get_roles");

    if (!response.ok) {
      throw new Error(
        `Error HTTP: ${response.status} - ${response.statusText}`
      );
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("Respuesta no es JSON:", text);
      throw new Error("La respuesta no es JSON válido");
    }

    const roles = await response.json();
    console.log("Roles recibidos:", roles);

    // Verificar si roles es un array
    if (!Array.isArray(roles)) {
      console.error("La respuesta no es un array de roles:", roles);
      throw new Error("Formato de respuesta inválido");
    }

    elements.forEach((selectElement) => {
      if (selectElement) {
        selectElement.innerHTML =
          '<option value="" disabled selected>-- Seleccione un rol --</option>';
        roles.forEach((rol) => {
          // Verificar que el rol tiene las propiedades necesarias
          if (rol.id && rol.nombre) {
            selectElement.innerHTML += `<option value="${rol.id}">${rol.nombre}</option>`;
          }
        });
        console.log(`Roles cargados en select: ${selectElement.id}`);
      }
    });
  } catch (error) {
    console.error("Error detallado al poblar roles:", error);
    elements.forEach((el) => {
      if (el) {
        el.innerHTML =
          '<option value="" disabled>Error al cargar roles</option>';
      }
    });

    // Mostrar alerta al usuario
    alert(
      "Error al cargar los roles. Por favor, recargue la página e intente nuevamente."
    );
  }
}

/** Abre y llena el modal de edición. */
async function openEditModal(userId) {
  try {
    console.log("Abriendo modal de edición para usuario ID:", userId);

    // Primero cargar los roles en el select del modal de edición
    const editRoleSelect = document.getElementById("edit-userRole");
    await populateRolesSelects(editRoleSelect);

    // Luego cargar los datos del usuario
    const response = await fetch(`../php/usuarios_api.php?id=${userId}`);
    if (!response.ok)
      throw new Error("No se pudo obtener la info del usuario.");

    const user = await response.json();
    if (!user || user.error)
      throw new Error(user.error || "Usuario no encontrado.");

    console.log("Datos del usuario cargados:", user);
        // Llenar los campos del formulario
    document.getElementById("edit-userId").value = user.id_usuario;
    document.getElementById("edit-userName").value = user.nombre;
    document.getElementById("edit-userCedula").value = user.cedula;
    document.getElementById("edit-userEmail").value = user.correo;
    document.getElementById("edit-userRole").value = user.rol_id;
    document.getElementById("edit-userPassword").value = "";

    // Bloquear campos según el rol del usuario actual
    const currentUserRole = localStorage.getItem("userRole");
    console.log("Rol detectado:", currentUserRole);
    // Si el rol es administrador, bloquear ciertos campos
    if (currentUserRole && currentUserRole.toLowerCase() === "administrador") {
      document.getElementById("edit-userName").readOnly = true;
      document.getElementById("edit-userCedula").readOnly = true;
    } // Si el rol es otro, permitir edición 
    else {
      document.getElementById("edit-userName").readOnly = false;
      document.getElementById("edit-userCedula").readOnly = false;
    }


    // Mostrar el modal
    const editModal = new bootstrap.Modal(
      document.getElementById("editUserModal")
    );
    editModal.show();
  } catch (error) {
    console.error("Error al preparar edición:", error);
    alert("No se pudo cargar la información para editar: " + error.message);
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

  // Cargar datos iniciales
  fetchAndRenderUsers();

  // --- EVENT LISTENERS ---

  // Event listener para cuando se abre el modal de añadir usuario
  addUserModalEl.addEventListener("show.bs.modal", async function (event) {
    console.log("Modal de añadir usuario se está abriendo...");
    const addRoleSelect = document.getElementById("add-userRole");
    await populateRolesSelects(addRoleSelect);
  });

  // Event listener para cuando se abre el modal de editar usuario
  editUserModalEl.addEventListener("show.bs.modal", function (event) {
    console.log("Modal de editar usuario se está abriendo...");
    // Los roles ya se cargan en openEditModal
  });

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

  // Delegación de eventos para botones de la tabla
  usersTableBody.addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const userId = button.dataset.id;
    if (!userId) return;

    if (button.classList.contains("btn-edit")) {
      await openEditModal(userId);
    }

    if (button.classList.contains("btn-toggle-on")) {
      const newStatus = button.dataset.newStatus;
      if (
        confirm(
          `¿Seguro que deseas ${
            newStatus === "activo" ? "activar" : "desactivar"
          } este usuario?`
        )
      ) {
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
            alert("¡Estado del usuario actualizado con éxito!");
          } else {
            throw new Error(result.message);
          }
        } catch (error) {
          alert("Error al cambiar el estado: " + error.message);
        }
      }
    }
  });

  btnSaveUser.addEventListener("click", async () => {
    if (!addUserForm.checkValidity()) {
      addUserForm.reportValidity();
      return;
    }

    // Validar cédula ecuatoriana antes del envío
    const cedula = document.getElementById("add-userCedula").value;
    if (!validarCedulaEcuatoriana(cedula)) {
      alert("Por favor, ingrese una cédula ecuatoriana válida");
      return;
    }

    const newUser = {
      action: "create_user",
      nombre: document.getElementById("add-userName").value,
      cedula: cedula,
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
        alert("¡Usuario creado con éxito!");
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      alert("Error al crear usuario: " + error.message);
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

    // Validar cédula ecuatoriana antes del envío
    const cedula = document.getElementById("edit-userCedula").value;
    if (!validarCedulaEcuatoriana(cedula)) {
      alert("Por favor, ingrese una cédula ecuatoriana válida");
      return;
    }

    const updatedUser = {
      action: "update_user",
      id: document.getElementById("edit-userId").value,
      nombre: document.getElementById("edit-userName").value,
      cedula: cedula,
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
        alert("¡Usuario actualizado con éxito!");
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      alert("Error al actualizar usuario: " + error.message);
    } finally {
      btnUpdateUser.disabled = false;
      btnUpdateUser.innerHTML = "Actualizar Usuario";
    }
  });

  // Agregar validaciones a los campos de cédula
  // Inicializar validaciones específicas en campos de formularios
  agregarValidacionCedula("add-userCedula");
  agregarValidacionCedula("edit-userCedula");
  agregarValidacionNombre("add-userName");
  agregarValidacionNombre("edit-userName");
  agregarValidacionEmail("add-userEmail");
  agregarValidacionEmail("edit-userEmail");
  agregarValidacionTextoSeguro("add-userPassword");
  agregarValidacionTextoSeguro("edit-userPassword");
}

/**
 * js/gestionClientes.js
 * Lógica avanzada con Paginación, Búsqueda, Ordenamiento y CRUD para la Gestión de Clientes.
 */

import {
  validarCedulaEcuatoriana,
  agregarValidacionCedula,
} from "./validaciones.js";

// --- ESTADO GLOBAL DE LA TABLA ---
let tableState = {
  currentPage: 1,
  limit: 10,
  searchTerm: "",
  sortBy: "Cli_nombre ASC",
  totalRecords: 0,
};

// --- RENDERIZADO Y LÓGICA DE LA INTERFAZ ---

/** Dibuja las filas de la tabla con los datos de la página actual. */
function renderClientTable(clients, tableBody) {
  tableBody.innerHTML = "";
  if (!clients || clients.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-muted">No se encontraron clientes que coincidan con los criterios.</td></tr>`;
    return;
  }
  clients.forEach((client) => {
    const estadoBadge =
      client.Cli_estado === "activo"
        ? '<span class="badge bg-success">Activo</span>'
        : '<span class="badge bg-secondary">Inactivo</span>';
    const actionTitle =
      client.Cli_estado === "activo" ? "Desactivar" : "Activar";
    const actionButtonClass =
      client.Cli_estado === "activo" ? "btn-warning" : "btn-success";
    const actionButtonIcon =
      client.Cli_estado === "activo" ? "bi-pause-circle" : "bi-play-circle";

    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${client.idCliente}</td>
            <td><strong>${client.Cli_nombre}</strong></td>
            <td>${client.Cli_cedula}</td>
            <td>${client.Cli_correo || "N/A"}</td>
            <td>${client.Cli_telefono || "N/A"}</td>
            <td>${estadoBadge}</td>
            <td>
                <button class="btn btn-sm btn-info btn-edit" data-id="${
                  client.idCliente
                }" title="Editar Cliente"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm ${actionButtonClass} btn-toggle-status ms-1" data-id="${
      client.idCliente
    }" data-new-status="${
      client.Cli_estado === "activo" ? "inactivo" : "activo"
    }" title="${actionTitle} Cliente">
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
async function fetchAndRenderClients() {
  const tableBody = document.getElementById("client-table-body");
  const controls = document.getElementById("pagination-controls");
  const info = document.getElementById("pagination-info");
  if (!tableBody || !controls || !info) return;

  tableBody.innerHTML = `<tr><td colspan="7" class="text-center">Cargando clientes...</td></tr>`;

  const params = new URLSearchParams({
    page: tableState.currentPage,
    limit: tableState.limit,
    sort_by: tableState.sortBy,
    search: tableState.searchTerm,
  });

  try {
    const response = await fetch(
      `../php/clientes_api.php?${params.toString()}`
    );
    if (!response.ok)
      throw new Error("La respuesta de la red no fue correcta.");

    const data = await response.json();

    tableState.totalRecords = data.total;
    renderClientTable(data.data, tableBody);
    renderPaginationControls(controls);
    updatePaginationInfo(info);
  } catch (error) {
    console.error("Error al cargar clientes:", error);
    tableBody.innerHTML = `<tr><td colspan="7" class="text-center text-danger">Error al cargar clientes.</td></tr>`;
  }
}

/** Abre y llena el modal de edición. */
async function openEditModal(clientId) {
  try {
    const response = await fetch(`../php/clientes_api.php?id=${clientId}`);
    if (!response.ok)
      throw new Error("No se pudo obtener la información del cliente.");
    const client = await response.json();
    if (!client || client.error)
      throw new Error(client.error || "Cliente no encontrado.");

    document.getElementById("edit-idCliente").value = client.idCliente;
    document.getElementById("edit-Cli_nombre").value = client.Cli_nombre;
    document.getElementById("edit-Cli_cedula").value = client.Cli_cedula;
    document.getElementById("edit-Cli_correo").value = client.Cli_correo;
    document.getElementById("edit-Cli_telefono").value = client.Cli_telefono;

    const editModal = new bootstrap.Modal(
      document.getElementById("editClientModal")
    );
    editModal.show();
  } catch (error) {
    console.error("Error al preparar edición:", error);
    alert("No se pudo cargar la información para editar.");
  }
}

// --- FUNCIÓN PRINCIPAL DE INICIALIZACIÓN ---
export function loadGestionClientes() {
  console.log("Módulo de Gestión de Clientes con paginación cargado.");

  // Elementos de la interfaz
  const clientTableBody = document.getElementById("client-table-body");
  const searchInput = document.getElementById("search-input");
  const sortSelect = document.getElementById("sort-select");
  const limitSelect = document.getElementById("limit-select");
  const paginationControls = document.getElementById("pagination-controls");

  const addClientModalEl = document.getElementById("addClientModal");
  const addClientForm = document.getElementById("add-client-form");
  const btnGuardarCliente = document.getElementById("btnGuardarCliente");

  const editClientModalEl = document.getElementById("editClientModal");
  const editClientForm = document.getElementById("edit-client-form");
  const btnActualizarCliente = document.getElementById("btnActualizarCliente");

  // Cargar datos iniciales
  fetchAndRenderClients();

  // --- EVENT LISTENERS ---

  let searchTimeout;
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      tableState.searchTerm = searchInput.value;
      tableState.currentPage = 1;
      fetchAndRenderClients();
    }, 300);
  });

  sortSelect.addEventListener("change", () => {
    tableState.sortBy = sortSelect.value;
    fetchAndRenderClients();
  });

  limitSelect.addEventListener("change", () => {
    tableState.limit = parseInt(limitSelect.value, 10);
    tableState.currentPage = 1;
    fetchAndRenderClients();
  });

  paginationControls.addEventListener("click", (event) => {
    event.preventDefault();
    const pageLink = event.target.closest(".page-link");
    if (pageLink && !pageLink.parentElement.classList.contains("disabled")) {
      tableState.currentPage = parseInt(pageLink.dataset.page, 10);
      fetchAndRenderClients();
    }
  });

  // --- LÓGICA CRUD ---

  btnGuardarCliente.addEventListener("click", async () => {
    if (!addClientForm.checkValidity()) {
      addClientForm.reportValidity();
      return;
    }

    // Validar cédula ecuatoriana antes del envío
    const cedula = document.getElementById("add-Cli_cedula").value;
    if (!validarCedulaEcuatoriana(cedula)) {
      alert("Por favor, ingrese una cédula ecuatoriana válida");
      return;
    }

    const nuevoCliente = {
      action: "create_client",
      Cli_nombre: document.getElementById("add-Cli_nombre").value,
      Cli_cedula: cedula,
      Cli_correo: document.getElementById("add-Cli_correo").value,
      Cli_telefono: document.getElementById("add-Cli_telefono").value,
    };
    try {
      const response = await fetch("../php/clientes_api.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nuevoCliente),
      });
      const result = await response.json();
      if (result.success) {
        bootstrap.Modal.getInstance(addClientModalEl).hide();
        addClientForm.reset();
        await fetchAndRenderClients();
        alert("¡Cliente guardado con éxito!");
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      alert("Error al guardar: " + error.message);
    }
  });

  btnActualizarCliente.addEventListener("click", async () => {
    if (!editClientForm.checkValidity()) {
      editClientForm.reportValidity();
      return;
    }

    // Validar cédula ecuatoriana antes del envío
    const cedula = document.getElementById("edit-Cli_cedula").value;
    if (!validarCedulaEcuatoriana(cedula)) {
      alert("Por favor, ingrese una cédula ecuatoriana válida");
      return;
    }

    const clienteActualizado = {
      action: "update_client",
      idCliente: document.getElementById("edit-idCliente").value,
      Cli_nombre: document.getElementById("edit-Cli_nombre").value,
      Cli_cedula: cedula,
      Cli_correo: document.getElementById("edit-Cli_correo").value,
      Cli_telefono: document.getElementById("edit-Cli_telefono").value,
    };
    try {
      const response = await fetch("../php/clientes_api.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clienteActualizado),
      });
      const result = await response.json();
      if (result.success) {
        bootstrap.Modal.getInstance(editClientModalEl).hide();
        await fetchAndRenderClients();
        alert("¡Cliente actualizado con éxito!");
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      alert("Error al actualizar: " + error.message);
    }
  });

  // Delegación de eventos para botones de la tabla
  clientTableBody.addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const clientId = button.dataset.id;
    if (!clientId) return;

    if (button.classList.contains("btn-edit")) {
      openEditModal(clientId);
    }

    if (button.classList.contains("btn-toggle-status")) {
      const newStatus = button.dataset.newStatus;
      if (
        confirm(
          `¿Seguro que deseas ${
            newStatus === "activo" ? "activar" : "desactivar"
          } este cliente?`
        )
      ) {
        try {
          const response = await fetch("../php/clientes_api.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "update_status",
              id: clientId,
              estado: newStatus,
            }),
          });
          const result = await response.json();
          if (result.success) {
            await fetchAndRenderClients();
          } else {
            throw new Error(result.message);
          }
        } catch (error) {
          alert("Error al cambiar el estado: " + error.message);
        }
      }
    }
  });

  // Agregar validaciones a los campos de cédula
  agregarValidacionCedula("add-Cli_cedula");
  agregarValidacionCedula("edit-Cli_cedula");

  // --- CONFIGURAR VALIDACIONES EN TIEMPO REAL ---
  if (typeof RealtimeValidator !== 'undefined') {
    const validator = new RealtimeValidator();

    // Configurar validaciones para el modal de agregar cliente
    validator.initForm('add-client-form', {
      'add-Cli_nombre': {
        required: true,
        pattern: 'onlyLetters',
        minLength: 2,
        maxLength: 100
      },
      'add-Cli_cedula': {
        required: true,
        pattern: 'cedula',
        custom: (value) => {
          if (!RealtimeValidator.validateEcuadorianCedula(value)) {
            return 'Cédula ecuatoriana inválida';
          }
          return true;
        }
      },
      'add-Cli_correo': {
        required: false,
        pattern: 'email',
        maxLength: 120
      },
      'add-Cli_telefono': {
        required: false,
        pattern: 'telefono',
        minLength: 10,
        maxLength: 10
      },
      'add-Cli_direccion': {
        required: false,
        pattern: 'noSpecialChars',
        minLength: 5,
        maxLength: 200
      }
    });

    // Configurar validaciones para el modal de editar cliente
    validator.initForm('edit-client-form', {
      'edit-Cli_nombre': {
        required: true,
        pattern: 'onlyLetters',
        minLength: 2,
        maxLength: 100
      },
      'edit-Cli_cedula': {
        required: true,
        pattern: 'cedula',
        custom: (value) => {
          if (!RealtimeValidator.validateEcuadorianCedula(value)) {
            return 'Cédula ecuatoriana inválida';
          }
          return true;
        }
      },
      'edit-Cli_correo': {
        required: false,
        pattern: 'email',
        maxLength: 120
      },
      'edit-Cli_telefono': {
        required: false,
        pattern: 'telefono',
        minLength: 10,
        maxLength: 10
      },
      'edit-Cli_direccion': {
        required: false,
        pattern: 'noSpecialChars',
        minLength: 5,
        maxLength: 200
      }
    });

    // Formatear campos en tiempo real
    const addCedulaField = document.getElementById('add-Cli_cedula');
    const editCedulaField = document.getElementById('edit-Cli_cedula');
    const addTelefonoField = document.getElementById('add-Cli_telefono');
    const editTelefonoField = document.getElementById('edit-Cli_telefono');
    
    if (addCedulaField) RealtimeValidator.formatCedula(addCedulaField);
    if (editCedulaField) RealtimeValidator.formatCedula(editCedulaField);
    if (addTelefonoField) RealtimeValidator.formatPhoneNumber(addTelefonoField);
    if (editTelefonoField) RealtimeValidator.formatPhoneNumber(editTelefonoField);

    // Limpiar validaciones al abrir los modales
    document.getElementById('addClientModal')?.addEventListener('show.bs.modal', () => {
      validator.clearValidations('add-client-form');
    });

    document.getElementById('editClientModal')?.addEventListener('show.bs.modal', () => {
      validator.clearValidations('edit-client-form');
    });
  }
}

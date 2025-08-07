/**
 * js/gestionClientes.js
 * Lógica completa con Paginación, Búsqueda, Ordenamiento y CRUD para la Gestión de Clientes.
 */

// --- ESTADO GLOBAL DE LA TABLA ---
// Mantiene la configuración actual de la tabla.
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
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No se encontraron clientes que coincidan con los criterios.</td></tr>`;
    return;
  }
  clients.forEach((client) => {
    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${client.idCliente}</td>
            <td><strong>${client.Cli_nombre}</strong></td>
            <td>${client.Cli_cedula}</td>
            <td>${client.Cli_correo || "N/A"}</td>
            <td>${client.Cli_telefono || "N/A"}</td>
            <td>
                <button class="btn btn-sm btn-info btn-edit" data-id="${
                  client.idCliente
                }" title="Editar Cliente"><i class="bi bi-pencil">Editar</i></button>
                
            </td>`;
    tableBody.appendChild(row);
  });
}

/** Dibuja los controles de paginación (botones "Anterior", "1", "2", "Siguiente"). */
function renderPaginationControls(controlsContainer) {
  const totalPages = Math.ceil(tableState.totalRecords / tableState.limit);
  if (totalPages <= 1) {
    controlsContainer.innerHTML = "";
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
  controlsContainer.innerHTML = buttonsHtml;
}

/** Actualiza el texto informativo de la paginación. */
function updatePaginationInfo(infoElement) {
  if (tableState.totalRecords === 0) {
    infoElement.textContent = "No hay registros para mostrar";
    return;
  }
  const startRecord = (tableState.currentPage - 1) * tableState.limit + 1;
  const endRecord = Math.min(
    startRecord + tableState.limit - 1,
    tableState.totalRecords
  );
  infoElement.textContent = `Mostrando ${startRecord} a ${endRecord} de ${tableState.totalRecords} registros`;
}

// --- LÓGICA DE DATOS (COMUNICACIÓN CON LA API) ---

/** Función principal para obtener datos de la API aplicando todos los filtros. */
async function fetchAndRenderClients() {
  const tableBody = document.getElementById("client-table-body");
  const controlsContainer = document.getElementById("pagination-controls");
  const infoElement = document.getElementById("pagination-info");
  if (!tableBody || !controlsContainer || !infoElement) return;

  tableBody.innerHTML = `<tr><td colspan="6" class="text-center">Cargando clientes...</td></tr>`;

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
    renderPaginationControls(controlsContainer);
    updatePaginationInfo(infoElement);
  } catch (error) {
    console.error("Error al cargar los clientes:", error);
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error al cargar los clientes.</td></tr>`;
  }
}

/** Abre y llena el modal de edición con los datos de un cliente. */
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
    console.error("Error al preparar la edición:", error);
    alert("No se pudo cargar la información del cliente para editar.");
  }
}

// --- FUNCIÓN PRINCIPAL DE INICIALIZACIÓN ---
export function loadGestionClientes() {
  // Elementos de la interfaz
  const clientTableBody = document.getElementById("client-table-body");
  const searchInput = document.getElementById("search-input");
  const sortSelect = document.getElementById("sort-select");
  const limitSelect = document.getElementById("limit-select");
  const paginationControls = document.getElementById("pagination-controls");
  const addClientModalEl = document.getElementById("addClientModal");
  const addClientForm = document.getElementById("add-client-form");
  const btnGuardarCliente = document.getElementById("btnGuardarCliente");
  const editClientForm = document.getElementById("edit-client-form");
  const btnActualizarCliente = document.getElementById("btnActualizarCliente");

  // 1. Cargar datos iniciales
  fetchAndRenderClients();

  // 2. Añadir Event Listeners para la interactividad

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

  // 3. Lógica para Añadir, Editar y Eliminar (CRUD)

  btnGuardarCliente.addEventListener("click", async () => {
    if (!addClientForm.checkValidity()) {
      addClientForm.reportValidity();
      return;
    }
    const nuevoCliente = {
      action: "create_client",
      Cli_nombre: document.getElementById("add-Cli_nombre").value,
      Cli_cedula: document.getElementById("add-Cli_cedula").value,
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
    const clienteActualizado = {
      action: "update_client",
      idCliente: document.getElementById("edit-idCliente").value,
      Cli_nombre: document.getElementById("edit-Cli_nombre").value,
      Cli_cedula: document.getElementById("edit-Cli_cedula").value,
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
        bootstrap.Modal.getInstance(
          document.getElementById("editClientModal")
        ).hide();
        await fetchAndRenderClients();
        alert("¡Cliente actualizado con éxito!");
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      alert("Error al actualizar: " + error.message);
    }
  });

  clientTableBody.addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const clientId = button.dataset.id;
    if (!clientId) return;

    if (button.classList.contains("btn-edit")) {
      openEditModal(clientId);
    }

    if (button.classList.contains("btn-delete")) {
      if (
        confirm(
          `¿Seguro que deseas eliminar permanentemente al cliente ID ${clientId}?`
        )
      ) {
        try {
          const response = await fetch("../php/clientes_api.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "delete_client", id: clientId }),
          });
          const result = await response.json();
          if (result.success) {
            alert(result.message);
            // Vuelve a la primera página si la página actual queda vacía
            if (
              clientTableBody.rows.length === 1 &&
              tableState.currentPage > 1
            ) {
              tableState.currentPage--;
            }
            await fetchAndRenderClients();
          } else {
            throw new Error(result.message);
          }
        } catch (error) {
          alert("Error al eliminar: " + error.message);
        }
      }
    }

    if (button.classList.contains("btn-history")) {
      alert(
        `Funcionalidad "Ver Historial" para el cliente ID ${clientId} pendiente de implementación.`
      );
    }
  });
}

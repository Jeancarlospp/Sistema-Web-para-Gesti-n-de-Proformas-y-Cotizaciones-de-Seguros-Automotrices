/**
 * js/gestionEmpresas.js
 * Lógica avanzada con Paginación, Búsqueda, Ordenamiento y CRUD para la Gestión de Empresas.
 */

import { validarRucEcuatoriano, agregarValidacionRuc } from './validaciones.js';

// --- ESTADO GLOBAL DE LA TABLA ---
let tableState = {
  currentPage: 1,
  limit: 10,
  searchTerm: "",
  sortBy: "Emp_nombre ASC",
  totalRecords: 0,
};

// --- RENDERIZADO Y LÓGICA DE LA INTERFAZ ---

/** Dibuja las filas de la tabla con los datos de la página actual. */
function renderCompanyTable(companies, tableBody) {
  tableBody.innerHTML = "";
  if (!companies || companies.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-muted">No se encontraron empresas.</td></tr>`;
    return;
  }

  companies.forEach((company) => {
    const estadoBadge =
      company.Emp_estado === "activo"
        ? '<span class="badge bg-success">Activo</span>'
        : `<span class="badge bg-danger">Inactivo</span>`;

    const actionTitle =
      company.Emp_estado === "activo" ? "Desactivar" : "Activar";
    const actionButtonClass =
      company.Emp_estado === "activo" ? "btn-warning" : "btn-success";
    const actionButtonIcon =
      company.Emp_estado === "activo" ? "bi-pause-circle" : "bi-play-circle";

    const row = document.createElement("tr");
    row.innerHTML = `
            <td>${company.idEmpresas_Proveedora}</td>
            <td><strong>${
              company.Emp_nombre
            }</strong><br><small class="text-muted">${
      company.Emp_razonSocial
    }</small></td>
            <td>${company.Emp_ruc}</td>
            <td>${company.Emp_correo}</td>
            <td>${estadoBadge}</td>
            <td>
                <button class="btn btn-sm btn-info btn-edit" data-id="${
                  company.idEmpresas_Proveedora
                }" title="Editar Empresa">
                    <i class="bi bi-pencil"></i>
                </button>
                <button 
                    class="btn btn-sm ${actionButtonClass} btn-toggle-on ms-1" 
                    data-id="${company.idEmpresas_Proveedora}" 
                    data-new-status="${
                      company.Emp_estado === "activo" ? "inactivo" : "activo"
                    }" 
                    title="${actionTitle} Empresa">
                    <i class="bi ${actionButtonIcon}"></i>
                </button>
            </td>
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
  let buttonsHtml = '<ul class="pagination pagination-sm mb-0">';
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
async function fetchAndRenderCompanies() {
  const tableBody = document.getElementById("company-table-body");
  const controls = document.getElementById("pagination-controls");
  const info = document.getElementById("pagination-info");
  if (!tableBody || !controls || !info) return;
  tableBody.innerHTML = `<tr><td colspan="6" class="text-center">Cargando empresas...</td></tr>`;

  const params = new URLSearchParams({
    page: tableState.currentPage,
    limit: tableState.limit,
    sort_by: tableState.sortBy,
    search: tableState.searchTerm,
  });

  try {
    const response = await fetch(
      `../php/empresas_api.php?${params.toString()}`
    );
    if (!response.ok)
      throw new Error("La respuesta de la red no fue correcta.");
    const data = await response.json();

    tableState.totalRecords = data.total;
    renderCompanyTable(data.data, tableBody);
    renderPaginationControls(controls);
    updatePaginationInfo(info);
  } catch (error) {
    console.error("Error al cargar empresas:", error);
    tableBody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error al cargar empresas.</td></tr>`;
  }
}

/** Abre y llena el modal de edición. */
async function openEditCompanyModal(companyId) {
  try {
    const response = await fetch(`../php/empresas_api.php?id=${companyId}`);
    if (!response.ok)
      throw new Error("No se pudo obtener la información de la empresa.");
    const company = await response.json();
    if (!company || company.error)
      throw new Error(company.error || "Empresa no encontrada.");

    document.getElementById("edit-idEmpresas_Proveedora").value =
      company.idEmpresas_Proveedora;
    document.getElementById("edit-Emp_razonSocial").value =
      company.Emp_razonSocial;
    document.getElementById("edit-Emp_nombre").value = company.Emp_nombre;
    document.getElementById("edit-Emp_ruc").value = company.Emp_ruc;
    document.getElementById("edit-Emp_correo").value = company.Emp_correo;
    document.getElementById("edit-Emp_telefono").value = company.Emp_telefono;
    document.getElementById("edit-Emp_direccion").value = company.Emp_direccion;

    const editModal = new bootstrap.Modal(
      document.getElementById("editCompanyModal")
    );
    editModal.show();
  } catch (error) {
    console.error("Error al preparar la edición:", error);
    alert("No se pudo cargar la información de la empresa para editar.");
  }
}

// --- FUNCIÓN PRINCIPAL DE INICIALIZACIÓN ---
export function loadGestionEmpresas() {
  console.log("Módulo de Gestión de Empresas con paginación cargado.");

  const companyTableBody = document.getElementById("company-table-body");
  const searchInput = document.getElementById("search-input");
  const sortSelect = document.getElementById("sort-select");
  const limitSelect = document.getElementById("limit-select");
  const paginationControls = document.getElementById("pagination-controls");

  const addCompanyModalEl = document.getElementById("addCompanyModal");
  const addCompanyForm = document.getElementById("add-company-form");
  const saveCompanyBtn = document.getElementById("btnGuardarEmpresa");

  const editCompanyModalEl = document.getElementById("editCompanyModal");
  const editCompanyForm = document.getElementById("edit-company-form");
  const btnActualizarEmpresa = document.getElementById("btnActualizarEmpresa");

  fetchAndRenderCompanies();

  // --- EVENT LISTENERS ---
  let searchTimeout;
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      tableState.searchTerm = searchInput.value;
      tableState.currentPage = 1;
      fetchAndRenderCompanies();
    }, 300);
  });

  sortSelect.addEventListener("change", () => {
    tableState.sortBy = sortSelect.value;
    fetchAndRenderCompanies();
  });

  limitSelect.addEventListener("change", () => {
    tableState.limit = parseInt(limitSelect.value, 10);
    tableState.currentPage = 1;
    fetchAndRenderCompanies();
  });

  paginationControls.addEventListener("click", (event) => {
    event.preventDefault();
    const pageLink = event.target.closest(".page-link");
    if (pageLink && !pageLink.parentElement.classList.contains("disabled")) {
      tableState.currentPage = parseInt(pageLink.dataset.page, 10);
      fetchAndRenderCompanies();
    }
  });

  // Delegación de eventos para botones de la tabla
  companyTableBody.addEventListener("click", async (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    const companyId = button.dataset.id;
    if (!companyId) return;

    if (button.classList.contains("btn-edit")) {
      openEditCompanyModal(companyId);
    }

    // ===== LÍNEA CORREGIDA =====
    // Se busca "btn-toggle-on", que es la clase que realmente tiene el botón.
    if (button.classList.contains("btn-toggle-on")) {
      const newStatus = button.dataset.newStatus;
      if (
        confirm(
          `¿Seguro que deseas cambiar el estado de esta empresa a '${newStatus}'?`
        )
      ) {
        try {
          const response = await fetch("../php/empresas_api.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              action: "update_status",
              id: companyId,
              estado: newStatus,
            }),
          });
          const result = await response.json();
          if (result.success) {
            await fetchAndRenderCompanies();
          } else {
            throw new Error(result.message);
          }
        } catch (error) {
          alert("Error al cambiar el estado: " + error.message);
        }
      }
    }
  });

  // Lógica para el modal de Añadir
  saveCompanyBtn.addEventListener("click", async () => {
    if (!addCompanyForm.checkValidity()) {
      addCompanyForm.reportValidity();
      return;
    }

    // Validar RUC ecuatoriano antes del envío
    const ruc = document.getElementById("add-Emp_ruc").value;
    if (!validarRucEcuatoriano(ruc)) {
      alert("Por favor, ingrese un RUC ecuatoriano válido");
      return;
    }

    const newCompanyData = {
      action: "create_company",
      Emp_razonSocial: document.getElementById("add-Emp_razonSocial").value,
      Emp_nombre: document.getElementById("add-Emp_nombre").value,
      Emp_ruc: ruc,
      Emp_correo: document.getElementById("add-Emp_correo").value,
      Emp_telefono: document.getElementById("add-Emp_telefono").value,
      Emp_direccion: document.getElementById("add-Emp_direccion").value,
    };
    try {
      const response = await fetch("../php/empresas_api.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newCompanyData),
      });
      const result = await response.json();
      if (result.success) {
        bootstrap.Modal.getInstance(addCompanyModalEl).hide();
        addCompanyForm.reset();
        await fetchAndRenderCompanies();
        alert("¡Empresa guardada!");
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      alert("Error al guardar: " + error.message);
    }
  });

  // Lógica para el modal de Editar
  btnActualizarEmpresa.addEventListener("click", async () => {
    if (!editCompanyForm.checkValidity()) {
      editCompanyForm.reportValidity();
      return;
    }

    // Validar RUC ecuatoriano antes del envío
    const ruc = document.getElementById("edit-Emp_ruc").value;
    if (!validarRucEcuatoriano(ruc)) {
      alert("Por favor, ingrese un RUC ecuatoriano válido");
      return;
    }

    const updatedCompanyData = {
      action: "update_company",
      idEmpresas_Proveedora: document.getElementById(
        "edit-idEmpresas_Proveedora"
      ).value,
      Emp_razonSocial: document.getElementById("edit-Emp_razonSocial").value,
      Emp_nombre: document.getElementById("edit-Emp_nombre").value,
      Emp_ruc: ruc,
      Emp_correo: document.getElementById("edit-Emp_correo").value,
      Emp_telefono: document.getElementById("edit-Emp_telefono").value,
      Emp_direccion: document.getElementById("edit-Emp_direccion").value,
    };
    try {
      const response = await fetch("../php/empresas_api.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedCompanyData),
      });
      const result = await response.json();
      if (result.success) {
        bootstrap.Modal.getInstance(editCompanyModalEl).hide();
        await fetchAndRenderCompanies();
        alert("¡Empresa actualizada!");
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      alert("Error al actualizar: " + error.message);
    }
  });

  // Agregar validaciones a los campos de RUC
  agregarValidacionRuc('add-Emp_ruc');
  agregarValidacionRuc('edit-Emp_ruc');
}

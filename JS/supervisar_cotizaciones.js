/**
 * js/supervisarCotizaciones.js
 * Lógica completa para la página de Supervisión de Cotizaciones,
 * adaptada al esquema SQL de 'sistemas_cotizaciones'.
 */

// --- FUNCIÓN PARA RENDERIZAR LA TABLA DE COTIZACIONES ---
function renderQuotesTable(quotes, tableBody) {
  tableBody.innerHTML = "";

  if (!quotes || quotes.length === 0) {
    tableBody.innerHTML =
      '<tr><td colspan="7" class="text-center text-muted">No se encontraron cotizaciones con los filtros seleccionados.</td></tr>';
    return;
  }

  quotes.forEach((quote) => {
    let estadoBadge = "";
    // Tu tabla `cotizacion` usa `Cot_estado` con valores en minúscula.
    const estado = quote.Cot_estado.toLowerCase();
    switch (estado) {
      case "aceptada":
        estadoBadge = `<span class="badge bg-success">Aceptada</span>`;
        break;
      case "enviada":
        estadoBadge = `<span class="badge bg-info">Enviada</span>`;
        break;
      case "rechazada":
        estadoBadge = `<span class="badge bg-danger">Rechazada</span>`;
        break;
      case "borrador":
        estadoBadge = `<span class="badge bg-light-secondary">Borrador</span>`;
        break;
      case "vencida":
        estadoBadge = `<span class="badge bg-warning">Vencida</span>`;
        break;
      default:
        estadoBadge = `<span class="badge bg-secondary">${estado}</span>`;
    }

    const row = document.createElement("tr");
    // Usamos los nombres de columna EXACTOS que devolverá la API (con JOINs).
    row.innerHTML = `
            <td>${quote.idCotizacion}</td>
            <td><strong>${quote.Cli_nombre || "N/A"}</strong></td>
            <td>${quote.nombre_usuario || "N/A"}</td>
            <td>$${parseFloat(quote.Cot_montoAsegurable).toFixed(2)}</td>
            <td>${estadoBadge}</td>
            <td>${new Date(quote.Cot_fechaCreacion).toLocaleDateString(
              "es-ES"
            )}</td>
            <td>
                <button class="btn btn-sm btn-info" data-id="${
                  quote.idCotizacion
                }" title="Ver Detalles"><i class="bi bi-eye"></i></button>
                <button class="btn btn-sm btn-secondary ms-1" data-id="${
                  quote.idCotizacion
                }" title="Descargar PDF"><i class="bi bi-file-earmark-pdf"></i></button>
            </td>
        `;
    tableBody.appendChild(row);
  });
}

// --- FUNCIÓN PARA POBLAR EL FILTRO DE USUARIOS ---
async function populateUserFilter() {
  const userFilterSelect = document.getElementById("filter-user");
  if (!userFilterSelect) return;

  try {
    const response = await fetch("../php/usuarios_api.php?all=1");
    if (!response.ok)
      throw new Error("No se pudo cargar la lista de usuarios.");
    const users = await response.json();

    // Limpiar opciones existentes (excepto la primera)
    userFilterSelect.innerHTML =
      '<option value="" selected>Todos los Usuarios</option>';

    users.forEach((user) => {
      // Asumimos que Asesores y Vendedores son los que crean cotizaciones.
      if (
        user.rol.toLowerCase() === "asesor" ||
        user.rol.toLowerCase() === "vendedor"
      ) {
        const option = document.createElement("option");
        option.value = user.id_usuario;
        option.textContent = `${user.nombre} (${user.rol})`;
        userFilterSelect.appendChild(option);
      }
    });
  } catch (error) {
    console.error("Error poblando el filtro de usuarios:", error);
  }
}

// --- FUNCIÓN PARA BUSCAR COTIZACIONES BASADO EN FILTROS ---
async function searchQuotes(filters = {}) {
  const tableBody = document.getElementById("quotes-table-body");
  tableBody.innerHTML =
    '<tr><td colspan="7" class="text-center">Buscando cotizaciones...</td></tr>';

  // Construir la cadena de consulta para la API, ignorando valores vacíos.
  const queryParams = new URLSearchParams();
  for (const key in filters) {
    if (filters[key]) {
      queryParams.append(key, filters[key]);
    }
  }

  try {
    const response = await fetch(
      `../php/cotizaciones_api.php?${queryParams.toString()}`
    );
    if (!response.ok)
      throw new Error("La respuesta de la red no fue correcta.");

    const quotes = await response.json();
    renderQuotesTable(quotes, tableBody);
  } catch (error) {
    console.error("Error al buscar cotizaciones:", error);
    tableBody.innerHTML =
      '<tr><td colspan="7" class="text-center text-danger">Error al cargar las cotizaciones.</td></tr>';
  }
}

// --- FUNCIÓN PRINCIPAL EXPORTADA ---
export function loadSupervisarCotizaciones() {
  console.log(
    "Módulo de Supervisar Cotizaciones (sincronizado con SQL) cargado."
  );

  const filtersForm = document.getElementById("filters-form");
  const btnResetFilters = document.getElementById("btn-reset-filters");

  // 1. Poblar los filtros dinámicos (lista de usuarios).
  populateUserFilter();

  // 2. Cargar todas las cotizaciones inicialmente (sin filtros).
  searchQuotes();

  // 3. Manejar el envío del formulario de filtros.
  filtersForm.addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(filtersForm);
    const filters = Object.fromEntries(formData.entries());
    searchQuotes(filters);
  });

  // 4. Manejar el botón de limpiar filtros.
  btnResetFilters.addEventListener("click", () => {
    filtersForm.reset();
    searchQuotes(); // Vuelve a buscar sin filtros para mostrar todo.
  });
}

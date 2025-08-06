/**
 * js/supervisarCotizaciones.js
 * Lógica para la página de Supervisión de Cotizaciones.
 */

// --- FUNCIÓN PARA RENDERIZAR LA TABLA DE COTIZACIONES ---
function renderQuotesTable(quotes, tableBody) {
    tableBody.innerHTML = '';

    if (!quotes || quotes.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No se encontraron cotizaciones con los filtros seleccionados.</td></tr>';
        return;
    }

    quotes.forEach(quote => {
        let estadoBadge = '';
        switch (quote.estado_cotizacion) {
            case 'APROBADA': estadoBadge = `<span class="badge bg-success">${quote.estado_cotizacion}</span>`; break;
            case 'ENVIADA': estadoBadge = `<span class="badge bg-info">${quote.estado_cotizacion}</span>`; break;
            case 'RECHAZADA': estadoBadge = `<span class="badge bg-danger">${quote.estado_cotizacion}</span>`; break;
            case 'BORRADOR': estadoBadge = `<span class="badge bg-light-secondary">${quote.estado_cotizacion}</span>`; break;
            default: estadoBadge = `<span class="badge bg-secondary">${quote.estado_cotizacion}</span>`;
        }

        const row = document.createElement('tr');
        // Asumiendo que la API devolverá estos campos (con JOINs en el backend)
        row.innerHTML = `
            <td>${quote.numero_cotizacion || quote.id_cotizacion}</td>
            <td><strong>${quote.nombre_cliente}</strong></td>
            <td>${quote.nombre_usuario}</td>
            <td>$${parseFloat(quote.total).toFixed(2)}</td>
            <td>${estadoBadge}</td>
            <td>${new Date(quote.fecha_creacion).toLocaleDateString('es-ES')}</td>
            <td>
                <button class="btn btn-sm btn-info" title="Ver Detalles"><i class="bi bi-eye"></i></button>
                <button class="btn btn-sm btn-secondary ms-1" title="Descargar PDF"><i class="bi bi-file-earmark-pdf"></i></button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// --- FUNCIÓN PARA POBLAR LOS FILTROS (ej: lista de usuarios) ---
async function populateFilters() {
    const userFilterSelect = document.getElementById('filter-user');
    if (!userFilterSelect) return;

    try {
        // Usamos la API de usuarios que ya existe para obtener la lista
        const response = await fetch('../php/usuarios_api.php?all=1');
        if (!response.ok) throw new Error('No se pudo cargar la lista de usuarios.');
        const users = await response.json();

        users.forEach(user => {
            if (user.rol === 'Asesor' || user.rol === 'Vendedor') {
                const option = document.createElement('option');
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
async function searchQuotes(filters) {
    const tableBody = document.getElementById('quotes-table-body');
    tableBody.innerHTML = '<tr><td colspan="7" class="text-center">Buscando cotizaciones...</td></tr>';
    
    // Construir la cadena de consulta para la API
    const queryParams = new URLSearchParams(filters).toString();
    
    try {
        // En el futuro, crearás `cotizaciones_api.php`
        const response = await fetch(`../php/cotizaciones_api.php?${queryParams}`);
        if (!response.ok) throw new Error('La respuesta de la red no fue correcta.');

        const quotes = await response.json();
        renderQuotesTable(quotes, tableBody);
    } catch (error) {
        console.error('Error al buscar cotizaciones:', error);
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error al cargar las cotizaciones.</td></tr>';
    }
}


// --- FUNCIÓN PRINCIPAL EXPORTADA ---
export function loadSupervisarCotizaciones() {
    console.log("Módulo de Supervisar Cotizaciones cargado.");

    const filtersForm = document.getElementById('filters-form');
    const btnResetFilters = document.getElementById('btn-reset-filters');

    // 1. Poblar los filtros dinámicos (como la lista de usuarios)
    populateFilters();

    // 2. Cargar todas las cotizaciones inicialmente (sin filtros)
    searchQuotes({});

    // 3. Manejar el envío del formulario de filtros
    filtersForm.addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(filtersForm);
        const filters = Object.fromEntries(formData.entries());
        searchQuotes(filters);
    });
    
    // 4. Manejar el botón de limpiar filtros
    btnResetFilters.addEventListener('click', () => {
        filtersForm.reset();
        searchQuotes({}); // Vuelve a buscar sin filtros
    });
}
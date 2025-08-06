/**
 * js/gestionEmpresas.js
 * Lógica para la página de Gestión de Empresas, conectada a una API.
 */

// --- FUNCIÓN PARA RENDERIZAR LA TABLA DE EMPRESAS ---
// Recibe los datos de la API y los dibuja en la tabla.
function renderCompanyTable(companies, tableBody) {
    tableBody.innerHTML = ''; // Limpiar la tabla antes de renderizar

    if (!companies || companies.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay empresas registradas.</td></tr>';
        return;
    }

    companies.forEach(company => {
        // Usamos los nombres de columna de tu tabla `empresas_proveedoras`
        const estadoBadge = company.estado === 'ACTIVO' // La BD suele usar mayúsculas
            ? `<span class="badge bg-success">Activo</span>`
            : `<span class="badge bg-secondary">${company.estado}</span>`;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${company.id_empresa}</td>
            <td><strong>${company.nombre}</strong><br><small class="text-muted">${company.razon_social}</small></td>
            <td>${company.ruc_nit}</td>
            <td>${company.email}</td>
            <td>${estadoBadge}</td>
            <td>
                <button class="btn btn-sm btn-info btn-edit" data-id="${company.id_empresa}" title="Editar Empresa"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-warning btn-toggle-status ms-1" data-id="${company.id_empresa}" title="Cambiar Estado"><i class="bi bi-arrow-repeat"></i></button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// --- FUNCIÓN PARA CARGAR LAS EMPRESAS DESDE LA API ---
async function fetchAndRenderCompanies() {
    const tableBody = document.getElementById('company-table-body');
    if (!tableBody) return;

    // Mostrar mensaje de carga mientras se obtienen los datos.
    tableBody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando empresas...</td></tr>';

    try {
        const response = await fetch('../php/empresas_api.php');
        if (!response.ok) {
            throw new Error(`Error de red: ${response.statusText}`);
        }
        
        const companies = await response.json();
        renderCompanyTable(companies, tableBody);

    } catch (error) {
        console.error('Error al cargar las empresas:', error);
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">No se pudieron cargar las empresas. Intente de nuevo más tarde.</td></tr>';
    }
}

// --- FUNCIÓN PRINCIPAL EXPORTADA ---
export function loadGestionEmpresas() {
    console.log("Módulo de Gestión de Empresas (dinámico) cargado.");

    // Elementos del DOM
    const companyTableBody = document.getElementById('company-table-body');
    const addCompanyForm = document.getElementById('new-company-form');
    const saveCompanyBtn = document.getElementById('save-company-btn');
    const addCompanyModalEl = document.getElementById('addCompanyModal');
    
    // Si algún elemento crucial no existe, detenemos la ejecución.
    if (!companyTableBody || !addCompanyForm || !saveCompanyBtn || !addCompanyModalEl) {
        console.error("Faltan elementos HTML cruciales en la página de gestión de empresas.");
        return;
    }

    const modalInstance = new bootstrap.Modal(addCompanyModalEl);

    // 1. Cargar la lista inicial de empresas desde la API.
    fetchAndRenderCompanies();
    
    // 2. Manejar el guardado de una nueva empresa.
    saveCompanyBtn.addEventListener('click', async () => {
        // Validar que el formulario esté completo.
        if (!addCompanyForm.checkValidity()) {
            addCompanyForm.reportValidity(); // Muestra los mensajes de validación del navegador.
            return;
        }

        // Crear un objeto con los datos del formulario.
        // Los nombres de las claves deben coincidir con las columnas de la BD.
        const newCompanyData = {
            razon_social: document.getElementById('RaSocial').value,
            nombre: document.getElementById('NomCom').value,
            ruc_nit: document.getElementById('RUC').value,
            email: document.getElementById('Correo').value,
            telefono: document.getElementById('Telefono').value,
            direccion: document.getElementById('Direccion').value,
            // El estado por defecto se puede manejar en el backend.
        };

        // Deshabilitar el botón para evitar envíos múltiples.
        saveCompanyBtn.disabled = true;
        saveCompanyBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...';

        try {
            // Enviar los datos a la API para guardarlos en la base de datos.
            const response = await fetch('../php/empresas_api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCompanyData)
            });

            const result = await response.json();

            if (result.success) {
                modalInstance.hide(); // Ocultar el modal.
                addCompanyForm.reset(); // Limpiar el formulario.
                await fetchAndRenderCompanies(); // Recargar la tabla para mostrar la nueva empresa.
                alert('¡Empresa guardada con éxito!'); // O usar una notificación más elegante.
            } else {
                throw new Error(result.message || 'Ocurrió un error desconocido al guardar.');
            }
        } catch (error) {
            console.error('Error al guardar la empresa:', error);
            alert('Error al guardar la empresa: ' + error.message);
        } finally {
            // Volver a habilitar el botón, sin importar si tuvo éxito o falló.
            saveCompanyBtn.disabled = false;
            saveCompanyBtn.innerHTML = 'Guardar Empresa';
        }
    });
}
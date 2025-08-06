/**
 * js/gestionClientes.js
 * Lógica para la página de Gestión de Clientes.
 */

// --- FUNCIÓN PARA RENDERIZAR LA TABLA DE CLIENTES ---
function renderClientTable(clients, tableBody) {
    tableBody.innerHTML = ''; // Limpiar la tabla antes de renderizar

    if (!clients || clients.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay clientes registrados.</td></tr>';
        return;
    }

    clients.forEach(client => {
        const row = document.createElement('tr');
        // Usamos los nombres de columna de tu tabla `clientes` del SQL
        row.innerHTML = `
            <td>${client.IdCliente}</td>
            <td><strong>${client.Nombre}</strong></td>
            <td>${client.Cedula}</td>
            <td>${client.correo}</td>
            <td>${client.telefono}</td>
            <td>
                <button class="btn btn-sm btn-info" title="Editar Cliente"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-secondary ms-1" title="Ver Historial"><i class="bi bi-clock-history"></i></button>
            </td>
        `;
        tableBody.appendChild(row);
    });
}

// --- FUNCIÓN PARA CARGAR LOS CLIENTES DESDE LA API ---
async function fetchAndRenderClients() {
    const tableBody = document.getElementById('client-table-body');
    if (!tableBody) return;

    try {
        // En el futuro, crearás `clientes_api.php`
        const response = await fetch('../php/clientes_api.php');
        if (!response.ok) throw new Error('La respuesta de la red no fue correcta.');
        
        const clients = await response.json();
        renderClientTable(clients, tableBody);
    } catch (error) {
        console.error('Error al cargar los clientes:', error);
        tableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Error al cargar los clientes.</td></tr>';
    }
}

// --- FUNCIÓN PRINCIPAL EXPORTADA ---
export function loadGestionClientes() {
    console.log("Módulo de Gestión de Clientes cargado.");

    // Elementos del DOM
    const btnGuardarCliente = document.getElementById('btnGuardarCliente');
    const addClientForm = document.getElementById('add-client-form');
    const addClientModalEl = document.getElementById('addClientModal');
    const modalInstance = new bootstrap.Modal(addClientModalEl);

    // 1. Cargar la lista de clientes al iniciar la página
    fetchAndRenderClients();

    // 2. Manejar el evento de clic en el botón de guardar del modal
    btnGuardarCliente.addEventListener('click', async () => {
        // Validar que el formulario esté completo
        if (!addClientForm.checkValidity()) {
            addClientForm.reportValidity(); // Muestra los mensajes de validación del navegador
            return;
        }

        // Crear un objeto con los datos del nuevo cliente
        const nuevoCliente = {
            Nombre: document.getElementById('clientName').value,
            Cedula: document.getElementById('clientCedula').value,
            correo: document.getElementById('clientEmail').value,
            telefono: document.getElementById('clientPhone').value
        };

        try {
            // Enviar los datos a la API para guardarlos
            const response = await fetch('../php/clientes_api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevoCliente)
            });

            const result = await response.json();

            if (result.success) {
                modalInstance.hide(); // Ocultar el modal
                addClientForm.reset(); // Limpiar el formulario
                await fetchAndRenderClients(); // Recargar la tabla para mostrar el nuevo cliente
                alert('¡Cliente guardado con éxito!');
            } else {
                throw new Error(result.message || 'Error desconocido al guardar el cliente.');
            }
        } catch (error) {
            console.error('Error al guardar el cliente:', error);
            alert('Error al guardar el cliente: ' + error.message);
        }
    });
}
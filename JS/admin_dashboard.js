/**
 * js/adminDashboard.js
 * Lógica para la página: Dashboard del Administrador.
 * Carga y muestra los usuarios conectados recientemente.
 */

/**
 * Función auxiliar para capitalizar la primera letra de una cadena.
 * @param {string} str La cadena a capitalizar.
 * @returns {string} La cadena con la primera letra en mayúscula.
 */
function capitalizeFirstLetter(str) {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
}


/**
 * Función principal que carga los datos del dashboard del administrador.
 */
export function loadAdminDashboard() {
    console.log('Cargando dashboard de administrador...');
    
    const userTableBody = document.getElementById('user-table-body');
    
    // Verificación de seguridad: si el elemento no existe, no continuamos.
    if (!userTableBody) {
        console.error('Error crítico: No se encontró el elemento <tbody> con id "user-table-body" en el HTML.');
        return;
    }

    // Mostrar un mensaje de carga amigable al usuario.
    userTableBody.innerHTML = '<tr><td colspan="6" class="text-center">Cargando usuarios...</td></tr>';

    // Llamada a la API para obtener los datos de los usuarios.
    fetch('../php/usuarios_api.php')
        .then(response => {
            // Verificar si la respuesta del servidor es exitosa (ej: 200 OK).
            if (!response.ok) {
                throw new Error(`Error de red o del servidor: ${response.statusText}`);
            }
            return response.json();
        })
        .then(users => {
            // Si la API devuelve un array vacío o nulo.
            if (!users || users.length === 0) {
                userTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No hay usuarios registrados en el sistema.</td></tr>';
                return;
            }

            // --- MEJORA DE RENDIMIENTO ---
            // Creamos todas las filas de la tabla en una sola cadena de texto.
            const tableRowsHtml = users.map(user => {
                // Formateamos el rol para una mejor visualización.
                const userRoleFormatted = capitalizeFirstLetter(user.rol || 'N/A');
                
                // Formateamos la fecha del último login para que sea legible.
                const lastLoginFormatted = user.ultimo_login 
                    ? new Date(user.ultimo_login).toLocaleString('es-ES') // Usamos locale español
                    : 'Nunca';

                // --- CORRECCIÓN CRÍTICA ---
                // Se usa `user.id_usuario` para coincidir con la columna de la BD.
                return `
                    <tr>
                        <td>${user.id_usuario}</td>
                        <td>${user.nombre}</td>
                        <td>${user.cedula || 'N/A'}</td>
                        <td>${user.correo}</td>
                        <td><span class="badge bg-primary">${userRoleFormatted}</span></td>
                        <td>${lastLoginFormatted}</td>
                    </tr>
                `;
            }).join(''); // Unimos todas las filas en una sola cadena.

            // Insertamos todo el HTML en la tabla una sola vez.
            userTableBody.innerHTML = tableRowsHtml;
        })
        .catch(error => {
            // Manejo de errores de la llamada fetch.
            console.error('Error al cargar la lista de usuarios:', error);
            userTableBody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">No se pudieron cargar los datos. Por favor, intente más tarde.</td></tr>';
        });
}
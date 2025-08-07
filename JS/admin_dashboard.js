/**
 * js/adminDashboard.js
 * Lógica para la página: Dashboard del Administrador.
 * Carga y muestra los usuarios conectados recientemente.
 * Adaptado para funcionar con una API que devuelve datos paginados.
 */

/**
 * Función auxiliar para capitalizar la primera letra de una cadena.
 * @param {string} str La cadena a capitalizar.
 * @returns {string} La cadena con la primera letra en mayúscula.
 */
function capitalizeFirstLetter(str) {
  if (!str) return "";
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Función principal que carga los datos del dashboard del administrador.
 */
export async function loadAdminDashboard() {
  console.log("Cargando dashboard de administrador...");

  const userTableBody = document.getElementById("user-table-body");

  if (!userTableBody) {
    console.error(
      'Error crítico: No se encontró el elemento <tbody> con id "user-table-body".'
    );
    return;
  }

  userTableBody.innerHTML =
    '<tr><td colspan="6" class="text-center">Cargando usuarios...</td></tr>';

  try {
    // --- CORRECCIÓN CLAVE ---
    // Hacemos la petición pidiendo solo los 5 más recientes, ordenados por último login.
    // Esto se alinea con la lógica de paginación de la API.
    const params = new URLSearchParams({
      page: 1,
      limit: 5, // Mostrar solo los 5 más recientes
      sort_by: "ultimo_login DESC",
    });

    const response = await fetch(
      `../php/usuarios_api.php?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error(`Error de red o del servidor: ${response.statusText}`);
    }

    // La API devuelve un objeto { total: X, data: [...] }.
    // Necesitamos acceder a la propiedad `data`.
    const responseData = await response.json();
    const users = responseData.data;

    if (!users || users.length === 0) {
      userTableBody.innerHTML =
        '<tr><td colspan="6" class="text-center text-muted">No hay usuarios con actividad reciente.</td></tr>';
      return;
    }

    const tableRowsHtml = users
      .map((user) => {
        const userRoleFormatted = capitalizeFirstLetter(user.rol || "N/A");

        const lastLoginFormatted = user.ultimo_login
          ? new Date(user.ultimo_login).toLocaleString("es-ES", {
              dateStyle: "medium",
              timeStyle: "short",
            })
          : "Nunca";

        return `
            <tr>
                <td>${user.id_usuario}</td>
                <td>${user.nombre}</td>
                <td>${user.cedula || "N/A"}</td>
                <td>${user.correo}</td>
                <td><span class="badge bg-primary">${userRoleFormatted}</span></td>
                <td>${lastLoginFormatted}</td>
            </tr>
        `;
      })
      .join("");

    userTableBody.innerHTML = tableRowsHtml;
  } catch (error) {
    console.error("Error al cargar la lista de usuarios:", error);
    userTableBody.innerHTML =
      '<tr><td colspan="6" class="text-center text-danger">No se pudieron cargar los datos. Por favor, intente más tarde.</td></tr>';
  }
}

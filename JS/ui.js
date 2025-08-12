/**
 * js/ui.js (o donde se encuentre la función)
 * Módulo para controlar elementos generales de la interfaz de usuario.
 */

/**
 * Controla la visibilidad de elementos específicos en una página según el rol.
 * @param {string} role - El rol del usuario actual (ej: 'Administrador', 'Vendedor').
 */
export function controlElementVisibility(role) {
  const url = window.location.href;

  // --- Lógica para la página de Gestión de Clientes ---
  if (url.includes("gestion_clientes.html")) {
    const addClientButton = document.querySelector(
      '[data-bs-target="#addClientModal"]'
    );
    if (!addClientButton) return; // Salir si el botón no existe

    // --- CORRECCIÓN ---
    // Se define un array con todos los roles que SÍ PUEDEN ver el botón.
    const allowedRoles = ["Administrador", "Asesor", "Vendedor"];

    // Si el rol del usuario actual NO está incluido en la lista de roles permitidos,
    // ocultamos el botón. De lo contrario, nos aseguramos de que sea visible.
    if (!allowedRoles.includes(role)) {
      addClientButton.style.display = "none";
    } else {
      addClientButton.style.display = ""; // Lo resetea al estilo por defecto (visible)
    }
  }

  // Puedes añadir más reglas "else if" para otras páginas aquí.
}

/**
 * Módulo para controlar elementos generales de la interfaz de usuario.
 */

/**
 * Controla la visibilidad de elementos específicos en una página según el rol.
 * @param {string} role - El rol del usuario.
 */
export function controlElementVisibility(role) {
    const url = window.location.href;

    // Ejemplo: En la página de gestión de clientes, solo Admins y Asesores pueden añadir clientes.
    if (url.includes('gestion_clientes.html')) {
        const addClientButton = document.querySelector('[data-bs-target="#addClientModal"]');
        if (addClientButton && role !== 'Administrador' && role !== 'Asesor') {
            addClientButton.style.display = 'none';
        }
    }
    
    // Puedes añadir más reglas para otras páginas aquí.
}
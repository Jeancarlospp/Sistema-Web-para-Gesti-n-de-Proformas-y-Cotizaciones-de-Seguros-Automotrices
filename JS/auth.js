// /js/auth.js

/**
 * Verifica si existe la información del usuario en localStorage.
 * Si no existe, redirige al login.
 * @returns {object|null} Un objeto con userRole y userName o null si no hay sesión.
 */
export function checkAuth() {
    const userRole = localStorage.getItem('userRole');
    const userName = localStorage.getItem('userName');

    if (!userRole || !userName) {
        console.error("Acceso denegado. No se encontró información de la sesión.");
        window.location.href = '../index.html';
        return null;
    }
    return { userRole, userName };
}

/**
 * Asigna la funcionalidad de logout a los botones de cerrar sesión.
 */
export function initializeLogoutButtons() {
    const setupLogout = (buttonId) => {
        const btn = document.getElementById(buttonId);
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.clear();
                window.location.href = '../index.html';
            });
        }
    };
    setupLogout('logout-btn-sidebar');
    setupLogout('logout-btn');
}
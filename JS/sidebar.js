///js/sidebar.js

/**
 * Oculta y muestra los elementos del menú basados en el rol del usuario.
 * @param {string} role El rol del usuario actual.
 */
export function manageSidebarVisibility(role) {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    // 1. Ocultamos todos los elementos con rol específico.
    sidebar.querySelectorAll('.role-admin, .role-asesor, .role-vendedor').forEach(el => {
        el.style.display = 'none';
    });

    // 2. Determinamos qué clase de rol debemos mostrar.
    let roleClassToShow = '';
    switch (role) {
        case 'Administrador': roleClassToShow = '.role-admin'; break;
        case 'Asesor': roleClassToShow = '.role-asesor'; break;
        case 'Vendedor': roleClassToShow = '.role-vendedor'; break;
    }

    // 3. Mostramos solo los elementos para el rol actual.
    if (roleClassToShow) {
        sidebar.querySelectorAll(roleClassToShow).forEach(el => {
            el.style.display = '';
        });
    }
}

/**
 * Marca como activo el enlace del menú correspondiente a la página actual.
 */
export function setActiveMenuItem() {
    const currentPage = window.location.pathname.split('/').pop();
    document.querySelectorAll('#sidebar .sidebar-item').forEach(li => {
        const link = li.querySelector('a');
        if (link) {
            const linkPage = link.getAttribute('href').split('/').pop();
            if (linkPage === currentPage && li.style.display !== 'none') {
                li.classList.add('active');
            } else {
                li.classList.remove('active');
            }
        }
    });
}
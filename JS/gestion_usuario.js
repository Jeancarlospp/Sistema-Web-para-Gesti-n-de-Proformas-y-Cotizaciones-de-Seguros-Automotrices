/**
 * Lógica para la página: Gestión de Usuarios.
 */
function updateUserState(userId, newEstado) {
    const actionText = newEstado === 'inactivo' ? 'desactivar' : 'activar';
    if (!confirm(`¿Seguro que deseas ${actionText} a este usuario?`)) return;

    fetch('../php/usuarios_api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_estado', id: userId, estado: newEstado })
    })
    .then(res => res.json())
    .then(resp => {
        if (resp.success) {
            loadGestionUsuarios(); // Recargar la tabla para mostrar los cambios
        } else {
            alert('Error al cambiar el estado del usuario: ' + (resp.message || 'Error desconocido'));
        }
    })
    .catch(error => {
        console.error('Error:', error);
        alert('Error de conexión al intentar actualizar el usuario.');
    });
}

export function loadGestionUsuarios() {
    console.log('Cargando gestión de usuarios...');
    const userTableBody = document.getElementById('all-users-table');
    if (!userTableBody) return;

    userTableBody.innerHTML = '<tr><td colspan="7" class="text-center">Cargando usuarios...</td></tr>';

    fetch('../php/usuarios_api.php?all=1')
        .then(res => res.json())
        .then(users => {
            users.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' }));
            userTableBody.innerHTML = '';
            if (!users || users.length === 0) {
                userTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No hay usuarios registrados</td></tr>';
                return;
            }

            users.forEach(user => {
                const estadoBadge = user.estado === 'activo'
                    ? '<span class="badge bg-success">Activo</span>'
                    : '<span class="badge bg-secondary">Inactivo</span>';
                const actionButtonText = user.estado === 'activo' ? 'Desactivar' : 'Activar';
                const actionButtonIcon = user.estado === 'activo' ? 'bi-pause' : 'bi-play';
                const actionButtonClass = user.estado === 'activo' ? 'btn-warning' : 'btn-success';

                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${user.id_usuario}</td>
                    <td>${user.nombre}</td>
                    <td>${user.cedula || 'N/A'}</td>
                    <td>${user.correo}</td>
                    <td><span class="badge bg-primary">${user.rol}</span></td>
                    <td>${estadoBadge}</td>
                    <td>
                        <button class="btn btn-sm btn-info btn-editar" title="Editar usuario"><i class="bi bi-pencil"></i> Editar</button>
                        <button class="btn btn-sm ${actionButtonClass} btn-desactivar ms-1" title="${actionButtonText} usuario">
                            <i class="bi ${actionButtonIcon}"></i> ${actionButtonText}
                        </button>
                    </td>
                `;

                row.querySelector('.btn-editar').addEventListener('click', () => {
                    alert('Funcionalidad de edición pendiente para el usuario ID: ' + user.id);
                });

                row.querySelector('.btn-desactivar').addEventListener('click', () => {
                    const newEstado = user.estado === 'activo' ? 'inactivo' : 'activo';
                    updateUserState(user.id, newEstado);
                });

                userTableBody.appendChild(row);
            });
        })
        .catch(error => {
            console.error('Error al cargar usuarios:', error);
            userTableBody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Error al cargar los usuarios.</td></tr>';
        });
}
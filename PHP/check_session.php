<?php
/**
 * check_session.php
 * Verifica el estado de la sesión del usuario y devuelve información del usuario
 */

// Iniciar sesión si no está iniciada
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Configurar header para JSON
header('Content-Type: application/json');

try {
    // Verificar si el usuario está logueado
    if (!isset($_SESSION['usuario_id']) || !isset($_SESSION['rol'])) {
        // Sesión no válida
        echo json_encode([
            'status' => 'inactive',
            'message' => 'Sesión no encontrada o expirada'
        ]);
        exit;
    }

    // Verificar si la sesión ha expirado (opcional)
    if (isset($_SESSION['ultimo_acceso'])) {
        $tiempo_inactividad = time() - $_SESSION['ultimo_acceso'];
        
        // Si han pasado más de 30 minutos (1800 segundos), cerrar sesión
        if ($tiempo_inactividad > 1800) {
            session_destroy();
            echo json_encode([
                'status' => 'expired',
                'message' => 'Sesión expirada por inactividad'
            ]);
            exit;
        }
    }

    // Actualizar último acceso
    $_SESSION['ultimo_acceso'] = time();

    // Mapeo de roles de BD a roles del frontend
    $rolMapping = [
        'admin' => 'Administrador',
        'asesor' => 'Asesor', 
        'vendedor' => 'Vendedor',
    ];
    
    // Obtener el rol del frontend
    $rolFrontend = $rolMapping[strtolower($_SESSION['rol'])] ?? 'Usuario';

    // Devolver información del usuario
    echo json_encode([
        'status' => 'active',
        'user' => [
            'Usr_id' => $_SESSION['usuario_id'],
            'Usr_rol' => $rolFrontend,
            'Usr_nombre' => $_SESSION['nombre'] ?? 'Usuario',
            'Usr_email' => $_SESSION['usuario_email'] ?? ''
        ],
        'session_time' => date('Y-m-d H:i:s')
    ]);

} catch (Exception $e) {
    // Error en el servidor
    echo json_encode([
        'status' => 'error',
        'message' => 'Error del servidor: ' . $e->getMessage()
    ]);
}
?>

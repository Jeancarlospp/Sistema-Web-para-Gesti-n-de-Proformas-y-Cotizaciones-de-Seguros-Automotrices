<?php
/**
 * Archivo para verificar el estado de la sesión
 */

session_start();

header('Content-Type: application/json');

// Verificar si la sesión está activa y válida
if (isset($_SESSION['usuario_id']) && !empty($_SESSION['usuario_id'])) {
    // Verificar si la sesión no ha expirado (opcional: verificar timestamp)
    $sessionTimeout = 5 * 60; // 5 minutos en segundos
    
    if (isset($_SESSION['last_activity'])) {
        $inactiveTime = time() - $_SESSION['last_activity'];
        
        if ($inactiveTime > $sessionTimeout) {
            // Sesión expirada
            session_destroy();
            echo json_encode([
                'valid' => false,
                'reason' => 'session_expired',
                'message' => 'Sesión expirada por inactividad'
            ]);
            exit;
        }
    }
    
    // Actualizar timestamp de última actividad
    $_SESSION['last_activity'] = time();
    
    echo json_encode([
        'valid' => true,
        'usuario_id' => $_SESSION['usuario_id'],
        'nombre' => $_SESSION['nombre'] ?? '',
        'rol' => $_SESSION['rol'] ?? '',
        'last_activity' => $_SESSION['last_activity']
    ]);
} else {
    // No hay sesión activa
    echo json_encode([
        'valid' => false,
        'reason' => 'no_session',
        'message' => 'No hay sesión activa'
    ]);
}
?>

<?php
/**
 * Archivo para extender la sesión (ping de actividad)
 */

session_start();

header('Content-Type: application/json');

// Verificar si hay una sesión activa
if (isset($_SESSION['usuario_id']) && !empty($_SESSION['usuario_id'])) {
    // Actualizar timestamp de última actividad
    $_SESSION['last_activity'] = time();
    
    echo json_encode([
        'success' => true,
        'message' => 'Sesión extendida',
        'timestamp' => $_SESSION['last_activity'],
        'usuario_id' => $_SESSION['usuario_id']
    ]);
} else {
    // No hay sesión activa
    echo json_encode([
        'success' => false,
        'message' => 'No hay sesión activa para extender'
    ]);
}
?>

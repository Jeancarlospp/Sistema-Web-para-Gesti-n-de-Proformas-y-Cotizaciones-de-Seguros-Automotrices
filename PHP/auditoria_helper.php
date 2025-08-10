<?php
require_once 'utils.php';

/**
 * Registra un evento en la tabla de auditoría
 * @param mysqli $conn Conexión a la base de datos
 * @param int $idUsuario ID del usuario que realiza la acción
 * @param string $accion Tipo de acción (INSERT, UPDATE, DELETE, etc.)
 * @param string $tabla Nombre de la tabla afectada
 * @param string $descripcion Descripción detallada de la acción
 * @return bool True si se registró correctamente, False si hubo error
 */
function registrarAuditoria($conn, $idUsuario, $accion, $tabla, $descripcion) {
    $ip = getClientIP();
    
    $stmt = $conn->prepare("INSERT INTO auditoria (idUsuario, Aud_accion, Aud_tabla, Aud_descripcion, Aud_IP) VALUES (?, ?, ?, ?, ?)");
    if ($stmt === false) {
        error_log("Error preparando la consulta de auditoría: " . $conn->error);
        return false;
    }
    
    $stmt->bind_param("issss", $idUsuario, $accion, $tabla, $descripcion, $ip);
    $result = $stmt->execute();
    
    if (!$result) {
        error_log("Error registrando auditoría: " . $stmt->error);
    }
    
    $stmt->close();
    return $result;
}

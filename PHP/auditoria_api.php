<?php
// Iniciar la sesión para futuras validaciones de permisos.
session_start();

// Requerir el archivo de conexión.
require_once 'conexion.php';

// Establecer la cabecera para indicar que la respuesta será en formato JSON.
header('Content-Type: application/json');

// --- FUNCIÓN PARA ENVIAR RESPUESTAS JSON Y TERMINAR EL SCRIPT ---
function send_json_response($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

// Inicializar la conexión.
$db = new Conexion();
$conn = $db->getConn();

// Capturar el método de la solicitud. Solo se permite GET para esta API de lectura.
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    send_json_response(['error' => 'Método no permitido. Solo se aceptan solicitudes GET.'], 405);
}

try {
    // --- CONSTRUCCIÓN DE LA CONSULTA SQL ---
    // Hacemos un LEFT JOIN con la tabla de usuarios para obtener el nombre.
    // Usamos LEFT JOIN en caso de que un usuario haya sido eliminado pero sus logs permanezcan.
    $sql = "SELECT 
                a.idAuditoria,
                a.idUsuario,
                u.nombre as nombre_usuario, -- Obtenemos el nombre del usuario desde la tabla `usuarios`
                a.Aud_accion,
                a.Aud_tabla,
                a.Aud_descripcion,
                a.Aud_fecha,
                a.Aud_IP
            FROM 
                auditoria a
            LEFT JOIN 
                usuarios u ON a.idUsuario = u.id_usuario
            ORDER BY 
                a.Aud_fecha DESC"; // Ordenar por los más recientes primero

    // --- PREPARACIÓN Y EJECUCIÓN DE LA CONSULTA ---
    $stmt = $conn->prepare($sql);

    // Si la preparación falla, es un error de sintaxis SQL.
    if ($stmt === false) {
        throw new Exception("Error al preparar la consulta de auditoría: " . $conn->error);
    }

    $stmt->execute();
    $result = $stmt->get_result();
    
    // Obtenemos todos los resultados como un array asociativo.
    $logs = $result->fetch_all(MYSQLI_ASSOC);
    
    $stmt->close();

    // Enviar la respuesta JSON con los registros de auditoría.
    send_json_response($logs);

} catch (Exception $e) {
    // Captura centralizada de errores para una respuesta JSON limpia.
    send_json_response(['success' => false, 'message' => 'Error interno del servidor.', 'error_details' => $e->getMessage()], 500);
} finally {
    // Cierre seguro de la conexión.
    if ($conn) {
        $conn->close();
    }
}
?>
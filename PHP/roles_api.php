<?php
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

// Solo permitimos el método GET para esta API de solo lectura.
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    send_json_response(['error' => 'Método no permitido.'], 405);
}

try {
    // --- CONSULTA A LA TABLA `roles` ---
    // Seleccionamos los roles que están activos, basándonos en tu esquema SQL.
    $stmt = $conn->prepare("SELECT id, nombre FROM roles WHERE estado = 'activo' ORDER BY nombre ASC");
    
    if ($stmt === false) {
        throw new Exception("Error al preparar la consulta de roles: " . $conn->error);
    }

    $stmt->execute();
    $result = $stmt->get_result();
    
    // Obtenemos todos los resultados como un array asociativo.
    $roles = $result->fetch_all(MYSQLI_ASSOC);
    
    $stmt->close();

    // Enviar la respuesta JSON con la lista de roles.
    send_json_response($roles);

} catch (Exception $e) {
    // Captura centralizada de errores.
    send_json_response(['success' => false, 'message' => 'Error interno del servidor.', 'error_details' => $e->getMessage()], 500);
} finally {
    // Cierre seguro de la conexión.
    if ($conn) {
        $conn->close();
    }
}
?>
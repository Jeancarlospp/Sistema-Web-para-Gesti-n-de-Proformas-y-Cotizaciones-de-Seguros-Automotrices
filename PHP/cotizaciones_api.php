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

// Capturar el método de la solicitud. Solo se permite GET para esta API.
$method = $_SERVER['REQUEST_METHOD'];

if ($method !== 'GET') {
    send_json_response(['error' => 'Método no permitido. Solo se aceptan solicitudes GET.'], 405);
}

try {
    // --- CONSTRUCCIÓN DE LA CONSULTA SQL BASE ---
    // Hacemos JOIN con las tablas de cliente y usuarios para obtener sus nombres.
    $sql = "SELECT 
                c.idCotizacion,
                c.Cot_montoAsegurable,
                c.Cot_estado,
                c.Cot_fechaCreacion,
                cli.Cli_nombre,
                u.nombre as nombre_usuario
            FROM 
                cotizacion c
            JOIN 
                cliente cli ON c.idCliente = cli.idCliente
            JOIN 
                usuarios u ON c.idUsuario = u.id_usuario";

    // --- MANEJO DINÁMICO DE FILTROS ---
    $conditions = [];
    $params = [];
    $types = '';

    // Filtro por ID de Usuario
    if (!empty($_GET['idUsuario'])) {
        $conditions[] = "c.idUsuario = ?";
        $params[] = intval($_GET['idUsuario']);
        $types .= 'i';
    }

    // Filtro por nombre o cédula del cliente
    if (!empty($_GET['cliente'])) {
        $cliente_search = '%' . $_GET['cliente'] . '%';
        $conditions[] = "(cli.Cli_nombre LIKE ? OR cli.Cli_cedula LIKE ?)";
        $params[] = $cliente_search;
        $params[] = $cliente_search;
        $types .= 'ss';
    }

    // Filtro por fecha de inicio
    if (!empty($_GET['fecha_inicio'])) {
        $conditions[] = "c.Cot_fechaCreacion >= ?";
        $params[] = $_GET['fecha_inicio'];
        $types .= 's';
    }

    // Filtro por fecha de fin
    if (!empty($_GET['fecha_fin'])) {
        // Añadimos la hora final del día para incluir todos los registros de ese día.
        $fecha_fin = $_GET['fecha_fin'] . ' 23:59:59';
        $conditions[] = "c.Cot_fechaCreacion <= ?";
        $params[] = $fecha_fin;
        $types .= 's';
    }

    // Si hay condiciones, las añadimos a la consulta SQL.
    if (!empty($conditions)) {
        $sql .= " WHERE " . implode(" AND ", $conditions);
    }

    // Ordenar los resultados
    $sql .= " ORDER BY c.Cot_fechaCreacion DESC";

    // --- PREPARACIÓN Y EJECUCIÓN DE LA CONSULTA ---
    $stmt = $conn->prepare($sql);

    // Si la preparación falla, es un error de sintaxis SQL.
    if ($stmt === false) {
        throw new Exception("Error al preparar la consulta: " . $conn->error);
    }

    // Si hay parámetros, los vinculamos a la consulta.
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }

    $stmt->execute();
    $result = $stmt->get_result();
    $cotizaciones = $result->fetch_all(MYSQLI_ASSOC);
    $stmt->close();

    // Enviar la respuesta JSON con los resultados.
    send_json_response($cotizaciones);

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
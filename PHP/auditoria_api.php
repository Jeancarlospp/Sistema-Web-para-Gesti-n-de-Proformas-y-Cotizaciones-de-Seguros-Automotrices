<?php
session_start();
require_once 'conexion.php';

header('Content-Type: application/json');

function send_json_response($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    send_json_response(['error' => 'Método no permitido'], 405);
}

$db = new Conexion();
$conn = $db->getConn();

try {
    // --- PARÁMETROS DE PAGINACIÓN Y FILTRADO ---
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    $offset = ($page - 1) * $limit;

    $search = $_GET['search'] ?? '';
    $action = $_GET['action'] ?? '';
    $startDate = $_GET['startDate'] ?? '';
    $endDate = $_GET['endDate'] ?? '';
    $sortBy = $_GET['sortBy'] ?? 'Aud_fecha DESC'; // Parámetro de ordenamiento

    // --- LISTA BLANCA DE SEGURIDAD PARA `ORDER BY` ---
    $allowedSortColumns = ['Aud_fecha DESC', 'Aud_fecha ASC', 'idAuditoria DESC', 'idAuditoria ASC'];
    if (!in_array($sortBy, $allowedSortColumns)) {
        $sortBy = 'Aud_fecha DESC'; // Valor predeterminado seguro si el parámetro es inválido
    }

    // --- CONSTRUCCIÓN DE LA CONSULTA ---
    $baseSql = "FROM auditoria a LEFT JOIN usuarios u ON a.idUsuario = u.id_usuario";
    $whereConditions = [];
    $params = [];
    $types = '';

    if (!empty($search)) {
        $whereConditions[] = "(a.Aud_descripcion LIKE ? OR u.nombre LIKE ?)";
        $searchTerm = "%{$search}%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $types .= 'ss';
    }
    if (!empty($action)) {
        $whereConditions[] = "a.Aud_accion = ?";
        $params[] = $action;
        $types .= 's';
    }
    if (!empty($startDate)) {
        $whereConditions[] = "a.Aud_fecha >= ?";
        $params[] = $startDate . ' 00:00:00';
        $types .= 's';
    }
    if (!empty($endDate)) {
        $whereConditions[] = "a.Aud_fecha <= ?";
        $params[] = $endDate . ' 23:59:59';
        $types .= 's';
    }

    $whereSql = !empty($whereConditions) ? " WHERE " . implode(" AND ", $whereConditions) : "";

    // --- OBTENER EL TOTAL DE REGISTROS (PARA PAGINACIÓN) ---
    $countSql = "SELECT COUNT(a.idAuditoria) as total " . $baseSql . $whereSql;
    $stmtCount = $conn->prepare($countSql);
    if ($stmtCount === false) throw new Exception("Error al preparar la consulta de conteo: " . $conn->error);
    if (!empty($types)) {
        $stmtCount->bind_param($types, ...$params);
    }
    $stmtCount->execute();
    $totalRecords = (int)$stmtCount->get_result()->fetch_assoc()['total'];
    $totalPages = ceil($totalRecords / $limit);
    $stmtCount->close();

    // --- OBTENER LOS DATOS DE LA PÁGINA ACTUAL CON ORDENAMIENTO DINÁMICO ---
    $dataSql = "SELECT a.idAuditoria, a.idUsuario, u.nombre as nombre_usuario, a.Aud_accion, a.Aud_tabla, a.Aud_descripcion, a.Aud_fecha "
             . $baseSql . $whereSql . " ORDER BY " . $sortBy . " LIMIT ? OFFSET ?"; // Se usa $sortBy validado
    
    $stmtData = $conn->prepare($dataSql);
    if ($stmtData === false) throw new Exception("Error al preparar la consulta de datos: " . $conn->error);
    
    $dataParams = $params;
    $dataTypes = $types . 'ii';
    $dataParams[] = $limit;
    $dataParams[] = $offset;

    if (!empty($dataTypes)) {
      $stmtData->bind_param($dataTypes, ...$dataParams);
    }
    $stmtData->execute();
    $logs = $stmtData->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmtData->close();

    // --- ENVIAR RESPUESTA JSON ESTRUCTURADA ---
    $response = [
        'data' => $logs,
        'pagination' => [
            'totalRecords' => $totalRecords,
            'totalPages' => $totalPages,
            'currentPage' => $page,
            'limit' => $limit
        ]
    ];
    
    send_json_response($response);

} catch (Exception $e) {
    send_json_response(['success' => false, 'message' => 'Error interno del servidor.', 'error_details' => $e->getMessage()], 500);
} finally {
    if ($conn) {
        $conn->close();
    }
}
?>
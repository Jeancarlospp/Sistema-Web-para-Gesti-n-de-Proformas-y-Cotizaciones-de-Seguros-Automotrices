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
    // PARÁMETROS DE PAGINACIÓN, FILTRADO Y ORDENAMIENTO
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    $offset = ($page - 1) * $limit;

    $search = $_GET['search'] ?? '';
    $idUsuario = $_GET['idUsuario'] ?? '';
    $startDate = $_GET['fecha_inicio'] ?? '';
    $endDate = $_GET['fecha_fin'] ?? '';
    $sortBy = $_GET['sortBy'] ?? 'Cot_fechaCreacion DESC';

    // LISTA BLANCA DE SEGURIDAD PARA `ORDER BY`
    $allowedSortColumns = [
        'Cot_fechaCreacion DESC', 'Cot_fechaCreacion ASC',
        'idCotizacion DESC', 'idCotizacion ASC',
        'Cot_montoAsegurable DESC', 'Cot_montoAsegurable ASC'
    ];
    if (!in_array($sortBy, $allowedSortColumns)) {
        $sortBy = 'Cot_fechaCreacion DESC'; // Default seguro
    }

    // CONSTRUCCIÓN DE CONSULTAS DINÁMICAS
    $baseSql = "FROM cotizacion c 
                JOIN cliente cli ON c.idCliente = cli.idCliente 
                JOIN usuarios u ON c.idUsuario = u.id_usuario";
    $whereConditions = [];
    $params = [];
    $types = '';

    if (!empty($search)) {
        $whereConditions[] = "(cli.Cli_nombre LIKE ? OR cli.Cli_cedula LIKE ? OR c.idCotizacion = ?)";
        $searchTerm = "%{$search}%";
        $params[] = $searchTerm;
        $params[] = $searchTerm;
        $params[] = $search;
        $types .= 'ssi';
    }
    if (!empty($idUsuario)) {
        $whereConditions[] = "c.idUsuario = ?";
        $params[] = (int)$idUsuario;
        $types .= 'i';
    }
    if (!empty($startDate)) {
        $whereConditions[] = "c.Cot_fechaCreacion >= ?";
        $params[] = $startDate . ' 00:00:00';
        $types .= 's';
    }
    if (!empty($endDate)) {
        $whereConditions[] = "c.Cot_fechaCreacion <= ?";
        $params[] = $endDate . ' 23:59:59';
        $types .= 's';
    }

    $whereSql = !empty($whereConditions) ? " WHERE " . implode(" AND ", $whereConditions) : "";

    // OBTENER TOTAL DE REGISTROS
    $countSql = "SELECT COUNT(c.idCotizacion) as total " . $baseSql . $whereSql;
    $stmtCount = $conn->prepare($countSql);
    if (!empty($types)) $stmtCount->bind_param($types, ...$params);
    $stmtCount->execute();
    $totalRecords = (int)$stmtCount->get_result()->fetch_assoc()['total'];
    $totalPages = ceil($totalRecords / $limit);
    $stmtCount->close();

    // OBTENER DATOS DE LA PÁGINA ACTUAL
    $dataSql = "SELECT c.idCotizacion, c.Cot_montoAsegurable, c.Cot_estado, c.Cot_fechaCreacion, 
                       cli.Cli_nombre, u.nombre as nombre_usuario "
             . $baseSql . $whereSql . " ORDER BY " . $sortBy . " LIMIT ? OFFSET ?"; // Se usa $sortBy validado
    
    $stmtData = $conn->prepare($dataSql);
    $dataParams = $params;
    $dataTypes = $types . 'ii';
    $dataParams[] = $limit;
    $dataParams[] = $offset;

    if (!empty($dataTypes)) $stmtData->bind_param($dataTypes, ...$dataParams);
    $stmtData->execute();
    $cotizaciones = $stmtData->get_result()->fetch_all(MYSQLI_ASSOC);
    $stmtData->close();

    // ENVIAR RESPUESTA JSON ESTRUCTURADA
    send_json_response([
        'data' => $cotizaciones,
        'pagination' => [
            'totalRecords' => $totalRecords,
            'totalPages' => $totalPages,
            'currentPage' => $page,
            'limit' => $limit
        ]
    ]);

} catch (Exception $e) {
    send_json_response(['success' => false, 'message' => 'Error interno del servidor.', 'error_details' => $e->getMessage()], 500);
} finally {
    if ($conn) $conn->close();
}
?>
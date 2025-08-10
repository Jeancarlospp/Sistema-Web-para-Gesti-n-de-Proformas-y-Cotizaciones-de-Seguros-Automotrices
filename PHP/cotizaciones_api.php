<?php
session_start();
require_once 'conexion.php';
header('Content-Type: application/json');

function send_json_response($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

$db = new Conexion();
$conn = $db->getConn();

try {

    //LISTAR COTIZACIONES (GET)
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {

        // Parámetros de paginación
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
        $offset = ($page - 1) * $limit;

        $search = $_GET['search'] ?? '';
        $idUsuario = $_GET['idUsuario'] ?? '';
        $startDate = $_GET['fecha_inicio'] ?? '';
        $endDate = $_GET['fecha_fin'] ?? '';
        $sortBy = $_GET['sortBy'] ?? 'Cot_fechaCreacion DESC';

        // Lista blanca de columnas seguras para ORDER BY
        $allowedSortColumns = [
            'Cot_fechaCreacion DESC', 'Cot_fechaCreacion ASC',
            'idCotizacion DESC', 'idCotizacion ASC',
            'Cot_montoAsegurable DESC', 'Cot_montoAsegurable ASC'
        ];
        if (!in_array($sortBy, $allowedSortColumns)) {
            $sortBy = 'Cot_fechaCreacion DESC';
        }

        // Construcción de la consulta base
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

        // Obtener total de registros
        $countSql = "SELECT COUNT(c.idCotizacion) as total " . $baseSql . $whereSql;
        $stmtCount = $conn->prepare($countSql);
        if (!empty($types)) $stmtCount->bind_param($types, ...$params);
        $stmtCount->execute();
        $totalRecords = (int)$stmtCount->get_result()->fetch_assoc()['total'];
        $totalPages = ceil($totalRecords / $limit);
        $stmtCount->close();

        // Obtener registros
        $dataSql = "SELECT c.idCotizacion, c.Cot_montoAsegurable, c.Cot_estado, c.Cot_fechaCreacion, 
                           cli.Cli_nombre, u.nombre as nombre_usuario "
                 . $baseSql . $whereSql . " ORDER BY " . $sortBy . " LIMIT ? OFFSET ?";

        $stmtData = $conn->prepare($dataSql);
        $dataParams = $params;
        $dataTypes = $types . 'ii';
        $dataParams[] = $limit;
        $dataParams[] = $offset;

        if (!empty($dataTypes)) $stmtData->bind_param($dataTypes, ...$dataParams);
        $stmtData->execute();
        $cotizaciones = $stmtData->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmtData->close();

        send_json_response([
            'data' => $cotizaciones,
            'pagination' => [
                'totalRecords' => $totalRecords,
                'totalPages' => $totalPages,
                'currentPage' => $page,
                'limit' => $limit
            ]
        ]);
    }

    // GUARDAR COTIZACIÓN (POST)
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {

        $input = json_decode(file_get_contents("php://input"), true);
        $idCliente = intval($input['idCliente'] ?? 0);
        $idUsuario = intval($input['idUsuario'] ?? 0);
        $planes = $input['planes'] ?? [];

        if ($idCliente <= 0 || $idUsuario <= 0 || empty($planes)) {
            send_json_response(['success' => false, 'message' => 'Datos incompletos'], 400);
        }

        // Calcular monto total
        $placeholders = implode(',', array_fill(0, count($planes), '?'));
        $types = str_repeat('i', count($planes));
        $stmt = $conn->prepare("SELECT SUM(Pro_precioTotal) as total FROM producto WHERE idproducto IN ($placeholders)");
        $stmt->bind_param($types, ...$planes);
        $stmt->execute();
        $totalRow = $stmt->get_result()->fetch_assoc();
        $montoTotal = $totalRow['total'] ?? 0;
        $stmt->close();

        // Insertar cotización
        $stmt = $conn->prepare("INSERT INTO cotizacion (Cot_montoAsegurable, idCliente, idUsuario, Cot_estado) VALUES (?, ?, ?, 'borrador')");
        $stmt->bind_param('dii', $montoTotal, $idCliente, $idUsuario);
        if (!$stmt->execute()) {
            send_json_response(['success' => false, 'message' => 'Error insertando cotización', 'error' => $stmt->error], 500);
        }
        $idCotizacion = $stmt->insert_id;
        $stmt->close();

        // Insertar detalles
        $stmt = $conn->prepare("INSERT INTO detalle_cotizacion (idCotizacion, idProducto, Det_numServicios, Det_precioUnitario, Det_subtotal) VALUES (?, ?, 1, ?, ?)");
        foreach ($planes as $idProd) {
            $pstmt = $conn->prepare("SELECT Pro_precioTotal FROM producto WHERE idproducto = ?");
            $pstmt->bind_param('i', $idProd);
            $pstmt->execute();
            $prodRow = $pstmt->get_result()->fetch_assoc();
            $precio = $prodRow['Pro_precioTotal'] ?? 0;
            $pstmt->close();

            $stmt->bind_param('iidd', $idCotizacion, $idProd, $precio, $precio);
            $stmt->execute();
        }
        $stmt->close();

        send_json_response(['success' => true, 'idCotizacion' => $idCotizacion]);
    }

    //MÉTODO NO PERMITIDO
    else {
        send_json_response(['error' => 'Método no permitido'], 405);
    }

} catch (Exception $e) {
    send_json_response(['success' => false, 'message' => 'Error interno del servidor.', 'error_details' => $e->getMessage()], 500);
} finally {
    if ($conn) $conn->close();
}

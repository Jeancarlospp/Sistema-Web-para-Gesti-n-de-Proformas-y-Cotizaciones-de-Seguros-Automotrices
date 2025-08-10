<?php
// Mostrar errores para depuración
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

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
if (!$conn) {
    send_json_response(['success' => false, 'message' => 'No se pudo conectar a la base de datos'], 500);
}

try {
    // LISTAR COTIZACIONES (GET)
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
        
        // Validar JSON
        if (!is_array($input)) {
            send_json_response([
                'success' => false, 
                'message' => 'No se recibió un JSON válido',
                'debug_input' => file_get_contents("php://input")
            ], 400);
        }

        $idCliente = intval($input['idCliente'] ?? 0);
        $idUsuario = intval($input['idUsuario'] ?? 0);
        $planes = $input['planes'] ?? [];

        // Validaciones iniciales
        if ($idCliente <= 0) {
            send_json_response(['success' => false, 'message' => 'ID de cliente inválido'], 400);
        }
        if ($idUsuario <= 0) {
            send_json_response(['success' => false, 'message' => 'ID de usuario inválido'], 400);
        }
        if (!is_array($planes) || count($planes) === 0) {
            send_json_response(['success' => false, 'message' => 'Debe seleccionar al menos un plan'], 400);
        }

        // Validar que planes sea un array de enteros válidos
        foreach ($planes as $i => $planId) {
            if (!is_numeric($planId) || intval($planId) <= 0) {
                send_json_response([
                    'success' => false, 
                    'message' => 'ID de plan inválido en posición ' . $i,
                    'plan_value' => $planId
                ], 400);
            }
            $planes[$i] = intval($planId);
        }

        // Verificar existencia de cliente
        $stmt = $conn->prepare('SELECT Cli_nombre FROM cliente WHERE idCliente = ? AND Cli_estado = "activo"');
        $stmt->bind_param('i', $idCliente);
        $stmt->execute();
        $clientResult = $stmt->get_result()->fetch_assoc();
        if (!$clientResult) {
            send_json_response(['success' => false, 'message' => 'Cliente no existe o está inactivo'], 400);
        }
        $stmt->close();

        // Verificar existencia de usuario
        $stmt = $conn->prepare('SELECT nombre FROM usuarios WHERE id_usuario = ? AND estado = "activo"');
        $stmt->bind_param('i', $idUsuario);
        $stmt->execute();
        $userResult = $stmt->get_result()->fetch_assoc();
        if (!$userResult) {
            send_json_response(['success' => false, 'message' => 'Usuario no existe o está inactivo'], 400);
        }
        $stmt->close();

        // Verificar que todos los productos existen y están activos
        $placeholders = implode(',', array_fill(0, count($planes), '?'));
        $types = str_repeat('i', count($planes));
        $stmt = $conn->prepare("SELECT idproducto, Pro_nombre, Pro_precioTotal FROM producto WHERE idproducto IN ($placeholders) AND Pro_estado = 'activo'");
        $stmt->bind_param($types, ...$planes);
        $stmt->execute();
        $productResults = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();

        if (count($productResults) !== count($planes)) {
            send_json_response(['success' => false, 'message' => 'Algunos productos seleccionados no existen o están inactivos'], 400);
        }

        // Calcular monto total
        $montoTotal = 0;
        $productosValidos = [];
        foreach ($productResults as $product) {
            $montoTotal += floatval($product['Pro_precioTotal']);
            $productosValidos[$product['idproducto']] = $product;
        }

        // Iniciar transacción para garantizar consistencia
        $conn->autocommit(false);

        try {
            // Insertar cotización principal
            $stmt = $conn->prepare("INSERT INTO cotizacion (Cot_montoAsegurable, idCliente, idUsuario, Cot_estado, Cot_descripcion) VALUES (?, ?, ?, 'borrador', ?)");
            $descripcion = "Cotización para " . $clientResult['Cli_nombre'] . " - " . count($planes) . " plan(es) seleccionado(s)";
            $stmt->bind_param('diis', $montoTotal, $idCliente, $idUsuario, $descripcion);
            
            if (!$stmt->execute()) {
                throw new Exception('Error insertando cotización: ' . $stmt->error);
            }
            
            $idCotizacion = $stmt->insert_id;
            $stmt->close();

            // Insertar detalles de cotización
            $stmt = $conn->prepare("INSERT INTO detalle_cotizacion (idCotizacion, idProducto, Det_numServicios, Det_precioUnitario, Det_subtotal) VALUES (?, ?, 1, ?, ?)");
            
            foreach ($planes as $idProd) {
                if (!isset($productosValidos[$idProd])) {
                    throw new Exception("Producto ID $idProd no encontrado en validación");
                }
                
                $producto = $productosValidos[$idProd];
                $precio = floatval($producto['Pro_precioTotal']);
                
                $stmt->bind_param('iidd', $idCotizacion, $idProd, $precio, $precio);
                if (!$stmt->execute()) {
                    throw new Exception('Error insertando detalle de cotización: ' . $stmt->error);
                }
            }
            $stmt->close();

            // Confirmar transacción
            $conn->commit();
            
            send_json_response([
                'success' => true, 
                'idCotizacion' => $idCotizacion,
                'montoTotal' => $montoTotal,
                'message' => 'Cotización guardada exitosamente'
            ]);

        } catch (Exception $e) {
            // Rollback en caso de error
            $conn->rollback();
            throw $e;
        } finally {
            $conn->autocommit(true);
        }
    }

    // OBTENER DETALLES DE UNA COTIZACIÓN ESPECÍFICA (GET con ID)
    elseif ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['id'])) {
        $idCotizacion = intval($_GET['id']);
        
        if ($idCotizacion <= 0) {
            send_json_response(['success' => false, 'message' => 'ID de cotización inválido'], 400);
        }

        // Obtener información principal de la cotización
        $stmt = $conn->prepare("
            SELECT c.*, cli.Cli_nombre, cli.Cli_cedula, u.nombre as nombre_usuario 
            FROM cotizacion c 
            JOIN cliente cli ON c.idCliente = cli.idCliente 
            JOIN usuarios u ON c.idUsuario = u.id_usuario 
            WHERE c.idCotizacion = ?
        ");
        $stmt->bind_param('i', $idCotizacion);
        $stmt->execute();
        $cotizacion = $stmt->get_result()->fetch_assoc();
        $stmt->close();

        if (!$cotizacion) {
            send_json_response(['success' => false, 'message' => 'Cotización no encontrada'], 404);
        }

        // Obtener detalles de la cotización
        $stmt = $conn->prepare("
            SELECT dc.*, p.Pro_nombre, p.Pro_descripcion, ep.Emp_nombre 
            FROM detalle_cotizacion dc 
            JOIN producto p ON dc.idProducto = p.idproducto 
            JOIN empresas_proveedora ep ON p.idEmpresaProveedora = ep.idEmpresas_Proveedora 
            WHERE dc.idCotizacion = ?
        ");
        $stmt->bind_param('i', $idCotizacion);
        $stmt->execute();
        $detalles = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();

        send_json_response([
            'success' => true,
            'cotizacion' => $cotizacion,
            'detalles' => $detalles
        ]);
    }

    //MÉTODO NO PERMITIDO
    else {
        send_json_response(['error' => 'Método no permitido'], 405);
    }

} catch (Exception $e) {
    // Si hay una transacción activa, hacer rollback
    if (!$conn->autocommit(null)) {
        $conn->rollback();
        $conn->autocommit(true);
    }
    
    send_json_response([
        'success' => false, 
        'message' => 'Error interno del servidor.',
        'error_details' => $e->getMessage()
    ], 500);
} finally {
    if ($conn) $conn->close();
}
?>
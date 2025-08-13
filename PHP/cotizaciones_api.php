<?php
// Mostrar errores para depuración (comentar en producción).
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

if (session_status() == PHP_SESSION_NONE) {
    session_start();
}
require_once 'Conexion.php';
header('Content-Type: application/json');

function send_json_response($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

$db = new Conexion();
$conn = $db->getConn();
if (!$conn) {
    send_json_response(['success' => false, 'message' => 'Error crítico: No se pudo conectar a la base de datos.'], 503);
}

try {
    // =======================================================================
    // MÉTODO GET: LISTAR O DETALLAR COTIZACIONES
    // =======================================================================
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        
        // --- CASO 1: OBTENER DETALLES DE UNA COTIZACIÓN ESPECÍFICA ---
        if (isset($_GET['id'])) {
            $idCotizacion = intval($_GET['id']);
            if ($idCotizacion <= 0) {
                send_json_response(['success' => false, 'message' => 'ID de cotización inválido.'], 400);
            }
            
            // Consulta de detalles de la cotización (sin 'Cot_estado')
            $stmt = $conn->prepare("SELECT c.idCotizacion, c.Cot_montoAsegurable, c.Cot_descripcion, c.Cot_fechaCreacion, cli.Cli_nombre, cli.Cli_cedula, u.nombre as nombre_usuario FROM cotizacion c JOIN cliente cli ON c.idCliente = cli.idCliente JOIN usuarios u ON c.idUsuario = u.id_usuario WHERE c.idCotizacion = ?");
            $stmt->bind_param('i', $idCotizacion);
            $stmt->execute();
            $cotizacion = $stmt->get_result()->fetch_assoc();
            $stmt->close();

            if (!$cotizacion) {
                send_json_response(['success' => false, 'message' => 'Cotización no encontrada.'], 404);
            }
            
            // Consulta de detalles de los productos (mejorada)
            $stmt = $conn->prepare("SELECT p.*, ep.Emp_nombre, cat.Cat_nombre as nombre_categoria FROM detalle_cotizacion dc JOIN producto p ON dc.idProducto = p.idproducto JOIN empresas_proveedora ep ON p.idEmpresaProveedora = ep.idEmpresas_Proveedora LEFT JOIN categoria cat ON p.idCategoria = cat.idcategoria WHERE dc.idCotizacion = ?");
            $stmt->bind_param('i', $idCotizacion);
            $stmt->execute();
            $detalles = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmt->close();

            send_json_response(['success' => true, 'cotizacion' => $cotizacion, 'detalles' => $detalles]);
        }
        
        // --- CASO 2: LISTAR MÚLTIPLES COTIZACIONES ---
        else {
            $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
            $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
            $offset = ($page - 1) * $limit;

            $search = $_GET['search'] ?? '';
            $startDate = $_GET['fecha_inicio'] ?? '';
            $endDate = $_GET['fecha_fin'] ?? '';
            $sortBy = $_GET['sortBy'] ?? 'Cot_fechaCreacion DESC';

            $allowedSortColumns = ['Cot_fechaCreacion DESC', 'Cot_fechaCreacion ASC', 'idCotizacion DESC', 'idCotizacion ASC', 'Cot_montoAsegurable DESC', 'Cot_montoAsegurable ASC'];
            if (!in_array($sortBy, $allowedSortColumns)) $sortBy = 'Cot_fechaCreacion DESC';

            $baseSql = "FROM cotizacion c JOIN cliente cli ON c.idCliente = cli.idCliente JOIN usuarios u ON c.idUsuario = u.id_usuario";
            $whereConditions = [];
            $params = [];
            $types = '';

            if (isset($_GET['mis_cotizaciones']) && $_GET['mis_cotizaciones'] === '1') {
                if (!isset($_SESSION['usuario_id'])) {
                    send_json_response(['success' => false, 'message' => 'Acceso no autorizado.'], 403);
                }
                $whereConditions[] = "c.idUsuario = ?";
                $params[] = $_SESSION['usuario_id'];
                $types .= "i";
            }
            if (!empty($search)) {
                $whereConditions[] = "(cli.Cli_nombre LIKE ? OR c.idCotizacion = ?)";
                $searchTerm = "%{$search}%";
                array_push($params, $searchTerm, $search);
                $types .= 'si';
            }
            if (!empty($startDate)) {
                $whereConditions[] = "c.Cot_fechaCreacion >= ?";
                $params[] = $startDate;
                $types .= 's';
            }
            if (!empty($endDate)) {
                $whereConditions[] = "c.Cot_fechaCreacion <= ?";
                $params[] = $endDate;
                $types .= 's';
            }

            $whereSql = !empty($whereConditions) ? " WHERE " . implode(" AND ", $whereConditions) : "";

            $countSql = "SELECT COUNT(c.idCotizacion) as total " . $baseSql . $whereSql;
            $stmtCount = $conn->prepare($countSql);
            if (!empty($types)) $stmtCount->bind_param($types, ...$params);
            $stmtCount->execute();
            $totalRecords = (int)$stmtCount->get_result()->fetch_assoc()['total'];
            $totalPages = ceil($totalRecords / $limit);
            $stmtCount->close();
            
            // Consulta de datos (sin 'Cot_estado')
            $dataSql = "SELECT c.idCotizacion, c.Cot_montoAsegurable, c.Cot_fechaCreacion, c.Cot_descripcion, cli.Cli_nombre, u.nombre as nombre_usuario " . $baseSql . $whereSql . " ORDER BY " . $sortBy . " LIMIT ? OFFSET ?";
            $dataParams = $params;
            $dataTypes = $types . 'ii';
            array_push($dataParams, $limit, $offset);

            $stmtData = $conn->prepare($dataSql);
            if (!empty($dataTypes)) $stmtData->bind_param($dataTypes, ...$dataParams);
            $stmtData->execute();
            $cotizaciones = $stmtData->get_result()->fetch_all(MYSQLI_ASSOC);
            $stmtData->close();

            send_json_response([
                'data' => $cotizaciones,
                'pagination' => ['totalRecords' => $totalRecords, 'totalPages' => $totalPages, 'currentPage' => $page, 'limit' => $limit]
            ]);
        }
    }
    
    // =======================================================================
    // MÉTODO POST: GUARDAR UNA NUEVA COTIZACIÓN
    // =======================================================================
    elseif ($_SERVER['REQUEST_METHOD'] === 'POST') {
        $input = json_decode(file_get_contents("php://input"), true);
        
        if (!is_array($input)) {
            send_json_response(['success' => false, 'message' => 'JSON de entrada inválido.'], 400);
        }

        $idCliente = intval($input['idCliente'] ?? 0);
        $idUsuario = intval($input['idUsuario'] ?? 0);
        $planes = $input['planes'] ?? [];

        if ($idCliente <= 0 || $idUsuario <= 0 || !is_array($planes) || empty($planes)) {
            send_json_response(['success' => false, 'message' => 'Datos incompletos.'], 400);
        }

        $placeholders = implode(',', array_fill(0, count($planes), '?'));
        $types = str_repeat('i', count($planes));
        $stmt = $conn->prepare("SELECT idproducto, Pro_precioMensual FROM producto WHERE idproducto IN ($placeholders) AND Pro_estado = 'activo'");
        $stmt->bind_param($types, ...$planes);
        $stmt->execute();
        $productResults = $stmt->get_result()->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        
        if (count($productResults) !== count($planes)) {
            send_json_response(['success' => false, 'message' => 'Algunos productos no existen o están inactivos.'], 400);
        }
        
        $montoTotal = array_sum(array_column($productResults, 'Pro_precioMensual'));

        $conn->autocommit(false);

        try {
            // Inserción en `cotizacion` (sin 'Cot_estado')
            $descripcion = "Cotización generada con " . count($planes) . " plan(es)";
            $stmt = $conn->prepare("INSERT INTO cotizacion (Cot_montoAsegurable, idCliente, idUsuario, Cot_descripcion) VALUES (?, ?, ?, ?)");
            if ($stmt === false) throw new Exception('Error al preparar la inserción de cotización: ' . $conn->error);
            
            $stmt->bind_param('diis', $montoTotal, $idCliente, $idUsuario, $descripcion);
            if (!$stmt->execute()) throw new Exception('Error al ejecutar la inserción de cotización: ' . $stmt->error);
            
            $idCotizacion = $stmt->insert_id;
            $stmt->close();

            // Inserción en `detalle_cotizacion`
            $stmt = $conn->prepare("INSERT INTO detalle_cotizacion (idCotizacion, idProducto, Det_precioUnitario, Det_subtotal) VALUES (?, ?, ?, ?)");
            if ($stmt === false) throw new Exception('Error al preparar la inserción de detalle: ' . $conn->error);
            
            foreach ($productResults as $product) {
                $idProd = $product['idproducto'];
                $precio = floatval($product['Pro_precioMensual']);
                $stmt->bind_param('iidd', $idCotizacion, $idProd, $precio, $precio);
                if (!$stmt->execute()) throw new Exception('Error al ejecutar la inserción de detalle: ' . $stmt->error);
            }
            $stmt->close();

            $conn->commit();
            
            send_json_response([
                'success' => true, 
                'idCotizacion' => $idCotizacion,
                'montoTotal' => $montoTotal,
                'message' => 'Cotización guardada exitosamente'
            ]);

        } catch (Exception $e) {
            $conn->rollback();
            $conn->autocommit(true);
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
        
        if ($stmt === false) {
            send_json_response(['success' => false, 'message' => 'Error preparando consulta de cotización: ' . $conn->error], 500);
        }
        
        if (!$stmt->bind_param('i', $idCotizacion)) {
            send_json_response(['success' => false, 'message' => 'Error binding parámetros de cotización: ' . $stmt->error], 500);
        }
        
        if (!$stmt->execute()) {
            send_json_response(['success' => false, 'message' => 'Error ejecutando consulta de cotización: ' . $stmt->error], 500);
        }
        
        $result = $stmt->get_result();
        if ($result === false) {
            send_json_response(['success' => false, 'message' => 'Error obteniendo resultado de cotización: ' . $stmt->error], 500);
        }
        
        $cotizacion = $result->fetch_assoc();
        $stmt->close();

        if (!$cotizacion) {
            send_json_response(['success' => false, 'message' => 'Cotización no encontrada'], 404);
        }

        // Obtener detalles de la cotización
        $stmt = $conn->prepare("
            SELECT 
                dc.*, 
                p.Pro_nombre, 
                p.Pro_descripcion, 
                p.Pro_precioMensual,
                ep.Emp_nombre 
            FROM detalle_cotizacion dc 
            JOIN producto p ON dc.idProducto = p.idproducto 
            JOIN empresas_proveedora ep ON p.idEmpresaProveedora = ep.idEmpresas_Proveedora 
            WHERE dc.idCotizacion = ?
        ");

        
        if ($stmt === false) {
            send_json_response(['success' => false, 'message' => 'Error preparando consulta de detalles: ' . $conn->error], 500);
        }
        
        if (!$stmt->bind_param('i', $idCotizacion)) {
            send_json_response(['success' => false, 'message' => 'Error binding parámetros de detalles: ' . $stmt->error], 500);
        }
        
        if (!$stmt->execute()) {
            send_json_response(['success' => false, 'message' => 'Error ejecutando consulta de detalles: ' . $stmt->error], 500);
        }
        
        $result = $stmt->get_result();
        if ($result === false) {
            send_json_response(['success' => false, 'message' => 'Error obteniendo resultado de detalles: ' . $stmt->error], 500);
        }
        
        $detalles = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();

        send_json_response([
            'success' => true,
            'cotizacion' => $cotizacion,
            'detalles' => $detalles
        ]);
    }

    //MÉTODO NO PERMITIDO
    else {
        send_json_response(['error' => 'Método no permitido.'], 405);
    }

} catch (Exception $e) {
    if (isset($conn)) {
        $conn->rollback();
    }
    send_json_response(['success' => false, 'message' => 'Error interno del servidor.', 'error_details' => $e->getMessage()], 500);
} finally {
    if (isset($conn)) {
        $conn->autocommit(true);
        $conn->close();
    }
}
?>
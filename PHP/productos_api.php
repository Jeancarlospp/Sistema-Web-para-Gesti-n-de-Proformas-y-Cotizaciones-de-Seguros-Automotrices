
<?php
// --- MODO DE DEPURACIÓN (ACTIVADO) ---
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


try {
    $db = new Conexion();
    $conn = $db->getConn();
    $method = $_SERVER['REQUEST_METHOD'];

    switch ($method) {
        case 'GET':
            // 1. Obtener las categorías (para los <select>)
            if (isset($_GET['action']) && $_GET['action'] === 'get_categories') {
                $stmt = $conn->prepare("SELECT idcategoria, Cat_nombre FROM categoria WHERE Cat_estado = 'activo' ORDER BY Cat_nombre ASC");
                $stmt->execute();
                $result = $stmt->get_result();
                $categories = $result->fetch_all(MYSQLI_ASSOC);
                $stmt->close();
                send_json_response($categories);
            }
            
            // 1.1. Obtener las empresas proveedoras (para los <select>)
            elseif (isset($_GET['action']) && $_GET['action'] === 'get_empresas') {
                $stmt = $conn->prepare("SELECT idEmpresas_Proveedora, Emp_nombre FROM empresas_proveedora WHERE Emp_estado = 'activo' ORDER BY Emp_nombre ASC");
                $stmt->execute();
                $result = $stmt->get_result();
                $empresas = $result->fetch_all(MYSQLI_ASSOC);
                $stmt->close();
                send_json_response($empresas);
            }
            
            // --- CORRECCIÓN: Se añade un 'elseif' específico para esta petición ---
            // 2. Obtener los planes de una categoría específica (para los checkboxes del asesor)
            elseif (isset($_GET['category_id']) && !isset($_GET['page'])) {
                $categoryId = intval($_GET['category_id']);
                $stmt = $conn->prepare("SELECT idproducto, Pro_nombre FROM producto WHERE idCategoria = ? AND Pro_estado = 'activo' ORDER BY Pro_nombre ASC");
                $stmt->bind_param("i", $categoryId);
                $stmt->execute();
                $result = $stmt->get_result();
                $products = $result->fetch_all(MYSQLI_ASSOC);
                $stmt->close();
                send_json_response($products);
            }

            // 3. Obtener detalles de múltiples productos por ID (para la tabla comparativa)
            elseif (isset($_GET['ids'])) {
                $ids_string = $_GET['ids'];
                $id_array = array_filter(array_map('intval', explode(',', $ids_string)));
                if (empty($id_array)) send_json_response([]);
                
                $placeholders = implode(',', array_fill(0, count($id_array), '?'));
                $types = str_repeat('i', count($id_array));
                
                $sql = "SELECT * FROM producto WHERE idproducto IN ($placeholders)";
                $stmt = $conn->prepare($sql);
                $stmt->bind_param($types, ...$id_array);
                $stmt->execute();
                $result = $stmt->get_result();
                $products = $result->fetch_all(MYSQLI_ASSOC);
                $stmt->close();
                send_json_response($products);
            }
            
            // 4. Lógica principal para la vista con paginación (productosAsegurables.html)
            else {
                $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
                $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 6;
                $search = $_GET['search'] ?? '';
                $categoryId_filter = $_GET['category_id'] ?? ''; // Renombrado para evitar confusión
                $sortBy = $_GET['sort_by'] ?? 'Pro_nombre ASC';

                $allowedSortColumns = ['Pro_nombre ASC', 'Pro_nombre DESC', 'Pro_precioMensual ASC', 'Pro_precioMensual DESC'];
                if (!in_array($sortBy, $allowedSortColumns)) $sortBy = 'Pro_nombre ASC';

                $offset = ($page - 1) * $limit;
                $baseSql = "FROM producto p LEFT JOIN categoria c ON p.idCategoria = c.idcategoria LEFT JOIN empresas_proveedora e ON p.idEmpresaProveedora = e.idEmpresas_Proveedora";
                $conditions = [];
                $params = [];
                $types = '';

                if (!empty($search)) { $conditions[] = "p.Pro_nombre LIKE ?"; $params[] = '%' . $search . '%'; $types .= 's'; }
                if (!empty($categoryId_filter)) { $conditions[] = "p.idCategoria = ?"; $params[] = intval($categoryId_filter); $types .= 'i'; }

                $whereClause = !empty($conditions) ? " WHERE " . implode(" AND ", $conditions) : "";

                $sql_total = "SELECT COUNT(p.idproducto) as total " . $baseSql . $whereClause;
                $stmt_total = $conn->prepare($sql_total);
                if (!empty($params)) $stmt_total->bind_param($types, ...$params);
                $stmt_total->execute();
                $totalRecords = $stmt_total->get_result()->fetch_assoc()['total'];
                $stmt_total->close();

                $sql_data = "SELECT p.*, c.Cat_nombre as nombre_categoria, e.Emp_nombre as nombre_empresa " . $baseSql . $whereClause . " ORDER BY " . $sortBy . " LIMIT ? OFFSET ?";
                $params[] = $limit; $params[] = $offset; $types .= 'ii';

                $stmt_data = $conn->prepare($sql_data);
                $stmt_data->bind_param($types, ...$params);
                $stmt_data->execute();
                $products = $stmt_data->get_result()->fetch_all(MYSQLI_ASSOC);
                $stmt_data->close();
                
                send_json_response(['total' => $totalRecords, 'data' => $products]);
            }
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            if (!isset($data['action'])) send_json_response(['success' => false, 'message' => 'Acción no especificada.'], 400);

            switch ($data['action']) {
                case 'create_product':
                    if (empty($data['Pro_nombre']) || !isset($data['Pro_precioMensual']) || empty($data['idCategoria']) || empty($data['idEmpresaProveedora'])) {
                        send_json_response(['success' => false, 'message' => 'Nombre, precio mensual, categoría y empresa son requeridos.'], 400);
                    }
                    
                    $Pro_nombre = $data['Pro_nombre'];
                    $Pro_descripcion = $data['Pro_descripcion'] ?? null;
                    $Pro_precioMensual = $data['Pro_precioMensual'];
                    $Pro_mesesCobertura = $data['Pro_mesesCobertura'] ?? 12;
                    $Pro_precioTotal = $data['Pro_precioTotal'] ?? ($Pro_precioMensual * $Pro_mesesCobertura);
                    $Pro_responsabilidadCivil = $data['Pro_responsabilidadCivil'] ?? null;
                    $Pro_roboTotal = $data['Pro_roboTotal'] ?? 'no';
                    $Pro_asistenciaVial = $data['Pro_asistenciaVial'] ?? 'basica';
                    $Pro_dañosColision = $data['Pro_dañosColision'] ?? null;
                    $Pro_autoReemplazo = $data['Pro_autoReemplazo'] ?? 'no';
                    $Pro_gastosLegales = $data['Pro_gastosLegales'] ?? null;
                    $Pro_gastosMedicos = $data['Pro_gastosMedicos'] ?? null;
                    $idCategoria = intval($data['idCategoria']);
                    $idEmpresaProveedora = intval($data['idEmpresaProveedora']);
                    $Pro_estado = $data['Pro_estado'] ?? 'activo';

                    $stmt = $conn->prepare("INSERT INTO producto (Pro_nombre, Pro_descripcion, Pro_precioTotal, Pro_mesesCobertura, Pro_responsabilidadCivil, Pro_roboTotal, Pro_asistenciaVial, Pro_dañosColision, Pro_autoReemplazo, Pro_gastosLegales, Pro_gastosMedicos, Pro_precioMensual, idCategoria, idEmpresaProveedora, Pro_estado) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
                    $stmt->bind_param("ssdidssssdddiis", $Pro_nombre, $Pro_descripcion, $Pro_precioTotal, $Pro_mesesCobertura, $Pro_responsabilidadCivil, $Pro_roboTotal, $Pro_asistenciaVial, $Pro_dañosColision, $Pro_autoReemplazo, $Pro_gastosLegales, $Pro_gastosMedicos, $Pro_precioMensual, $idCategoria, $idEmpresaProveedora, $Pro_estado);
                    
                    if (!$stmt->execute()) throw new Exception("Error al crear el producto: " . $stmt->error);
                    send_json_response(['success' => true, 'message' => 'Producto creado con éxito.']);
                    break;

                // --- ACCIÓN COMPLETADA: Actualizar un producto existente ---
                case 'update_product':
                    if (empty($data['idproducto'])) {
                        send_json_response(['success' => false, 'message' => 'ID de producto no proporcionado.'], 400);
                    }
                    // Asignar todas las variables del formulario de edición
                    $idproducto = intval($data['idproducto']);
                    $Pro_nombre = $data['Pro_nombre'];
                    $Pro_descripcion = $data['Pro_descripcion'];
                    $Pro_precioMensual = $data['Pro_precioMensual'];
                    $Pro_mesesCobertura = $data['Pro_mesesCobertura'];
                    $Pro_precioTotal = $data['Pro_precioTotal'] ?? ($Pro_precioMensual * $Pro_mesesCobertura);
                    $Pro_responsabilidadCivil = $data['Pro_responsabilidadCivil'];
                    $Pro_roboTotal = $data['Pro_roboTotal'];
                    $Pro_asistenciaVial = $data['Pro_asistenciaVial'];
                    $Pro_dañosColision = $data['Pro_dañosColision'];
                    $Pro_autoReemplazo = $data['Pro_autoReemplazo'];
                    $Pro_gastosLegales = $data['Pro_gastosLegales'];
                    $Pro_gastosMedicos = $data['Pro_gastosMedicos'];
                    $idCategoria = intval($data['idCategoria']);
                    $idEmpresaProveedora = intval($data['idEmpresaProveedora']);

                    $stmt = $conn->prepare(
                        "UPDATE producto SET 
                            Pro_nombre = ?, Pro_descripcion = ?, Pro_precioTotal = ?, Pro_mesesCobertura = ?, 
                            Pro_responsabilidadCivil = ?, Pro_roboTotal = ?, Pro_asistenciaVial = ?, Pro_dañosColision = ?, 
                            Pro_autoReemplazo = ?, Pro_gastosLegales = ?, Pro_gastosMedicos = ?, Pro_precioMensual = ?, 
                            idCategoria = ?, idEmpresaProveedora = ?
                         WHERE idproducto = ?"
                    );
                    // Asegurarse de que el bind_param coincida con todos los '?' (14 campos + 1 id = 15)
                    $stmt->bind_param("ssdidssssdddiis", $Pro_nombre, $Pro_descripcion, $Pro_precioTotal, $Pro_mesesCobertura, $Pro_responsabilidadCivil, $Pro_roboTotal, $Pro_asistenciaVial, $Pro_dañosColision, $Pro_autoReemplazo, $Pro_gastosLegales, $Pro_gastosMedicos, $Pro_precioMensual, $idCategoria, $idEmpresaProveedora, $idproducto);
                    
                    if (!$stmt->execute()) throw new Exception("Error al actualizar el producto: " . $stmt->error);
                    send_json_response(['success' => true, 'message' => 'Producto actualizado con éxito.']);
                    break;

                case 'update_status':
                    if (empty($data['id']) || empty($data['estado'])) send_json_response(['success' => false, 'message' => 'ID y nuevo estado son requeridos.'], 400);
                    
                    $id = intval($data['id']);
                    $estado = ($data['estado'] === 'activo') ? 'activo' : 'inactivo';

                    $stmt = $conn->prepare("UPDATE producto SET Pro_estado = ? WHERE idproducto = ?");
                    $stmt->bind_param("si", $estado, $id);
                    
                    if (!$stmt->execute()) throw new Exception("Error al cambiar el estado del producto.");
                    send_json_response(['success' => true, 'message' => 'Estado del producto actualizado.']);
                    break;

                default:
                    send_json_response(['success' => false, 'message' => 'Acción POST no válida.'], 400);
            }
            break;

        default:
            send_json_response(['error' => 'Método no permitido'], 405);
    }
} catch (Exception $e) {
    send_json_response(['success' => false, 'message' => 'Error interno del servidor.', 'error_details' => $e->getMessage()], 500);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
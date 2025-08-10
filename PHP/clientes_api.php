<?php
// --- MODO DE DEPURACIÓN (DESACTIVAR EN PRODUCCIÓN) ---
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

session_start();
require_once 'conexion.php';
require_once 'utils.php';
require_once 'auditoria_helper.php';
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
            // Lógica para obtener un solo cliente por ID (para el modal de edición)
            if (isset($_GET['id'])) {
                $idCliente = intval($_GET['id']);
                $stmt = $conn->prepare("SELECT * FROM cliente WHERE idCliente = ?");
                $stmt->bind_param("i", $idCliente);
                $stmt->execute();
                $result = $stmt->get_result();
                $cliente = $result->fetch_assoc();
                $stmt->close();
                if ($cliente) {
                    send_json_response($cliente);
                } else {
                    send_json_response(['error' => 'Cliente no encontrado.'], 404);
                }
            }

            // --- LÓGICA MEJORADA PARA LA TABLA CON PAGINACIÓN, BÚSQUEDA Y ORDENAMIENTO ---
            $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
            $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
            $search = $_GET['search'] ?? '';
            $sortBy = $_GET['sort_by'] ?? 'Cli_nombre ASC';

            // Lista blanca de columnas permitidas para ordenar para prevenir inyección SQL
            $allowedSortColumns = ['idCliente ASC', 'idCliente DESC', 'Cli_nombre ASC', 'Cli_nombre DESC', 'Cli_fechaRegistro ASC', 'Cli_fechaRegistro DESC'];
            if (!in_array($sortBy, $allowedSortColumns)) {
                $sortBy = 'Cli_nombre ASC'; // Valor por defecto seguro
            }

            $offset = ($page - 1) * $limit;

            // --- Construcción de consultas dinámicas y seguras ---
            $conditions = [];
            $params = [];
            $types = '';

            if (!empty($search)) {
                $conditions[] = "(Cli_nombre LIKE ? OR Cli_cedula LIKE ?)";
                $searchTerm = '%' . $search . '%';
                $params[] = $searchTerm;
                $params[] = $searchTerm;
                $types .= 'ss';
            }

            $whereClause = !empty($conditions) ? " WHERE " . implode(" AND ", $conditions) : "";

            // --- Consulta 1: Obtener el TOTAL de registros que coinciden ---
            $sql_total = "SELECT COUNT(*) as total FROM cliente" . $whereClause;
            $stmt_total = $conn->prepare($sql_total);
            if (!empty($params)) {
                $stmt_total->bind_param($types, ...$params);
            }
            $stmt_total->execute();
            $total_result = $stmt_total->get_result()->fetch_assoc();
            $totalRecords = $total_result['total'];
            $stmt_total->close();

            // --- Consulta 2: Obtener los DATOS de la página actual ---
            $sql_data = "SELECT * FROM cliente" . $whereClause . " ORDER BY " . $sortBy . " LIMIT ? OFFSET ?";
            $params[] = $limit;
            $params[] = $offset;
            $types .= 'ii';

            $stmt_data = $conn->prepare($sql_data);
            $stmt_data->bind_param($types, ...$params);
            $stmt_data->execute();
            $result_data = $stmt_data->get_result();
            $clientes = $result_data->fetch_all(MYSQLI_ASSOC);
            $stmt_data->close();
            
            // Enviar la respuesta estructurada que el JS espera
            send_json_response([
                'total' => $totalRecords,
                'data' => $clientes
            ]);
            break;

        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            if (!isset($data['action'])) send_json_response(['success' => false, 'message' => 'Acción no especificada.'], 400);

            switch ($data['action']) {
                case 'create_client':
                    if (!isset($_SESSION['usuario_id'])) {
                        send_json_response(['success' => false, 'message' => 'Usuario no autenticado.'], 401);
                    }
                    if (empty($data['Cli_nombre']) || empty($data['Cli_cedula'])) {
                        send_json_response(['success' => false, 'message' => 'El nombre y la cédula son requeridos.'], 400);
                    }

                    $nombre = $data['Cli_nombre'];
                    $cedula = $data['Cli_cedula'];
                    $correo = $data['Cli_correo'];
                    $telefono = $data['Cli_telefono'];

                    $stmt = $conn->prepare("INSERT INTO cliente (Cli_nombre, Cli_cedula, Cli_correo, Cli_telefono, Cli_estado) VALUES (?, ?, ?, ?, 'activo')");
                    $stmt->bind_param("ssss", $nombre, $cedula, $correo, $telefono);
                    
                    if (!$stmt->execute()) {
                        if ($conn->errno == 1062) throw new Exception("La cédula ingresada ya está registrada.");
                        throw new Exception("Error al crear el cliente.");
                    }

                    $nuevoId = $conn->insert_id;

                    // Registrar en auditoría
                    $descripcion = sprintf(
                        "Creación de nuevo cliente: %s (Cédula: %s, Correo: %s, Teléfono: %s)",
                        $nombre,
                        $cedula,
                        $correo ?: 'No especificado',
                        $telefono ?: 'No especificado'
                    );
                    
                    registrarAuditoria(
                        $conn,
                        $_SESSION['usuario_id'],
                        'INSERT',
                        'cliente',
                        $descripcion
                    );

                    send_json_response(['success' => true, 'message' => 'Cliente creado con éxito.']);
                    break;
                
                case 'update_client':
                    if (!isset($_SESSION['usuario_id'])) {
                        send_json_response(['success' => false, 'message' => 'Usuario no autenticado.'], 401);
                    }
                    if (empty($data['idCliente'])) {
                        send_json_response(['success' => false, 'message' => 'ID de cliente no proporcionado.'], 400);
                    }

                    // Obtener datos antiguos del cliente para la auditoría
                    $stmtOld = $conn->prepare("SELECT Cli_nombre, Cli_cedula FROM cliente WHERE idCliente = ?");
                    $stmtOld->bind_param("i", $data['idCliente']);
                    $stmtOld->execute();
                    $oldData = $stmtOld->get_result()->fetch_assoc();
                    $stmtOld->close();

                    // Realizar la actualización
                    $stmt = $conn->prepare("UPDATE cliente SET Cli_nombre = ?, Cli_cedula = ?, Cli_correo = ?, Cli_telefono = ? WHERE idCliente = ?");
                    $stmt->bind_param("ssssi", $data['Cli_nombre'], $data['Cli_cedula'], $data['Cli_correo'], $data['Cli_telefono'], $data['idCliente']);
                    
                    if (!$stmt->execute()) {
                        if ($conn->errno == 1062) throw new Exception("La cédula ingresada ya pertenece a otro cliente.");
                        throw new Exception("Error al actualizar el cliente.");
                    }

                    // Registrar en auditoría
                    $descripcion = sprintf(
                        "Actualización del cliente ID: %d. Cambios: %s -> %s", 
                        $data['idCliente'],
                        $oldData['Cli_nombre'],
                        $data['Cli_nombre']
                    );
                    
                    registrarAuditoria(
                        $conn,
                        $_SESSION['usuario_id'],
                        'UPDATE',
                        'cliente',
                        $descripcion
                    );

                    send_json_response(['success' => true, 'message' => 'Cliente actualizado con éxito.']);
                    break;
                    
                case 'update_status':
                    if (!isset($_SESSION['usuario_id'])) {
                        send_json_response(['success' => false, 'message' => 'Usuario no autenticado.'], 401);
                    }
                    if (empty($data['id'])) send_json_response(['success' => false, 'message' => 'ID de cliente no proporcionado.'], 400);
                    if (empty($data['estado'])) send_json_response(['success' => false, 'message' => 'Estado no proporcionado.'], 400);
                    
                    $id = intval($data['id']);
                    $estado = $data['estado'];
                    
                    // Obtener datos antiguos del cliente para la auditoría
                    $stmtOld = $conn->prepare("SELECT Cli_nombre, Cli_estado FROM cliente WHERE idCliente = ?");
                    $stmtOld->bind_param("i", $id);
                    $stmtOld->execute();
                    $oldData = $stmtOld->get_result()->fetch_assoc();
                    $stmtOld->close();
                    
                    $stmt = $conn->prepare("UPDATE cliente SET Cli_estado = ? WHERE idCliente = ?");
                    $stmt->bind_param("si", $estado, $id);
                    if (!$stmt->execute()) {
                        throw new Exception("Error al actualizar el estado del cliente.");
                    }

                    // Registrar en auditoría
                    $descripcion = sprintf(
                        "Cambio de estado del cliente %s (ID: %d) de %s a %s",
                        $oldData['Cli_nombre'],
                        $id,
                        $oldData['Cli_estado'],
                        $estado
                    );
                    
                    registrarAuditoria(
                        $conn,
                        $_SESSION['usuario_id'],
                        'UPDATE',
                        'cliente',
                        $descripcion
                    );

                    send_json_response(['success' => true, 'message' => 'Estado del cliente actualizado con éxito.']);
                    break;
                
                case 'delete_client':
                    if (empty($data['id'])) send_json_response(['success' => false, 'message' => 'ID de cliente no proporcionado.'], 400);
                    $id = intval($data['id']);
                    $stmt = $conn->prepare("DELETE FROM cliente WHERE idCliente = ?");
                    $stmt->bind_param("i", $id);
                    if (!$stmt->execute()) {
                        if ($conn->errno == 1451) throw new Exception("No se puede eliminar el cliente porque tiene cotizaciones asociadas.");
                        throw new Exception("Error al eliminar el cliente.");
                    }
                    if ($stmt->affected_rows > 0) {
                        send_json_response(['success' => true, 'message' => 'Cliente eliminado con éxito.']);
                    } else {
                        send_json_response(['success' => false, 'message' => 'No se encontró ningún cliente con ese ID para eliminar.'], 404);
                    }
                    break;

                default:
                    send_json_response(['success' => false, 'message' => 'Acción POST no válida.'], 400);
            }
            break;

        default:
            send_json_response(['error' => 'Método no permitido'], 405);
    }
} catch (Exception $e) {
    send_json_response(['success' => false, 'message' => $e->getMessage()], 500);
} finally {
    if ($conn) {
        $conn->close();
    }
}
?>
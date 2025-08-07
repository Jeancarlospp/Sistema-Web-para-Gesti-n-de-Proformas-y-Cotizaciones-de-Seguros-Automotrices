<?php
// --- MODO DE DEPURACIÓN (DESACTIVAR EN PRODUCCIÓN) ---
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
                    if (empty($data['Cli_nombre']) || empty($data['Cli_cedula'])) {
                        send_json_response(['success' => false, 'message' => 'El nombre y la cédula son requeridos.'], 400);
                    }
                    $stmt = $conn->prepare("INSERT INTO cliente (Cli_nombre, Cli_cedula, Cli_correo, Cli_telefono) VALUES (?, ?, ?, ?)");
                    $stmt->bind_param("ssss", $data['Cli_nombre'], $data['Cli_cedula'], $data['Cli_correo'], $data['Cli_telefono']);
                    if (!$stmt->execute()) {
                        if ($conn->errno == 1062) throw new Exception("La cédula ingresada ya está registrada.");
                        throw new Exception("Error al crear el cliente.");
                    }
                    send_json_response(['success' => true, 'message' => 'Cliente creado con éxito.']);
                    break;
                
                case 'update_client':
                    if (empty($data['idCliente'])) send_json_response(['success' => false, 'message' => 'ID de cliente no proporcionado.'], 400);
                    $stmt = $conn->prepare("UPDATE cliente SET Cli_nombre = ?, Cli_cedula = ?, Cli_correo = ?, Cli_telefono = ? WHERE idCliente = ?");
                    $stmt->bind_param("ssssi", $data['Cli_nombre'], $data['Cli_cedula'], $data['Cli_correo'], $data['Cli_telefono'], $data['idCliente']);
                    if (!$stmt->execute()) {
                         if ($conn->errno == 1062) throw new Exception("La cédula ingresada ya pertenece a otro cliente.");
                        throw new Exception("Error al actualizar el cliente.");
                    }
                    send_json_response(['success' => true, 'message' => 'Cliente actualizado con éxito.']);
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
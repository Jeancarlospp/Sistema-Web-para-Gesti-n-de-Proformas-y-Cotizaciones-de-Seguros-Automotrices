<?php
// --- MODO DE DEPURACIÓN (ACTIVADO) ---
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

    if ($method === 'GET') {
        // Lógica para obtener una sola empresa por ID (para el modal de edición)
        if (isset($_GET['id'])) {
            $idEmpresa = intval($_GET['id']);
            $stmt = $conn->prepare("SELECT * FROM empresas_proveedora WHERE idEmpresas_Proveedora = ?");
            $stmt->bind_param("i", $idEmpresa);
            $stmt->execute();
            $result = $stmt->get_result();
            $empresa = $result->fetch_assoc();
            $stmt->close();
            if ($empresa) send_json_response($empresa);
            else send_json_response(['error' => 'Empresa no encontrada.'], 404);
        }

        // --- LÓGICA PRINCIPAL PARA LA TABLA CON PAGINACIÓN, BÚSQUEDA Y ORDEN ---
        $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
        $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
        $search = $_GET['search'] ?? '';
        $sortBy = $_GET['sort_by'] ?? 'Emp_nombre ASC';

        // Lista blanca de columnas permitidas para ordenar
        $allowedSortColumns = ['Emp_nombre ASC', 'Emp_nombre DESC', 'Emp_fechaRegistro DESC', 'Emp_fechaRegistro ASC'];
        if (!in_array($sortBy, $allowedSortColumns)) {
            $sortBy = 'Emp_nombre ASC'; // Valor por defecto seguro
        }

        $offset = ($page - 1) * $limit;

        // --- Construcción de consultas dinámicas y seguras ---
        $conditions = [];
        $params = [];
        $types = '';

        if (!empty($search)) {
            $conditions[] = "(Emp_nombre LIKE ? OR Emp_ruc LIKE ?)";
            $searchTerm = '%' . $search . '%';
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $types .= 'ss';
        }

        $whereClause = !empty($conditions) ? " WHERE " . implode(" AND ", $conditions) : "";

        // --- Consulta 1: Obtener el TOTAL de registros que coinciden ---
        $sql_total = "SELECT COUNT(*) as total FROM empresas_proveedora" . $whereClause;
        $stmt_total = $conn->prepare($sql_total);
        if (!empty($params)) {
            $stmt_total->bind_param($types, ...$params);
        }
        $stmt_total->execute();
        $totalRecords = $stmt_total->get_result()->fetch_assoc()['total'];
        $stmt_total->close();

        // --- Consulta 2: Obtener los DATOS de la página actual ---
        $sql_data = "SELECT * FROM empresas_proveedora" . $whereClause . " ORDER BY " . $sortBy . " LIMIT ? OFFSET ?";
        $params[] = $limit;
        $params[] = $offset;
        $types .= 'ii';

        $stmt_data = $conn->prepare($sql_data);
        $stmt_data->bind_param($types, ...$params);
        $stmt_data->execute();
        $result_data = $stmt_data->get_result();
        $empresas = $result_data->fetch_all(MYSQLI_ASSOC);
        $stmt_data->close();
        
        send_json_response([
            'total' => $totalRecords,
            'data' => $empresas
        ]);

    } elseif ($method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);

            if (!isset($data['action'])) {
                send_json_response(['success' => false, 'message' => 'Acción no especificada.'], 400);
            }

            switch ($data['action']) {
                case 'update_status':
                    if (!isset($_SESSION['usuario_id'])) {
                        send_json_response(['success' => false, 'message' => 'Usuario no autenticado.'], 401);
                    }
                    if (empty($data['id'])) {
                        send_json_response(['success' => false, 'message' => 'ID de empresa no proporcionado.'], 400);
                    }
                    if (empty($data['estado'])) {
                        send_json_response(['success' => false, 'message' => 'Estado no proporcionado.'], 400);
                    }

                    $id = intval($data['id']);
                    $estado = $data['estado'];

                    // Obtener datos antiguos de la empresa para la auditoría
                    $stmtOld = $conn->prepare("SELECT Emp_nombre, Emp_estado FROM empresas_proveedora WHERE idEmpresas_Proveedora = ?");
                    $stmtOld->bind_param("i", $id);
                    $stmtOld->execute();
                    $oldData = $stmtOld->get_result()->fetch_assoc();
                    $stmtOld->close();

                    $stmt = $conn->prepare("UPDATE empresas_proveedora SET Emp_estado = ? WHERE idEmpresas_Proveedora = ?");
                    $stmt->bind_param("si", $estado, $id);
                    
                    if (!$stmt->execute()) {
                        throw new Exception("Error al actualizar el estado de la empresa.");
                    }

                    // Registrar en auditoría
                    $descripcion = sprintf(
                        "Cambio de estado de la empresa %s (ID: %d) de %s a %s",
                        $oldData['Emp_nombre'],
                        $id,
                        $oldData['Emp_estado'],
                        $estado
                    );
                    
                    registrarAuditoria(
                        $conn,
                        $_SESSION['usuario_id'],
                        'UPDATE',
                        'empresas_proveedora',
                        $descripcion
                    );

                    send_json_response(['success' => true, 'message' => 'Estado de la empresa actualizado con éxito.']);
                    break;
                // --- ACCIÓN: Crear una nueva empresa ---
                case 'create_company':
                    if (!isset($_SESSION['usuario_id'])) {
                        send_json_response(['success' => false, 'message' => 'Usuario no autenticado.'], 401);
                    }
                    if (empty($data['Emp_nombre']) || empty($data['Emp_ruc']) || empty($data['Emp_razonSocial'])) {
                        send_json_response(['success' => false, 'message' => 'El nombre, RUC y razón social son requeridos.'], 400);
                    }
                    $nombre = $data['Emp_nombre'];
                    $ruc = $data['Emp_ruc'];
                    $correo = $data['Emp_correo'];
                    $telefono = $data['Emp_telefono'];
                    $razonSocial = $data['Emp_razonSocial'];
                    $direccion = $data['Emp_direccion'];

                    $stmt = $conn->prepare("INSERT INTO empresas_proveedora (Emp_nombre, Emp_ruc, Emp_correo, Emp_telefono, Emp_razonSocial, Emp_direccion) VALUES (?, ?, ?, ?, ?, ?)");
                    $stmt->bind_param("ssssss", $nombre, $ruc, $correo, $telefono, $razonSocial, $direccion);

                    if (!$stmt->execute()) {
                        if ($conn->errno == 1062) { // Error de entrada duplicada
                            throw new Exception("El RUC o el correo ingresado ya está registrado.");
                        }
                        throw new Exception("Error al crear la empresa.");
                    }

                    // Obtener el ID de la empresa recién creada
                    $nuevoId = $conn->insert_id;

                    // Registrar en auditoría
                    $descripcion = sprintf(
                        "Creación de nueva empresa: %s (RUC: %s, Razón Social: %s)",
                        $nombre,
                        $ruc,
                        $razonSocial
                    );
                    
                    registrarAuditoria(
                        $conn,
                        $_SESSION['usuario_id'],
                        'INSERT',
                        'empresas_proveedora',
                        $descripcion
                    );

                    send_json_response(['success' => true, 'message' => 'Empresa creada con éxito.']);
                    break;
                
                // --- ACCIÓN: Actualizar una empresa existente ---
                case 'update_company':
                    if (!isset($_SESSION['usuario_id'])) {
                        send_json_response(['success' => false, 'message' => 'Usuario no autenticado.'], 401);
                    }
                    if (empty($data['idEmpresas_Proveedora'])) {
                         send_json_response(['success' => false, 'message' => 'ID de empresa no proporcionado.'], 400);
                    }

                    $id = intval($data['idEmpresas_Proveedora']);

                    // Obtener datos antiguos de la empresa para la auditoría
                    $stmtOld = $conn->prepare("SELECT Emp_nombre, Emp_ruc, Emp_razonSocial FROM empresas_proveedora WHERE idEmpresas_Proveedora = ?");
                    $stmtOld->bind_param("i", $id);
                    $stmtOld->execute();
                    $oldData = $stmtOld->get_result()->fetch_assoc();
                    $stmtOld->close();

                    $nombre = $data['Emp_nombre'];
                    $ruc = $data['Emp_ruc'];
                    $correo = $data['Emp_correo'];
                    $telefono = $data['Emp_telefono'];
                    $razonSocial = $data['Emp_razonSocial'];
                    $direccion = $data['Emp_direccion'];

                    $stmt = $conn->prepare("UPDATE empresas_proveedora SET Emp_nombre = ?, Emp_ruc = ?, Emp_correo = ?, Emp_telefono = ?, Emp_razonSocial = ?, Emp_direccion = ? WHERE idEmpresas_Proveedora = ?");
                    $stmt->bind_param("ssssssi", $nombre, $ruc, $correo, $telefono, $razonSocial, $direccion, $id);

                    if (!$stmt->execute()) {
                         if ($conn->errno == 1062) {
                            throw new Exception("El RUC o el correo ingresado ya pertenece a otra empresa.");
                        }
                        throw new Exception("Error al actualizar la empresa.");
                    }

                    // Registrar en auditoría
                    $descripcion = sprintf(
                        "Actualización de empresa ID %d. Cambios: Nombre: %s -> %s, RUC: %s -> %s, Razón Social: %s -> %s",
                        $id,
                        $oldData['Emp_nombre'],
                        $nombre,
                        $oldData['Emp_ruc'],
                        $ruc,
                        $oldData['Emp_razonSocial'],
                        $razonSocial
                    );
                    
                    registrarAuditoria(
                        $conn,
                        $_SESSION['usuario_id'],
                        'UPDATE',
                        'empresas_proveedora',
                        $descripcion
                    );

                    send_json_response(['success' => true, 'message' => 'Empresa actualizada con éxito.']);
                    break;
                
                // --- ACCIÓN: Actualizar solo el estado de la empresa ---
                case 'update_status':
                    if (empty($data['id']) || empty($data['estado'])) {
                        send_json_response(['success' => false, 'message' => 'ID y nuevo estado son requeridos.'], 400);
                    }
                    $id = intval($data['id']);
                    $estado = ($data['estado'] === 'activo') ? 'activo' : 'inactivo';

                    $stmt = $conn->prepare("UPDATE empresas_proveedora SET Emp_estado = ? WHERE idEmpresas_Proveedora = ?");
                    $stmt->bind_param("si", $estado, $id);
                    if (!$stmt->execute()) {
                        throw new Exception("Error al cambiar el estado de la empresa.");
                    }
                    send_json_response(['success' => true, 'message' => 'Estado de la empresa actualizado.']);
                    break;

                default:
                    send_json_response(['success' => false, 'message' => 'Acción POST no válida.'], 400);
            }

        // --- MANEJO DE MÉTODOS NO PERMITIDOS ---
         } else {
        send_json_response(['error' => 'Método no permitido.'], 405);
    }

} catch (Exception $e) {
    send_json_response(['success' => false, 'message' => 'Error interno del servidor.', 'error_details' => $e->getMessage()], 500);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
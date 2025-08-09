<?php
require_once 'conexion.php';
header('Content-Type: application/json');

function send_json_response($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

$db = new Conexion();
$conn = $db->getConn();

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

try {
    // === Obtener lista de roles ===
    if ($action === 'get_roles' && $method === 'GET') {
        $stmt = $conn->prepare("SELECT id, nombre FROM roles WHERE estado = 'activo' ORDER BY nombre ASC");
        $stmt->execute();
        $result = $stmt->get_result();
        $roles = $result->fetch_all(MYSQLI_ASSOC);
        $stmt->close();
        send_json_response($roles);
    }

    // === Crear nuevo rol ===
    elseif ($method === 'POST') {
        $input = json_decode(file_get_contents("php://input"), true);
        $nombre = trim($input['nombre'] ?? '');
        $permisos = $input['permisos'] ?? [];

        if (!$nombre) {
            send_json_response(['success' => false, 'message' => 'El nombre del rol es obligatorio'], 400);
        }

        // Insertar rol
        $stmt = $conn->prepare("INSERT INTO roles (nombre, estado) VALUES (?, 'activo')");
        $stmt->bind_param("s", $nombre);
        if (!$stmt->execute()) {
            send_json_response(['success' => false, 'message' => 'Error al insertar el rol: ' . $stmt->error], 500);
        }
        $rol_id = $stmt->insert_id;
        $stmt->close();

        // Insertar permisos asociados
        if (!empty($permisos)) {
            $stmt = $conn->prepare("INSERT INTO roles_permisos (rol_id, permiso_id) VALUES (?, ?)");
            foreach ($permisos as $permiso_id) {
                $stmt->bind_param("ii", $rol_id, $permiso_id);
                $stmt->execute();
            }
            $stmt->close();
        }

        send_json_response(['success' => true, 'message' => 'Rol creado correctamente']);
    }

    else {
        send_json_response(['error' => 'Método no permitido.'], 405);
    }

} catch (Exception $e) {
    send_json_response([
        'success' => false,
        'message' => 'Error interno del servidor.',
        'error_details' => $e->getMessage()
    ], 500);
} finally {
    if ($conn) {
        $conn->close();
    }
}
?>

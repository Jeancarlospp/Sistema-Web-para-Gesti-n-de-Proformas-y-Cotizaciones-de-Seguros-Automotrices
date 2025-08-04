<?php
require_once 'conexion.php';
header('Content-Type: application/json');

$method = $_SERVER['REQUEST_METHOD'];

switch ($method) {
    case 'GET':
        // Listar usuarios activos o todos si ?all=1
        $all = isset($_GET['all']) && $_GET['all'] == '1';
        $db = new Conexion();
        $conn = $db->getConn();
        $sql = "SELECT u.id, u.nombre, u.cedula, u.correo, r.nombre as rol, u.estado, u.ultimo_login FROM usuarios u JOIN roles r ON u.rol_id = r.id";
        if (!$all) $sql .= " WHERE u.estado = 'activo'";
        $sql .= " ORDER BY CASE WHEN u.ultimo_login IS NULL THEN 1 ELSE 0 END, u.ultimo_login DESC, u.id DESC";        
        $result = $conn->query($sql);
        $usuarios = [];
        while ($row = $result->fetch_assoc()) {
            $usuarios[] = $row;
        }
        echo json_encode($usuarios);
        $db->close();
        break;
    case 'POST':
        // Editar usuario o cambiar estado
        $data = json_decode(file_get_contents('php://input'), true);
        if (isset($data['action']) && $data['action'] === 'update_estado') {
            $id = intval($data['id']);
            $estado = $data['estado'] === 'activo' ? 'activo' : 'inactivo';
            $db = new Conexion();
            $conn = $db->getConn();
            $stmt = $conn->prepare("UPDATE usuarios SET estado=? WHERE id=?");
            $stmt->bind_param("si", $estado, $id);
            $ok = $stmt->execute();
            $stmt->close();
            $db->close();
            echo json_encode(['success' => $ok]);
        } elseif (isset($data['action']) && $data['action'] === 'editar_usuario') {
            $id = intval($data['id']);
            $nombre = $data['nombre'];
            $cedula = $data['cedula'];
            $correo = $data['correo'];
            $rol_id = intval($data['rol_id']);
            $db = new Conexion();
            $conn = $db->getConn();
            $stmt = $conn->prepare("UPDATE usuarios SET nombre=?, cedula=?, correo=?, rol_id=? WHERE id=?");
            $stmt->bind_param("sssii", $nombre, $cedula, $correo, $rol_id, $id);
            $ok = $stmt->execute();
            $stmt->close();
            $db->close();
            echo json_encode(['success' => $ok]);
        } else {
            echo json_encode(['error' => 'Acción no válida']);
        }
        break;
    default:
        http_response_code(405);
        echo json_encode(['error' => 'Método no permitido']);
}

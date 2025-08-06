<?php
// Iniciar la sesión para poder acceder a `$_SESSION`
session_start();

// Requerir el archivo de conexión.
require_once 'conexion.php';

// Establecer la cabecera para indicar que la respuesta será en formato JSON.
header('Content-Type: application/json');

// --- FUNCIÓN PARA ENVIAR RESPUESTAS JSON Y TERMINAR EL SCRIPT ---
function send_json_response($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data);
    exit();
}

// Inicializar la conexión.
$db = new Conexion();
$conn = $db->getConn();

// Capturar el método de la solicitud (GET, POST, etc.).
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        // --- MANEJO DE SOLICITUDES GET (LEER USUARIOS) ---
        case 'GET':
            // Lógica para obtener el perfil del usuario actual (para miPerfil.js)
            if (isset($_GET['me']) && $_GET['me'] == '1') {
                if (!isset($_SESSION['usuario_id'])) {
                    send_json_response(['error' => 'No autorizado. Sesión no encontrada.'], 401);
                }
                $id_usuario_sesion = $_SESSION['usuario_id'];
                
                $stmt = $conn->prepare(
                    "SELECT u.id_usuario, u.nombre, u.cedula, u.correo, r.nombre as rol 
                     FROM usuarios u 
                     JOIN roles r ON u.rol_id = r.id 
                     WHERE u.id_usuario = ?"
                );
                $stmt->bind_param("i", $id_usuario_sesion);
                $stmt->execute();
                $result = $stmt->get_result();
                $usuario = $result->fetch_assoc();
                $stmt->close();

                if ($usuario) {
                    send_json_response($usuario);
                } else {
                    send_json_response(['error' => 'Usuario no encontrado en la base de datos.'], 404);
                }
            } 
            // Lógica existente para listar todos los usuarios (para adminDashboard.js y gestionUsuarios.js)
            else {
                $listarTodos = isset($_GET['all']) && $_GET['all'] == '1';
                
                $sql = "SELECT u.id_usuario, u.nombre, u.cedula, u.correo, r.nombre as rol, u.estado, u.ultimo_login 
                        FROM usuarios u 
                        JOIN roles r ON u.rol_id = r.id";

                if (!$listarTodos) {
                    $sql .= " WHERE u.estado = 'activo'";
                }
                
                $sql .= " ORDER BY CASE WHEN u.ultimo_login IS NULL THEN 1 ELSE 0 END, u.ultimo_login DESC, u.nombre ASC";

                $stmt = $conn->prepare($sql);
                $stmt->execute();
                $result = $stmt->get_result();
                
                $usuarios = $result->fetch_all(MYSQLI_ASSOC);
                $stmt->close();
                send_json_response($usuarios);
            }
            break;

        // --- MANEJO DE SOLICITUDES POST (CREAR/ACTUALIZAR USUARIOS) ---
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);

            if (!isset($data['action'])) {
                send_json_response(['success' => false, 'message' => 'Acción no especificada.'], 400);
            }

            switch ($data['action']) {
                // --- ACCIÓN: Actualizar el estado (desde gestion_usuarios.html) ---
                case 'update_estado':
                    $id = intval($data['id']);
                    $estado = ($data['estado'] === 'activo') ? 'activo' : 'inactivo';
                    
                    $stmt = $conn->prepare("UPDATE usuarios SET estado = ? WHERE id_usuario = ?");
                    $stmt->bind_param("si", $estado, $id);

                    if (!$stmt->execute()) throw new Exception("Error al actualizar el estado del usuario.");
                    send_json_response(['success' => true, 'message' => 'Estado del usuario actualizado.']);
                    break;
                
                // --- ACCIÓN: Actualizar perfil (desde miPerfil.html) ---
                case 'update_profile':
                    if (!isset($_SESSION['usuario_id'])) send_json_response(['success' => false, 'message' => 'Acceso denegado. Sesión no válida.'], 403);
                    
                    $id_usuario_sesion = $_SESSION['usuario_id'];
                    
                    $nombre = $data['nombre'];
                    $cedula = $data['cedula'];
                    $correo = $data['correo'];

                    $stmt = $conn->prepare("UPDATE usuarios SET nombre = ?, cedula = ?, correo = ? WHERE id_usuario = ?");
                    $stmt->bind_param("sssi", $nombre, $cedula, $correo, $id_usuario_sesion);

                    if (!$stmt->execute()) throw new Exception("Error al actualizar el perfil.");
                    
                    // Actualizar el nombre en la sesión de PHP para consistencia.
                    $_SESSION['nombre'] = $nombre;
                    send_json_response(['success' => true, 'message' => 'Perfil actualizado con éxito.']);
                    break;

                // --- ACCIÓN: Cambiar contraseña (desde miPerfil.html) ---
                case 'change_password':
                    if (!isset($_SESSION['usuario_id'])) send_json_response(['success' => false, 'message' => 'Acceso denegado. Sesión no válida.'], 403);

                    $id_usuario_sesion = $_SESSION['usuario_id'];
                    $currentPassword = $data['currentPassword'];
                    $newPassword = $data['newPassword'];

                    // 1. Obtener la contraseña actual hasheada de la BD.
                    $stmt = $conn->prepare("SELECT contrasena FROM usuarios WHERE id_usuario = ?");
                    $stmt->bind_param("i", $id_usuario_sesion);
                    $stmt->execute();
                    $stmt->bind_result($hash_actual);
                    $stmt->fetch();
                    $stmt->close();

                    // 2. Verificar si la contraseña actual es correcta.
                    if (!$hash_actual || !password_verify($currentPassword, $hash_actual)) {
                        send_json_response(['success' => false, 'message' => 'La contraseña actual es incorrecta.'], 400);
                    }

                    // 3. Hashear la nueva contraseña y actualizarla en la BD.
                    $new_hash = password_hash($newPassword, PASSWORD_DEFAULT);
                    $stmt = $conn->prepare("UPDATE usuarios SET contrasena = ? WHERE id_usuario = ?");
                    $stmt->bind_param("si", $new_hash, $id_usuario_sesion);

                    if (!$stmt->execute()) throw new Exception("Error al actualizar la contraseña.");
                    send_json_response(['success' => true, 'message' => 'Contraseña actualizada con éxito.']);
                    break;
                    
                default:
                    send_json_response(['success' => false, 'message' => 'Acción POST no válida.'], 400);
            }
            break;

        // --- MANEJO DE MÉTODOS NO PERMITIDOS ---
        default:
            send_json_response(['error' => 'Método no permitido'], 405);
    }
} catch (Exception $e) {
    // Captura centralizada de errores para una respuesta JSON limpia.
    send_json_response(['success' => false, 'message' => 'Error interno del servidor.', 'error_details' => $e->getMessage()], 500);
} finally {
    // Asegurarse de que la conexión a la base de datos siempre se cierre.
    if ($conn) {
        $conn->close();
    }
}
?>
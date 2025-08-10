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
            // Lógica para un solo usuario por ID
            if (isset($_GET['id'])) {
                $id_usuario = intval($_GET['id']);
                $stmt = $conn->prepare("SELECT id_usuario, nombre, cedula, correo, rol_id FROM usuarios WHERE id_usuario = ?");
                $stmt->bind_param("i", $id_usuario);
                $stmt->execute();
                $usuario = $stmt->get_result()->fetch_assoc();
                $stmt->close();
                if ($usuario) send_json_response($usuario);
                else send_json_response(['error' => 'Usuario no encontrado.'], 404);
            }
            // Lógica para el perfil del usuario actual
            elseif (isset($_GET['me']) && $_GET['me'] == '1') {
                if (!isset($_SESSION['usuario_id'])) send_json_response(['error' => 'No autorizado.'], 401);
                $id_usuario_sesion = $_SESSION['usuario_id'];
                $stmt = $conn->prepare("SELECT u.id_usuario, u.nombre, u.cedula, u.correo, r.nombre as rol FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.id_usuario = ?");
                $stmt->bind_param("i", $id_usuario_sesion);
                $stmt->execute();
                $usuario = $stmt->get_result()->fetch_assoc();
                $stmt->close();
                if ($usuario) send_json_response($usuario);
                else send_json_response(['error' => 'Usuario de sesión no encontrado.'], 404);
            } 
            // --- LÓGICA MEJORADA PARA LA TABLA CON PAGINACIÓN, BÚSQUEDA Y ORDENAMIENTO ---
            else {
                $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
                $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
                $search = $_GET['search'] ?? '';
                $sortBy = $_GET['sort_by'] ?? 'nombre ASC';

                // Lista blanca de columnas permitidas para ordenar
                $allowedSortColumns = ['nombre ASC', 'nombre DESC', 'ultimo_login DESC', 'id_usuario DESC', 'id_usuario ASC'];
                if (!in_array($sortBy, $allowedSortColumns)) {
                    $sortBy = 'nombre ASC';
                }

                $offset = ($page - 1) * $limit;

                // --- Construcción de consultas dinámicas ---
                $baseSql = "FROM usuarios u JOIN roles r ON u.rol_id = r.id";
                $conditions = [];
                $params = [];
                $types = '';

                if (!empty($search)) {
                    $conditions[] = "(u.nombre LIKE ? OR u.correo LIKE ?)";
                    $searchTerm = '%' . $search . '%';
                    $params[] = $searchTerm;
                    $params[] = $searchTerm;
                    $types .= 'ss';
                }

                $whereClause = !empty($conditions) ? " WHERE " . implode(" AND ", $conditions) : "";

                // --- Consulta 1: Obtener el TOTAL de registros ---
                $sql_total = "SELECT COUNT(*) as total " . $baseSql . $whereClause;
                $stmt_total = $conn->prepare($sql_total);
                if (!empty($params)) {
                    $stmt_total->bind_param($types, ...$params);
                }
                $stmt_total->execute();
                $totalRecords = $stmt_total->get_result()->fetch_assoc()['total'];
                $stmt_total->close();

                // --- Consulta 2: Obtener los DATOS de la página ---
                $sql_data = "SELECT u.id_usuario, u.nombre, u.cedula, u.correo, r.nombre as rol, u.estado, u.ultimo_login " . $baseSql . $whereClause . " ORDER BY " . $sortBy . " LIMIT ? OFFSET ?";
                $params[] = $limit;
                $params[] = $offset;
                $types .= 'ii';

                $stmt_data = $conn->prepare($sql_data);
                $stmt_data->bind_param($types, ...$params);
                $stmt_data->execute();
                $usuarios = $stmt_data->get_result()->fetch_all(MYSQLI_ASSOC);
                $stmt_data->close();
                
                send_json_response([
                    'total' => $totalRecords,
                    'data' => $usuarios
                ]);
            }
            break;

        // --- MANEJO DE SOLICITUDES POST (CREAR/ACTUALIZAR USUARIOS) ---
        case 'POST':
            $data = json_decode(file_get_contents('php://input'), true);
            if (!isset($data['action'])) {
                send_json_response(['success' => false, 'message' => 'Acción no especificada.'], 400);
            }

            switch ($data['action']) {
                // --- ACCIÓN: Crear un nuevo usuario (desde gestion_usuarios.html) ---
                case 'create_user':
                    if (!isset($_SESSION['usuario_id'])) {
                        send_json_response(['success' => false, 'message' => 'Usuario no autenticado.'], 401);
                    }
                    if (empty($data['nombre']) || empty($data['correo']) || empty($data['contrasena']) || empty($data['rol_id'])) {
                        send_json_response(['success' => false, 'message' => 'Nombre, correo, contraseña y rol son requeridos.'], 400);
                    }
                    $nombre = $data['nombre'];
                    $cedula = $data['cedula'];
                    $correo = $data['correo'];
                    $contrasena_hash = password_hash($data['contrasena'], PASSWORD_DEFAULT);
                    $rol_id = intval($data['rol_id']);

                    // Obtener el nombre del rol para el registro de auditoría
                    $stmt_rol = $conn->prepare("SELECT nombre FROM roles WHERE id = ?");
                    $stmt_rol->bind_param("i", $rol_id);
                    $stmt_rol->execute();
                    $rol_result = $stmt_rol->get_result();
                    $rol_nombre = $rol_result->fetch_assoc()['nombre'] ?? 'Rol desconocido';
                    $stmt_rol->close();

                    $stmt = $conn->prepare("INSERT INTO usuarios (nombre, cedula, correo, contrasena, rol_id, estado, fecha_creacion) VALUES (?, ?, ?, ?, ?, 'activo', CURRENT_TIMESTAMP)");
                    if ($stmt === false) {
                        throw new Exception("Error en la preparación de la consulta INSERT: " . $conn->error);
                    }
                    $stmt->bind_param("ssssi", $nombre, $cedula, $correo, $contrasena_hash, $rol_id);

                    if (!$stmt->execute()) {
                        if ($conn->errno == 1062) {
                            throw new Exception("El correo o la cédula ingresados ya están registrados.");
                        }
                        throw new Exception("Error al ejecutar la consulta para crear el usuario: " . $stmt->error);
                    }

                    $nuevoId = $conn->insert_id;

                    // Registrar en auditoría con información más detallada
                    $descripcion = sprintf(
                        "Creación de nuevo usuario:\nNombre: %s\nCédula: %s\nCorreo: %s\nRol: %s (ID: %d)\nCreado por: %s",
                        $nombre,
                        $cedula ?: 'No especificada',
                        $correo,
                        $rol_nombre,
                        $rol_id,
                        $_SESSION['nombre'] ?? 'Usuario del sistema'
                    );
                    
                    registrarAuditoria(
                        $conn,
                        $_SESSION['usuario_id'],
                        'INSERT',
                        'usuarios',
                        $descripcion
                    );

                    send_json_response(['success' => true, 'message' => 'Usuario creado con éxito.']);
                    break;
                
                // --- ACCIÓN: Actualizar un usuario existente (desde gestion_usuarios.html) ---
                case 'update_user':
                    if (empty($data['id']) || empty($data['nombre']) || empty($data['correo']) || empty($data['rol_id'])) {
                        send_json_response(['success' => false, 'message' => 'ID, Nombre, correo y rol son requeridos para actualizar.'], 400);
                    }
                    $id = intval($data['id']);
                    $nombre = $data['nombre'];
                    $cedula = $data['cedula'];
                    $correo = $data['correo'];
                    $rol_id = intval($data['rol_id']);
                    $contrasena = $data['contrasena'];

                    if (!empty($contrasena)) {
                        $hash_contrasena = password_hash($contrasena, PASSWORD_DEFAULT);
                        $stmt = $conn->prepare("UPDATE usuarios SET nombre = ?, cedula = ?, correo = ?, rol_id = ?, contrasena = ? WHERE id_usuario = ?");
                        if ($stmt === false) throw new Exception("Error al preparar la consulta de actualización con contraseña: " . $conn->error);
                        $stmt->bind_param("sssisi", $nombre, $cedula, $correo, $rol_id, $hash_contrasena, $id);
                    } else {
                        $stmt = $conn->prepare("UPDATE usuarios SET nombre = ?, cedula = ?, correo = ?, rol_id = ? WHERE id_usuario = ?");
                        if ($stmt === false) throw new Exception("Error al preparar la consulta de actualización sin contraseña: " . $conn->error);
                        $stmt->bind_param("sssii", $nombre, $cedula, $correo, $rol_id, $id);
                    }

                    if (!$stmt->execute()) {
                         if ($conn->errno == 1062) throw new Exception("El correo o la cédula ingresados ya pertenecen a otro usuario.");
                        throw new Exception("Error al ejecutar la actualización del usuario: " . $stmt->error);
                    }
                    send_json_response(['success' => true, 'message' => 'Usuario actualizado con éxito.']);
                    break;
                
                // --- ACCIÓN: Actualizar el estado de un usuario (desde gestion_usuarios.html) ---
                case 'update_estado':
                    if (empty($data['id']) || empty($data['estado'])) {
                        send_json_response(['success' => false, 'message' => 'ID y nuevo estado son requeridos.'], 400);
                    }
                    $id = intval($data['id']);
                    $estado = ($data['estado'] === 'activo') ? 'activo' : 'inactivo';
                    
                    $stmt = $conn->prepare("UPDATE usuarios SET estado = ? WHERE id_usuario = ?");
                    $stmt->bind_param("si", $estado, $id);
                    
                    if (!$stmt->execute()) throw new Exception("Error al actualizar el estado del usuario.");
                    send_json_response(['success' => true, 'message' => 'Estado del usuario actualizado.']);
                    break;
                
                // --- ACCIÓN: Actualizar el propio perfil (desde miPerfil.html) ---
                case 'update_profile':
                    if (!isset($_SESSION['usuario_id'])) send_json_response(['success' => false, 'message' => 'Acceso denegado. Sesión no válida.'], 403);
                    
                    $id_usuario_sesion = $_SESSION['usuario_id'];
                    $nombre = $data['nombre'];
                    $cedula = $data['cedula'];
                    $correo = $data['correo'];
                    
                    $stmt = $conn->prepare("UPDATE usuarios SET nombre = ?, cedula = ?, correo = ? WHERE id_usuario = ?");
                    $stmt->bind_param("sssi", $nombre, $cedula, $correo, $id_usuario_sesion);

                    if (!$stmt->execute()) {
                        if ($conn->errno == 1062) throw new Exception("El correo o la cédula ya están en uso por otro usuario.");
                        throw new Exception("Error al actualizar el perfil.");
                    }
                    $_SESSION['nombre'] = $nombre; // Actualizar el nombre en la sesión de PHP
                    send_json_response(['success' => true, 'message' => 'Perfil actualizado con éxito.']);
                    break;

                // --- ACCIÓN: Cambiar la propia contraseña (desde miPerfil.html) ---
                case 'change_password':
                    if (!isset($_SESSION['usuario_id'])) send_json_response(['success' => false, 'message' => 'Acceso denegado. Sesión no válida.'], 403);
                    
                    $id_usuario_sesion = $_SESSION['usuario_id'];
                    $currentPassword = $data['currentPassword'];
                    $newPassword = $data['newPassword'];

                    $stmt = $conn->prepare("SELECT contrasena FROM usuarios WHERE id_usuario = ?");
                    $stmt->bind_param("i", $id_usuario_sesion);
                    $stmt->execute();
                    $stmt->bind_result($hash_actual);
                    $stmt->fetch();
                    $stmt->close();
                    
                    if (!$hash_actual || !password_verify($currentPassword, $hash_actual)) {
                        send_json_response(['success' => false, 'message' => 'La contraseña actual es incorrecta.'], 400);
                    }
                    
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
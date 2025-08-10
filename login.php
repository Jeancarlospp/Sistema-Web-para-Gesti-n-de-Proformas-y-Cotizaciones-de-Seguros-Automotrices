<?php
/**
 * =================================================================================
 * login.php - Corregido para coincidir con la estructura de la base de datos
 * =================================================================================
 */

// Ya no necesitamos las líneas de depuración, puedes eliminarlas.
// ini_set('display_errors', 1);
// ini_set('display_startup_errors', 1);
// error_reporting(E_ALL);

ob_start();
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}
header('Content-Type: application/json');
require_once __DIR__ . '/php/Conexion.php';

/**
 * Función de auditoría CORREGIDA para coincidir con los nombres de tus columnas.
 */
function registrarAuditoria($conn, $accion, $descripcion, $usuarioId = null) {
    $tablaAfectada = 'usuarios';
    $ip = $_SERVER['REMOTE_ADDR'];
    // ===== CORRECCIÓN AQUÍ: Se usa `idUsuario` en lugar de `Aud_idUsuario` =====
    $sql = "INSERT INTO auditoria (idUsuario, Aud_accion, Aud_tabla, Aud_descripcion, Aud_IP) VALUES (?, ?, ?, ?, ?)";
    
    if ($stmt = $conn->prepare($sql)) {
        $stmt->bind_param("issss", $usuarioId, $accion, $tablaAfectada, $descripcion, $ip);
        $stmt->execute();
        $stmt->close();
    }
}


// --- LÓGICA PRINCIPAL ---
$response = ['success' => false, 'message' => 'Error no identificado.'];
$httpStatusCode = 400;

try {
    // --- 1. VALIDACIÓN DE LA SOLICITUD (sin cambios) ---
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        $httpStatusCode = 405;
        throw new Exception('Método no permitido.');
    }
    $data = json_decode(file_get_contents('php://input'), true);
    if (json_last_error() !== JSON_ERROR_NONE || !isset($data['correo']) || !isset($data['contrasena'])) {
        throw new Exception('Solicitud malformada o datos incompletos.');
    }
    $correo = trim($data['correo']);
    $contrasena = $data['contrasena'];
    if (empty($correo) || empty($contrasena)) {
        throw new Exception('El correo y la contraseña son obligatorios.');
    }
    if (!filter_var($correo, FILTER_VALIDATE_EMAIL)) {
        throw new Exception('El formato del correo electrónico no es válido.');
    }
    
    // --- 2. PROCESAMIENTO DE LA BASE DE DATOS ---
    $conexion = new Conexion();
    $conn = $conexion->getConn();

    // ===== CORRECCIÓN CRÍTICA EN LA CONSULTA SQL =====
    // 1. Hacemos un LEFT JOIN a la tabla 'roles' (asumiendo que se llama así) para obtener el nombre del rol.
    // 2. Seleccionamos u.rol_id y r.nombre (y le damos un alias 'rol_nombre').
    // 3. Ya no seleccionamos una columna 'rol' que no existe.
    $sql = "SELECT u.id_usuario, u.nombre, u.contrasena, u.estado, r.nombre as rol_nombre
            FROM usuarios u
            LEFT JOIN roles r ON u.rol_id = r.id
            WHERE u.correo = ? 
            LIMIT 1";
    // ===============================================
    
    $stmt = $conn->prepare($sql);
    if ($stmt === false) {
        throw new Exception("Error interno del servidor al preparar la consulta. Verifique los nombres de las tablas y columnas.");
    }
    
    $stmt->bind_param("s", $correo);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $usuario = $result->fetch_assoc();

        if (password_verify($contrasena, $usuario['contrasena'])) {
            if ($usuario['estado'] === 'activo') {
                // ¡ÉXITO!
                session_regenerate_id(true);

                $_SESSION['usuario_id'] = $usuario['id_usuario'];
                $_SESSION['nombre'] = $usuario['nombre'];
                // ===== CORRECCIÓN AQUÍ: Guardamos el nombre del rol obtenido del JOIN =====
                $_SESSION['rol'] = $usuario['rol_nombre'];
                $_SESSION['last_activity'] = time();

                registrarAuditoria($conn, 'LOGIN_EXITOSO', "Usuario '{$usuario['nombre']}' ha iniciado sesión.", $usuario['id_usuario']);
                
                // Mapeo de roles para el frontend
                $rolMapping = ['admin' => 'Administrador', 'asesor' => 'Asesor', 'vendedor' => 'Vendedor'];
                // ===== CORRECCIÓN AQUÍ: Usamos la variable de sesión que ya tiene el nombre correcto =====
                $rolFrontend = $rolMapping[strtolower($_SESSION['rol'])] ?? 'Usuario';
                
                $httpStatusCode = 200;
                $response = [
                    'success' => true,
                    'message' => 'Inicio de sesión exitoso.',
                    'user' => ['userName' => $usuario['nombre'], 'userRole' => $rolFrontend]
                ];

            } else {
                registrarAuditoria($conn, 'LOGIN_FALLIDO', "Intento a cuenta inactiva: " . $correo, $usuario['id_usuario']);
                $httpStatusCode = 403;
                $response['message'] = 'Esta cuenta ha sido desactivada.';
            }
        } else {
            registrarAuditoria($conn, 'LOGIN_FALLIDO', "Contraseña incorrecta para: " . $correo, $usuario['id_usuario']);
            $httpStatusCode = 401;
            $response['message'] = 'Credenciales inválidas.';
        }
    } else {
        registrarAuditoria($conn, 'LOGIN_FALLIDO', "Intento para correo no registrado: " . $correo);
        $httpStatusCode = 401;
        $response['message'] = 'Credenciales inválidas.';
    }

} catch (Exception $e) {
    $httpStatusCode = 500;
    error_log("Error en login.php: " . $e->getMessage());
    $response['message'] = $e->getMessage();
} finally {
    if (isset($stmt) && $stmt instanceof mysqli_stmt) { $stmt->close(); }
    if (isset($conexion)) { $conexion->close(); }
    
    http_response_code($httpStatusCode);
    echo json_encode($response);
    ob_end_flush();
}
?>
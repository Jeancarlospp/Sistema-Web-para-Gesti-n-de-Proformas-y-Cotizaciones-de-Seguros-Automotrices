<?php
require_once 'conexion.php';
require_once 'utils.php';
require_once 'auditoria_helper.php';

function actualizarUltimoLogin($conn, $usuario_id) {
    $stmt = $conn->prepare("UPDATE usuarios SET ultimo_login = CURRENT_TIMESTAMP WHERE id_usuario = ?");
    $stmt->bind_param("i", $usuario_id);
    return $stmt->execute();
}

function validarLogin($conn, $correo, $contrasena) {
    $stmt = $conn->prepare("SELECT id_usuario, nombre, contrasena, rol_id FROM usuarios WHERE correo = ? AND estado = 'activo'");
    $stmt->bind_param("s", $correo);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        return ['success' => false, 'message' => 'Usuario no encontrado o inactivo'];
    }
    
    $usuario = $result->fetch_assoc();
    if (!password_verify($contrasena, $usuario['contrasena'])) {
        return ['success' => false, 'message' => 'Contraseña incorrecta'];
    }
    
    // Actualizar último login
    actualizarUltimoLogin($conn, $usuario['id_usuario']);
    
    // Registrar en auditoría
    registrarAuditoria(
        $conn,
        $usuario['id_usuario'],
        'LOGIN',
        'usuarios',
        "Inicio de sesión exitoso del usuario: " . $usuario['nombre']
    );
    
    return [
        'success' => true,
        'usuario_id' => $usuario['id_usuario'],
        'nombre' => $usuario['nombre'],
        'rol_id' => $usuario['rol_id']
    ];
}
?>

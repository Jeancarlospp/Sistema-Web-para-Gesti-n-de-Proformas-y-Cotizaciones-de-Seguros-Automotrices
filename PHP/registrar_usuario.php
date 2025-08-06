<?php
require_once 'conexion.php';

function definir_usuario($correo, $contrasena, $nombre, $cedula, $rol_id, $estado = 'activo', $ultimo_login = null) {
    $hash = password_hash($contrasena, PASSWORD_DEFAULT);
    $db = new Conexion();
    $conn = $db->getConn();
    $stmt = $conn->prepare("INSERT INTO usuarios (correo, contrasena, nombre, cedula, rol_id, estado, ultimo_login) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("ssssiss", $correo, $hash, $nombre, $cedula, $rol_id, $estado, $ultimo_login);
    if ($stmt->execute()) {
        echo "Usuario registrado correctamente: $correo<br>";
    } else {
        echo "Error: " . $stmt->error . "<br>";
    }
    $stmt->close();
    $db->close();
}
?>

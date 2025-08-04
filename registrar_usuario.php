<?php
require_once 'conexion.php';

// Cambia estos valores para cada usuario que quieras registrar
definir_usuario(
    'zaith@ejemplo.com', // Correo
    '123456',         // Contraseña en texto plano
    'Zaith',             // Nombre
    '1524578945',        // Cédula
    2,                   // ID de rol (1=admin, 2=asesor, 3=vendedor, 4=cliente)
    'activo',            // Estado ('activo' o 'inactivo')
    date('Y-m-d H:i:s')  // Último login (puedes poner NULL si es nuevo)
);

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

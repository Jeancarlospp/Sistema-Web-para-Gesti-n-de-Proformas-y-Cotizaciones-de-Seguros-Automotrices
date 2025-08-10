<?php
// test_conexion.php

// Habilitar la visualización de todos los errores para esta prueba
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

echo "<h1>Prueba de Conexión a la Base de Datos</h1>";

// Incluimos la clase de la misma forma que en login.php
require_once __DIR__ . '/php/Conexion.php';

echo "<p>Intentando crear una nueva instancia de 'Conexion'...</p>";

try {
    // Creamos el objeto
    $conexion = new Conexion();
    $conn = $conexion->getConn();

    // Verificamos si hay un error de conexión
    if ($conn->connect_error) {
        // Si hay un error, lo mostramos y detenemos todo.
        die("<p style='color: red; font-weight: bold;'>¡ERROR DE CONEXIÓN! El script no pudo conectarse a MySQL.</p>" . 
            "<p><strong>Mensaje de error:</strong> " . $conn->connect_error . "</p>" .
            "<p><strong>Solución:</strong> Revisa las credenciales (host, usuario, contraseña, nombre de la base de datos) en tu archivo <strong>php/Conexion.php</strong>.</p>");
    }

    // Si llegamos aquí, la conexión fue exitosa.
    echo "<p style='color: green; font-weight: bold;'>¡ÉXITO! La conexión a la base de datos 'sistema_cotizaciones' se ha establecido correctamente.</p>";
    echo "<p>Ahora, el siguiente paso es verificar que los nombres de las tablas y columnas en tu archivo <strong>login.php</strong> coincidan con tu base de datos.</p>";

    // Cerramos la conexión
    $conexion->close();

} catch (Exception $e) {
    echo "<p style='color: red; font-weight: bold;'>¡ERROR FATAL! Ocurrió una excepción al intentar conectar.</p>";
    echo "<p><strong>Mensaje:</strong> " . $e->getMessage() . "</p>";
}
?>
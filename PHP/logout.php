<?php
/**
 * logout.php
 * Destruye la sesión del servidor de forma segura.
 */

// Iniciar sesión para poder acceder a ella y destruirla.
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Eliminar todas las variables de sesión.
$_SESSION = [];

// Si se desea destruir la sesión completamente, borre también la cookie de sesión.
// Nota: ¡Esto destruirá la sesión, y no la información de la sesión!
if (ini_get("session.use_cookies")) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params["path"], $params["domain"],
        $params["secure"], $params["httponly"]
    );
}

// Finalmente, destruir la sesión.
session_destroy();

// Responder con éxito para que el cliente sepa que se procesó.
header('Content-Type: application/json');
echo json_encode(['success' => true, 'message' => 'Sesión cerrada en el servidor.']);
?>
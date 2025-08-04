<?php
session_start();
require_once 'conexion.php';

$error = '';
$correo = '';
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $correo = $_POST['correo'] ?? '';
    $contrasena = $_POST['contrasena'] ?? '';

    $db = new Conexion();
    $conn = $db->getConn();

    $stmt = $conn->prepare("SELECT u.id, u.nombre, u.contrasena, r.nombre as rol FROM usuarios u JOIN roles r ON u.rol_id = r.id WHERE u.correo = ?");
    $stmt->bind_param("s", $correo);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows > 0) {
        $stmt->bind_result($id, $nombre, $hash, $rol);
        $stmt->fetch();
        if (password_verify($contrasena, $hash)) {
            // Actualizar ultimo_login
            $update = $conn->prepare("UPDATE usuarios SET ultimo_login = NOW() WHERE id = ?");
            $update->bind_param("i", $id);
            $update->execute();
            $update->close();
            $_SESSION['usuario_id'] = $id;
            $_SESSION['rol'] = $rol;
            $_SESSION['nombre'] = $nombre;
            
            // Mapeo de roles para JavaScript
            $rolMapping = [
                'admin' => 'Administrador',
                'asesor' => 'Asesor', 
                'vendedor' => 'Vendedor',
                'cliente' => 'Cliente'
            ];
            
            $rolJS = $rolMapping[$rol] ?? 'Usuario';
            
            // Script para sincronizar con localStorage y redirigir
            echo "
            <!DOCTYPE html>
            <html>
            <head>
                <title>Redirigiendo...</title>
            </head>
            <body>
                <script>
                    // Guardamos la info en localStorage para compatibilidad con main.js
                    localStorage.setItem('userRole', '{$rolJS}');
                    localStorage.setItem('userName', '{$nombre}');
                    
                    // Redirigimos según el rol
                    switch('{$rol}') {
                        case 'admin':
                            window.location.href = 'HTML/admin_dashboard.html';
                            break;
                        case 'asesor':
                            window.location.href = 'HTML/asesor_dashboard.html';
                            break;
                        case 'vendedor':
                            window.location.href = 'HTML/vendedor_dashboard.html';
                            break;
                        case 'cliente':
                            window.location.href = 'HTML/gestion_clientes.html';
                            break;
                        default:
                            window.location.href = 'index.html';
                    }
                </script>
            </body>
            </html>";
            exit();
        } else {
            $error = "Contraseña incorrecta.";
        }
    } else {
        $error = "Usuario no encontrado.";
    }
    $stmt->close();
    $db->close();
}
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Iniciar Sesión - CS ENSIGNA</title>
    <link rel="shortcut icon" href="assets/compiled/svg/favicon.svg" type="image/x-icon">
    <link rel="stylesheet" href="assets/compiled/css/app.css">
    <link rel="stylesheet" href="assets/compiled/css/app-dark.css">
    <link rel="stylesheet" href="assets/compiled/css/iconly.css">
    <link rel="stylesheet" href="assets/compiled/css/auth.css">
</head>
<body>
    <script src="assets/static/js/initTheme.js"></script>
    <div id="auth">
        <div class="row h-100">
            <div class="col-lg-5 col-12">
                <div id="auth-left">
                    <div class="auth-logo">
                        <a href="index.html"><img src="assets/compiled/svg/logo.svg" alt="Logo"> </a>
                    </div>
                    <div class="theme-toggle d-flex gap-2  align-items-center mt-2">
                        <svg class="iconify iconify--system-uicons" width="20" height="20" viewBox="0 0 21 21"><g fill="none" fill-rule="evenodd" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M10.5 14.5c2.219 0 4-1.763 4-3.982a4.003 4.003 0 0 0-4-4.018c-2.219 0-4 1.781-4 4c0 2.219 1.781 4 4 4zM4.136 4.136L5.55 5.55m9.9 9.9l1.414 1.414M1.5 10.5h2m14 0h2M4.135 16.863L5.55 15.45m9.899-9.9l1.414-1.415M10.5 19.5v-2m0-14v-2" opacity=".3"></path><g transform="translate(-210 -1)"><path d="M220.5 2.5v2m6.5.5l-1.5 1.5"></path><circle cx="220.5" cy="11.5" r="4"></circle><path d="m214 5l1.5 1.5m5 14v-2m6.5-.5l-1.5-1.5M214 18l1.5-1.5m-4-5h2m14 0h2"></path></g></g></svg>
                        <div class="form-check form-switch fs-6">
                            <input class="form-check-input  me-0" type="checkbox" id="toggle-dark" style="cursor: pointer">
                            <label class="form-check-label"></label>
                        </div>
                        <svg class="iconify iconify--mdi" width="20" height="20" viewBox="0 0 24 24"><path fill="currentColor" d="m17.75 4.09l-2.53 1.94l.91 3.06l-2.63-1.81l-2.63 1.81l.91-3.06l-2.53-1.94L12.44 4l1.06-3l1.06 3l3.19.09m3.5 6.91l-1.64 1.25l.59 1.98l-1.7-1.17l-1.7 1.17l.59-1.98L15.75 11l2.06-.05L18.5 9l.69 1.95l2.06.05m-2.28 4.95c.83-.08 1.72 1.1 1.19 1.85c-.32.45-.66.87-1.08 1.27C15.17 23 8.84 23 4.94 19.07c-3.91-3.9-3.91-10.24 0-14.14c.4-.4.82-.76 1.27-1.08c.75-.53 1.93.36 1.85 1.19c-.27 2.86.69 5.83 2.89 8.02a9.96 9.96 0 0 0 8.02 2.89m-1.64 2.02a12.08 12.08 0 0 1-7.8-3.47c-2.17-2.19-3.33-5-3.49-7.82c-2.81 3.14-2.7 7.96.31 10.98c3.02 3.01 7.84 3.12 10.98.31Z"></path></svg>
                    </div>
                    <br>
                    <h1 class="auth-title">Iniciar Sesión</h1>
                    <p class="auth-subtitle mb-5">Ingrese sus credenciales para acceder al sistema.</p>
                    <?php if (!empty($error)): ?>
                        <div class="alert alert-danger" role="alert">
                            <?php echo $error; ?>
                        </div>
                    <?php endif; ?>
                    <form id="login-form" action="login.php" method="POST">
                        <div class="form-group position-relative has-icon-left mb-4">
                            <input type="email" name="correo" class="form-control form-control-xl" placeholder="Correo" required value="<?php echo htmlspecialchars($correo); ?>">
                            <div class="form-control-icon">
                                <i class="bi bi-person"></i>
                            </div>
                        </div>
                        <div class="form-group position-relative has-icon-left mb-4">
                            <input type="password" name="contrasena" class="form-control form-control-xl" placeholder="Contraseña" required>
                            <div class="form-control-icon">
                                <i class="bi bi-shield-lock"></i>
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary btn-block btn-lg shadow-lg mt-5">Ingresar</button>
                    </form>
                    <div class="text-center mt-5 text-lg fs-4">
                        <p class="text-gray-600">
                            Sistema de Gestión de Cotizaciones Multiempresa.
                        </p>
                    </div>
                </div>
            </div>
            <div class="col-lg-7 d-none d-lg-block">
                <div id="auth-right">
                </div>
            </div>
        </div>
    </div>
    <script src="assets/extensions/perfect-scrollbar/perfect-scrollbar.min.js"></script>
    <script src="assets/static/js/components/dark.js"></script>
    <script src="assets/compiled/js/app.js"></script>
</body>
</html>
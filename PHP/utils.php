<?php
/**
 * Obtiene la dirección IP real del cliente, teniendo en cuenta proxies y configuraciones de servidor
 * @return string La dirección IP del cliente
 */
function getClientIP() {
    $ipAddress = '';
    
    // Check for X-Forwarded-For header first (for clients behind proxy)
    if (isset($_SERVER['HTTP_X_FORWARDED_FOR']) && filter_var($_SERVER['HTTP_X_FORWARDED_FOR'], FILTER_VALIDATE_IP)) {
        $ipAddress = $_SERVER['HTTP_X_FORWARDED_FOR'];
    }
    // Then check for HTTP_CLIENT_IP
    elseif (isset($_SERVER['HTTP_CLIENT_IP']) && filter_var($_SERVER['HTTP_CLIENT_IP'], FILTER_VALIDATE_IP)) {
        $ipAddress = $_SERVER['HTTP_CLIENT_IP'];
    }
    // Finally check for REMOTE_ADDR
    elseif (isset($_SERVER['REMOTE_ADDR']) && filter_var($_SERVER['REMOTE_ADDR'], FILTER_VALIDATE_IP)) {
        $ipAddress = $_SERVER['REMOTE_ADDR'];
    }
    
    // Si la IP contiene múltiples direcciones (por proxy), tomar la primera
    if (strpos($ipAddress, ',') !== false) {
        $ips = explode(',', $ipAddress);
        $ipAddress = trim($ips[0]);
    }
    
    // Validar que sea una IPv4
    if (filter_var($ipAddress, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
        return $ipAddress;
    }
    
    // Si no se encuentra una IPv4 válida, devolver una IP local
    return '127.0.0.1';
}
?>

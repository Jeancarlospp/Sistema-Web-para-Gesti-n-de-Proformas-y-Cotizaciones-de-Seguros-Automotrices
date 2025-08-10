<?php // ¿Está esta etiqueta de apertura al principio?
class Conexion {
    private $host = "localhost";
    private $db = "sistema_cotizaciones";
    private $user = "admin";
    private $pass = "admin";
    public $conn;

    public function __construct() {
        $this->conn = new mysqli($this->host, $this->user, $this->pass, $this->db);
        if ($this->conn->connect_error) {
            // El die() aquí puede causar un 500 sin respuesta JSON. Es mejor manejarlo de otra forma, pero por ahora está bien.
            die("Conexión fallida: " . $this->conn->connect_error);
        }
        $this->conn->set_charset("utf8mb4");
    } // ¿Está esta llave cerrada?

    public function getConn() {
        return $this->conn;
    } // ¿Está esta llave cerrada?

    public function close() {
        $this->conn->close();
    } // ¿Está esta llave cerrada?
} // ¿Está esta llave final de la clase cerrada?
?>
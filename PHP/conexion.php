<?php
class Conexion {
    private $host = "localhost";
    private $db = "sistemas_cotizaciones";
    private $user = "admin";
    private $pass = "admin";
    public $conn;

    public function __construct() {
        $this->conn = new mysqli($this->host, $this->user, $this->pass, $this->db);
        if ($this->conn->connect_error) {
            die("Conexión fallida: " . $this->conn->connect_error);
        }
        $this->conn->set_charset("utf8mb4");
    }

    public function getConn() {
        return $this->conn;
    }

    public function close() {
        $this->conn->close();
    }
}
?>

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS aseguradora_autos;
USE aseguradora_autos;

-- Tabla de roles
CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE
);

-- Tabla de usuarios

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    correo VARCHAR(100) NOT NULL UNIQUE,
    contrasena VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    cedula VARCHAR(20),
    rol_id INT NOT NULL,
    estado ENUM('activo','inactivo') NOT NULL DEFAULT 'activo',
    ultimo_login DATETIME DEFAULT NULL,
    FOREIGN KEY (rol_id) REFERENCES roles(id)
);

-- Tabla de clientes
CREATE TABLE clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    direccion VARCHAR(255),
    telefono VARCHAR(20),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Insertar roles de ejemplo
INSERT INTO roles (nombre) VALUES ('admin'), ('asesor'), ('vendedor');

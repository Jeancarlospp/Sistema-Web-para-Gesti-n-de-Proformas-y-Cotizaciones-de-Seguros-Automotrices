-- MySQL Script corregido para importar en phpMyAdmin
-- Corregido: Agosto 6, 2025
-- Base de datos: sistemas_cotizaciones

SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0;
SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0;
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION';

-- -----------------------------------------------------
-- Schema sistemas_cotizaciones
-- -----------------------------------------------------
CREATE SCHEMA IF NOT EXISTS `sistemas_cotizaciones` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `sistemas_cotizaciones`;

-- -----------------------------------------------------
-- Table `sistemas_cotizaciones`.`roles`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `sistemas_cotizaciones`.`roles`;

CREATE TABLE IF NOT EXISTS `sistemas_cotizaciones`.`roles` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `nombre` VARCHAR(45) NOT NULL,
  `descripcion` TEXT NULL,
  `estado` ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `nombre_UNIQUE` (`nombre` ASC) VISIBLE
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- -----------------------------------------------------
-- Table `sistemas_cotizaciones`.`usuarios`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `sistemas_cotizaciones`.`usuarios`;

CREATE TABLE IF NOT EXISTS `sistemas_cotizaciones`.`usuarios` (
  `id_usuario` INT NOT NULL AUTO_INCREMENT,
  `correo` VARCHAR(100) NOT NULL,
  `contrasena` VARCHAR(255) NOT NULL,
  `nombre` VARCHAR(100) NOT NULL,
  `cedula` VARCHAR(10) NOT NULL,
  `rol_id` INT NOT NULL,
  `ultimo_login` DATETIME NULL DEFAULT NULL,
  `estado` ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
  `fecha_creacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id_usuario`),
  UNIQUE INDEX `correo_UNIQUE` (`correo` ASC) VISIBLE,
  UNIQUE INDEX `cedula_UNIQUE` (`cedula` ASC) VISIBLE,
  INDEX `fk_usuarios_roles_idx` (`rol_id` ASC) VISIBLE,
  CONSTRAINT `fk_usuarios_roles`
    FOREIGN KEY (`rol_id`)
    REFERENCES `sistemas_cotizaciones`.`roles` (`id`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- -----------------------------------------------------
-- Table `sistemas_cotizaciones`.`categoria`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `sistemas_cotizaciones`.`categoria`;

CREATE TABLE IF NOT EXISTS `sistemas_cotizaciones`.`categoria` (
  `idcategoria` INT NOT NULL AUTO_INCREMENT,
  `Cat_nombre` VARCHAR(100) NOT NULL,
  `Cat_descripcion` TEXT NULL DEFAULT NULL,
  `Cat_estado` ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
  `Cat_fechaCreacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idcategoria`),
  UNIQUE INDEX `Cat_nombre_UNIQUE` (`Cat_nombre` ASC) VISIBLE
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- -----------------------------------------------------
-- Table `sistemas_cotizaciones`.`empresas_proveedora`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `sistemas_cotizaciones`.`empresas_proveedora`;

CREATE TABLE IF NOT EXISTS `sistemas_cotizaciones`.`empresas_proveedora` (
  `idEmpresas_Proveedora` INT NOT NULL AUTO_INCREMENT,
  `Emp_nombre` VARCHAR(100) NOT NULL,
  `Emp_ruc` VARCHAR(13) NOT NULL,
  `Emp_correo` VARCHAR(100) NOT NULL,
  `Emp_telefono` VARCHAR(15) NULL DEFAULT NULL,
  `Emp_estado` ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
  `Emp_razonSocial` VARCHAR(200) NULL DEFAULT NULL,
  `Emp_direccion` TEXT NULL DEFAULT NULL,
  `Emp_fechaRegistro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idEmpresas_Proveedora`),
  UNIQUE INDEX `Emp_ruc_UNIQUE` (`Emp_ruc` ASC) VISIBLE,
  UNIQUE INDEX `Emp_correo_UNIQUE` (`Emp_correo` ASC) VISIBLE
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- -----------------------------------------------------
-- Table `sistemas_cotizaciones`.`producto`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `sistemas_cotizaciones`.`producto`;

CREATE TABLE IF NOT EXISTS `sistemas_cotizaciones`.`producto` (
  `idproducto` INT NOT NULL AUTO_INCREMENT,
  `Pro_nombre` VARCHAR(100) NOT NULL,
  `Pro_descripcion` TEXT NULL DEFAULT NULL,
  `Pro_precioTotal` DECIMAL(10,2) NOT NULL,
  `Pro_mesesCobertura` INT NOT NULL,
  `Pro_responsabilidadCivil` DECIMAL(10,2) NULL DEFAULT NULL,
  `Pro_roboTotal` ENUM('si', 'no') NOT NULL DEFAULT 'no',
  `Pro_asistenciaVial` ENUM('basica', '24/7', 'ilimitada') NOT NULL DEFAULT 'basica',
  `Pro_dañosColision` DECIMAL(10,2) NULL DEFAULT NULL,
  `Pro_autoReemplazo` ENUM('si', 'no') NOT NULL DEFAULT 'no',
  `Pro_gastosLegales` DECIMAL(10,2) NULL DEFAULT NULL,
  `Pro_gastosMedicos` DECIMAL(10,2) NULL DEFAULT NULL,
  `Pro_precioMensual` DECIMAL(10,2) NOT NULL,
  `idCategoria` INT NOT NULL,
  `idEmpresaProveedora` INT NOT NULL,
  `Pro_estado` ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
  `Pro_fechaCreacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idproducto`),
  INDEX `fk_producto_categoria_idx` (`idCategoria` ASC) VISIBLE,
  INDEX `fk_producto_empresa_idx` (`idEmpresaProveedora` ASC) VISIBLE,
  CONSTRAINT `fk_producto_categoria`
    FOREIGN KEY (`idCategoria`)
    REFERENCES `sistemas_cotizaciones`.`categoria` (`idcategoria`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_producto_empresa`
    FOREIGN KEY (`idEmpresaProveedora`)
    REFERENCES `sistemas_cotizaciones`.`empresas_proveedora` (`idEmpresas_Proveedora`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- -----------------------------------------------------
-- Table `sistemas_cotizaciones`.`cliente`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `sistemas_cotizaciones`.`cliente`;

CREATE TABLE IF NOT EXISTS `sistemas_cotizaciones`.`cliente` (
  `idCliente` INT NOT NULL AUTO_INCREMENT,
  `Cli_nombre` VARCHAR(100) NOT NULL,
  `Cli_cedula` VARCHAR(10) NOT NULL,
  `Cli_correo` VARCHAR(100) NULL DEFAULT NULL,
  `Cli_telefono` VARCHAR(10) NULL DEFAULT NULL,
  `Cli_estado` ENUM('activo', 'inactivo') NOT NULL DEFAULT 'activo',
  `Cli_fechaRegistro` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idCliente`),
  UNIQUE INDEX `Cli_cedula_UNIQUE` (`Cli_cedula` ASC) VISIBLE
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- -----------------------------------------------------
-- Table `sistemas_cotizaciones`.`cotizacion`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `sistemas_cotizaciones`.`cotizacion`;

CREATE TABLE IF NOT EXISTS `sistemas_cotizaciones`.`cotizacion` (
  `idCotizacion` INT NOT NULL AUTO_INCREMENT,
  `Cot_descripcion` TEXT NULL DEFAULT NULL,
  `Cot_fechaCreacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Cot_fechaVencimiento` DATETIME NULL DEFAULT NULL,
  `Cot_montoAsegurable` DECIMAL(12,2) NOT NULL DEFAULT '0.00',
  `Cot_estado` ENUM('borrador', 'enviada', 'aceptada', 'rechazada', 'vencida') NOT NULL DEFAULT 'borrador',
  `idCliente` INT NOT NULL,
  `idUsuario` INT NOT NULL,
  PRIMARY KEY (`idCotizacion`),
  INDEX `fk_cotizacion_cliente_idx` (`idCliente` ASC) VISIBLE,
  INDEX `fk_cotizacion_usuario_idx` (`idUsuario` ASC) VISIBLE,
  CONSTRAINT `fk_cotizacion_cliente`
    FOREIGN KEY (`idCliente`)
    REFERENCES `sistemas_cotizaciones`.`cliente` (`idCliente`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE,
  CONSTRAINT `fk_cotizacion_usuario`
    FOREIGN KEY (`idUsuario`)
    REFERENCES `sistemas_cotizaciones`.`usuarios` (`id_usuario`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- -----------------------------------------------------
-- Table `sistemas_cotizaciones`.`detalle_cotizacion`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `sistemas_cotizaciones`.`detalle_cotizacion`;

CREATE TABLE IF NOT EXISTS `sistemas_cotizaciones`.`detalle_cotizacion` (
  `idDetalle_Cotizacion` INT NOT NULL AUTO_INCREMENT,
  `idCotizacion` INT NOT NULL,
  `idProducto` INT NOT NULL,
  `Det_numServicios` INT NOT NULL DEFAULT '1',
  `Det_precioUnitario` DECIMAL(10,2) NOT NULL,
  `Det_subtotal` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`idDetalle_Cotizacion`),
  INDEX `fk_detalle_cotizacion_idx` (`idCotizacion` ASC) VISIBLE,
  INDEX `fk_detalle_producto_idx` (`idProducto` ASC) VISIBLE,
  CONSTRAINT `fk_detalle_cotizacion`
    FOREIGN KEY (`idCotizacion`)
    REFERENCES `sistemas_cotizaciones`.`cotizacion` (`idCotizacion`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_detalle_producto`
    FOREIGN KEY (`idProducto`)
    REFERENCES `sistemas_cotizaciones`.`producto` (`idproducto`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- -----------------------------------------------------
-- Table `sistemas_cotizaciones`.`historial_cotizacion`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `sistemas_cotizaciones`.`historial_cotizacion`;

CREATE TABLE IF NOT EXISTS `sistemas_cotizaciones`.`historial_cotizacion` (
  `idHistorial_Cotizacion` INT NOT NULL AUTO_INCREMENT,
  `Hist_descripcion` TEXT NOT NULL,
  `Hist_fechaCotizacion` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `idCotizacion` INT NOT NULL,
  `idUsuario` INT NOT NULL,
  PRIMARY KEY (`idHistorial_Cotizacion`),
  INDEX `fk_historial_cotizacion_idx` (`idCotizacion` ASC) VISIBLE,
  INDEX `fk_historial_usuario_idx` (`idUsuario` ASC) VISIBLE,
  CONSTRAINT `fk_historial_cotizacion`
    FOREIGN KEY (`idCotizacion`)
    REFERENCES `sistemas_cotizaciones`.`cotizacion` (`idCotizacion`)
    ON DELETE CASCADE
    ON UPDATE CASCADE,
  CONSTRAINT `fk_historial_usuario`
    FOREIGN KEY (`idUsuario`)
    REFERENCES `sistemas_cotizaciones`.`usuarios` (`id_usuario`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- -----------------------------------------------------
-- Table `sistemas_cotizaciones`.`auditoria`
-- -----------------------------------------------------
DROP TABLE IF EXISTS `sistemas_cotizaciones`.`auditoria`;

CREATE TABLE IF NOT EXISTS `sistemas_cotizaciones`.`auditoria` (
  `idAuditoria` INT NOT NULL AUTO_INCREMENT,
  `idUsuario` INT NOT NULL,
  `Aud_accion` VARCHAR(100) NOT NULL,
  `Aud_tabla` VARCHAR(50) NOT NULL,
  `Aud_descripcion` TEXT NOT NULL,
  `Aud_fecha` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Aud_IP` VARCHAR(45) NOT NULL,
  PRIMARY KEY (`idAuditoria`),
  INDEX `fk_auditoria_usuario_idx` (`idUsuario` ASC) VISIBLE,
  INDEX `idx_auditoria_fecha` (`Aud_fecha` ASC) VISIBLE,
  INDEX `idx_auditoria_tabla` (`Aud_tabla` ASC) VISIBLE,
  CONSTRAINT `fk_auditoria_usuario`
    FOREIGN KEY (`idUsuario`)
    REFERENCES `sistemas_cotizaciones`.`usuarios` (`id_usuario`)
    ON DELETE RESTRICT
    ON UPDATE CASCADE
) ENGINE = InnoDB DEFAULT CHARACTER SET = utf8mb4;

-- -----------------------------------------------------
-- Insertar datos iniciales
-- -----------------------------------------------------

-- Insertar roles
INSERT INTO `sistemas_cotizaciones`.`roles` (`nombre`) VALUES
('admin'),
('asesor'),
('vendedor');

-- Insertar usuarios (corregido para usar la estructura correcta)
INSERT INTO `sistemas_cotizaciones`.`usuarios` (`correo`, `contrasena`, `nombre`, `cedula`, `rol_id`, `estado`, `ultimo_login`) VALUES
('admin@sistema.com', '$2y$10$YrA4YVCvUovZOYmVy6rNDuq8iUR3/dYnPCugPjKYJhsDNIL/WQUfm', 'Danna Andrade', '1722651567', 1, 'activo', '2025-08-06 00:14:51'),
('zaith@sistema.com', '$2y$10$P2dCDUaHYhFJsxK8hdBPHuw2lV/06fkmPLRvHNAemL.mS0s7gIdia', 'Zaith Manangon', '1111111111', 2, 'activo', '2025-08-05 23:38:20'),
('jean@sistema.com', '$2y$10$An9mQo.5qbhbKwpRLyjxOukoGmdhNmCrrBPTdYu.Qpfm17k5JYFZm', 'Jeancarlo Santi', '2222222222', 3, 'activo', '2025-08-05 23:38:45');

-- Insertar categorías de ejemplo
INSERT INTO `sistemas_cotizaciones`.`categoria` (`Cat_nombre`, `Cat_descripcion`) VALUES
('Seguros de Auto', 'Seguros para vehículos particulares'),
('Seguros de Vida', 'Seguros de vida y accidentes'),
('Seguros de Hogar', 'Seguros para el hogar');

-- Insertar empresa proveedora de ejemplo
INSERT INTO `sistemas_cotizaciones`.`empresas_proveedora` (`Emp_nombre`, `Emp_ruc`, `Emp_correo`, `Emp_razonSocial`) VALUES
('Seguros Ejemplo S.A.', '1234567890001', 'contacto@segurosejemplo.com', 'Seguros Ejemplo Sociedad Anónima');

-- -----------------------------------------------------
-- Triggers (OPCIONAL - puedes eliminar esta sección si no quieres triggers)
-- -----------------------------------------------------

DELIMITER $$

DROP TRIGGER IF EXISTS `sistemas_cotizaciones`.`tr_cotizacion_insert`$$
CREATE TRIGGER `sistemas_cotizaciones`.`tr_cotizacion_insert`
AFTER INSERT ON `sistemas_cotizaciones`.`cotizacion`
FOR EACH ROW
BEGIN
  INSERT INTO `sistemas_cotizaciones`.`auditoria` 
  (`idUsuario`, `Aud_accion`, `Aud_tabla`, `Aud_descripcion`, `Aud_IP`)
  VALUES 
  (NEW.idUsuario, 'INSERT', 'cotizacion', CONCAT('Nueva cotización creada ID: ', NEW.idCotizacion, ' para cliente ID: ', NEW.idCliente), '127.0.0.1');
END$$

DROP TRIGGER IF EXISTS `sistemas_cotizaciones`.`tr_usuario_insert`$$
CREATE TRIGGER `sistemas_cotizaciones`.`tr_usuario_insert`
AFTER INSERT ON `sistemas_cotizaciones`.`usuarios`
FOR EACH ROW
BEGIN
  INSERT INTO `sistemas_cotizaciones`.`auditoria` 
  (`idUsuario`, `Aud_accion`, `Aud_tabla`, `Aud_descripcion`, `Aud_IP`)
  VALUES 
  (NEW.id_usuario, 'INSERT', 'usuarios', CONCAT('Nuevo usuario creado: ', NEW.correo), '127.0.0.1');
END$$

DELIMITER ;

SET SQL_MODE=@OLD_SQL_MODE;
SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS;
SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS;
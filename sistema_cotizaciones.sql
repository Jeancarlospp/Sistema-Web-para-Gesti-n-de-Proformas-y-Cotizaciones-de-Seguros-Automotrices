-- phpMyAdmin SQL Dump
-- version 4.9.1
-- https://www.phpmyadmin.net/
--
-- Servidor: localhost
-- Tiempo de generación: 08-08-2025 a las 20:55:51
-- Versión del servidor: 8.0.17
-- Versión de PHP: 7.3.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de datos: `sistema_cotizaciones`
--

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `auditoria`
--

CREATE TABLE `auditoria` (
  `idAuditoria` int(11) NOT NULL,
  `idUsuario` int(11) NOT NULL,
  `Aud_accion` varchar(100) NOT NULL,
  `Aud_tabla` varchar(50) NOT NULL,
  `Aud_descripcion` text NOT NULL,
  `Aud_fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Aud_IP` varchar(45) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `auditoria`
--

INSERT INTO `auditoria` (`idAuditoria`, `idUsuario`, `Aud_accion`, `Aud_tabla`, `Aud_descripcion`, `Aud_fecha`, `Aud_IP`) VALUES
(1, 1, 'INSERT', 'usuarios', 'Nuevo usuario creado: zuli@sistema.com', '2025-08-07 22:40:07', '127.0.0.1'),
(2, 4, 'INSERT', 'usuarios', 'Nuevo usuario creado: ariel@sistema.com', '2025-08-07 22:59:00', '127.0.0.1'),
(3, 6, 'INSERT', 'usuarios', 'Nuevo usuario creado: juan@sistema.com', '2025-08-08 15:10:46', '127.0.0.1');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `categoria`
--

CREATE TABLE `categoria` (
  `idcategoria` int(11) NOT NULL,
  `Cat_nombre` varchar(100) NOT NULL,
  `Cat_descripcion` text,
  `Cat_estado` enum('activo','inactivo') NOT NULL DEFAULT 'activo',
  `Cat_fechaCreacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `categoria`
--

INSERT INTO `categoria` (`idcategoria`, `Cat_nombre`, `Cat_descripcion`, `Cat_estado`, `Cat_fechaCreacion`) VALUES
(1, 'Moto', 'Cobertura de daños, robo y responsabilidad civil para motocicletas', 'activo', '2025-08-07 09:00:00'),
(2, 'Vehículo pesado', 'Seguros para camiones, buses y maquinaria pesada. Cobertura contra accidentes, responsabilidad civil y daños materiales', 'activo', '2025-08-07 09:00:00'),
(3, 'Vehículo liviano', 'Cobertura integral para autos, camionetas y SUV. Incluye colisiones, robos y asistencia en carretera', 'activo', '2025-08-07 09:00:00'),
(4, 'Vehículo de carga', 'Seguro para furgonetas, camionetas o vehículos utilizados para transporte de mercancías. Incluye daños, robos y terceros', 'activo', '2025-08-07 10:00:00'),
(5, 'Transporte público', 'Cobertura para buses, taxis y otros vehículos de transporte de pasajeros. Incluye responsabilidad civil, accidentes y cobertura legal', 'activo', '2025-08-07 10:00:00');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cliente`
--

CREATE TABLE `cliente` (
  `idCliente` int(11) NOT NULL,
  `Cli_nombre` varchar(100) NOT NULL,
  `Cli_cedula` varchar(10) NOT NULL,
  `Cli_correo` varchar(100) DEFAULT NULL,
  `Cli_telefono` varchar(10) DEFAULT NULL,
  `Cli_fechaRegistro` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `cliente`
--

INSERT INTO `cliente` (`idCliente`, `Cli_nombre`, `Cli_cedula`, `Cli_correo`, `Cli_telefono`, `Cli_fechaRegistro`) VALUES
(1, 'Ana Lucio', '1309481925', 'ana@gmail.com', '0998745632', '2025-08-07 09:46:49'),
(2, 'Carlos Mena', '0103456789', 'carlos_mena@gmail.com', '0991234567', '2025-08-07 09:52:47'),
(3, 'Lucía Torres', '0923456781', 'lucia_torres@gmail.com', '0987654321', '2025-08-07 09:52:47'),
(4, 'Andrés Cevallos', '1102345673', 'andres_cevallos@gmail.com', '0961122334', '2025-08-07 09:52:47'),
(5, 'María Jaramillo', '0209876542', 'maria_jaramillo@gmail.com', '0953344556', '2025-08-07 09:52:47'),
(6, 'Pedro Chávez', '0601234566', 'pedro_chavez@gmail.com', '0942233445', '2025-08-07 09:52:47'),
(7, 'Diana Salazar', '1704567894', 'diana_salazar@gmail.com', '0931122334', '2025-08-07 09:52:47'),
(8, 'Juan Pérez', '0109988774', 'juan_perez@gmail.com', '0987766554', '2025-08-07 09:52:47'),
(9, 'Gabriela León', '1205678905', 'gabriela_leon@gmail.com', '0994455667', '2025-08-07 09:52:47'),
(10, 'Esteban Romero', '0911223347', 'esteban_romero@gmail.com', '0972233445', '2025-08-07 09:52:47'),
(11, 'Carla Andrade', '1003344551', 'carla_andrade@gmail.com', '0967788990', '2025-08-07 09:52:47'),
(12, 'David Paredes', '0809988776', 'david_paredes@gmail.com', '0956677889', '2025-08-07 09:52:47'),
(13, 'Andrea Villacís', '0701234982', 'andrea_villacis@gmail.com', '0945566778', '2025-08-07 09:52:47'),
(14, 'Daniela López', '0302345679', 'daniela_lopez@gmail.com', '0934455667', '2025-08-07 09:52:47'),
(15, 'Kevin Jiménez', '1503456783', 'kevin_jimenez@gmail.com', '0923344556', '2025-08-07 09:52:47'),
(16, 'Fernanda Ríos', '0404567891', 'fernanda_rios@gmail.com', '0912233445', '2025-08-07 09:52:47');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `cotizacion`
--

CREATE TABLE `cotizacion` (
  `idCotizacion` int(11) NOT NULL,
  `Cot_descripcion` text,
  `Cot_fechaCreacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Cot_fechaVencimiento` datetime DEFAULT NULL,
  `Cot_montoAsegurable` decimal(12,2) NOT NULL DEFAULT '0.00',
  `Cot_estado` enum('borrador','enviada','aceptada','rechazada','vencida') NOT NULL DEFAULT 'borrador',
  `idCliente` int(11) NOT NULL,
  `idUsuario` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Disparadores `cotizacion`
--
DELIMITER $$
CREATE TRIGGER `tr_cotizacion_insert` AFTER INSERT ON `cotizacion` FOR EACH ROW BEGIN
  INSERT INTO `sistemas_cotizaciones`.`auditoria` 
  (`idUsuario`, `Aud_accion`, `Aud_tabla`, `Aud_descripcion`, `Aud_IP`)
  VALUES 
  (NEW.idUsuario, 'INSERT', 'cotizacion', CONCAT('Nueva cotización creada ID: ', NEW.idCotizacion, ' para cliente ID: ', NEW.idCliente), '127.0.0.1');
END
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `detalle_cotizacion`
--

CREATE TABLE `detalle_cotizacion` (
  `idDetalle_Cotizacion` int(11) NOT NULL,
  `idCotizacion` int(11) NOT NULL,
  `idProducto` int(11) NOT NULL,
  `Det_numServicios` int(11) NOT NULL DEFAULT '1',
  `Det_precioUnitario` decimal(10,2) NOT NULL,
  `Det_subtotal` decimal(10,2) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `empresas_proveedora`
--

CREATE TABLE `empresas_proveedora` (
  `idEmpresas_Proveedora` int(11) NOT NULL,
  `Emp_nombre` varchar(100) NOT NULL,
  `Emp_ruc` varchar(13) NOT NULL,
  `Emp_correo` varchar(100) NOT NULL,
  `Emp_telefono` varchar(15) DEFAULT NULL,
  `Emp_estado` enum('activo','inactivo') NOT NULL DEFAULT 'activo',
  `Emp_razonSocial` varchar(200) DEFAULT NULL,
  `Emp_direccion` text,
  `Emp_fechaRegistro` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `empresas_proveedora`
--

INSERT INTO `empresas_proveedora` (`idEmpresas_Proveedora`, `Emp_nombre`, `Emp_ruc`, `Emp_correo`, `Emp_telefono`, `Emp_estado`, `Emp_razonSocial`, `Emp_direccion`, `Emp_fechaRegistro`) VALUES
(1, 'Seguros Latitud S.A.', '1234567890001', 'latitudsa@segs.com', '0987564120', 'activo', 'Seguros Latitud Sociedad Anónima', 'Quito', '2025-08-07 07:30:39'),
(2, 'Seguros CarPro ', '1790012336001', 'seg@carpro.com', '022345656', 'activo', 'Seguros CarPro S.A.', 'Sangolqui', '2025-08-07 10:06:43'),
(3, 'Seguros Equinoccial', '1790012345001', 'contacto@equinoccial.com.ec', '022345678', 'activo', 'Seguros Equinoccial S.A.', 'Av. Amazonas y Naciones Unidas, Quito', '2025-08-07 10:07:18'),
(4, 'Seguros Sucre', '0998765432001', 'info@segurossucre.fin.ec', '042345678', 'activo', 'Seguros Sucre C.A.', 'Malecón Simón Bolívar, Guayaquil', '2025-08-07 10:07:18'),
(5, 'Hispana de Seguros', '1799988776001', 'servicio@hispanaseguros.ec', '023456789', 'activo', 'Hispana Compañía de Seguros S.A.', 'Av. República y Shyris, Quito', '2025-08-07 10:07:18'),
(6, 'Confianza Seguros', '0891234567001', 'clientes@confianzaseguros.com', '032233445', 'activo', 'Confianza Seguros Cía. Ltda.', 'Av. 10 de Agosto, Ambato', '2025-08-07 10:07:18'),
(7, 'Aseguradora Pichincha', '1790011122001', 'info@aseguradorapichincha.ec', '022245678', 'activo', 'Aseguradora del Pichincha S.A.', 'Av. Patria y 6 de Diciembre, Quito', '2025-08-07 10:07:18'),
(8, 'Latina Seguros', '0992233445001', 'soporte@latinaseguros.com.ec', '042998877', 'activo', 'Latina Compañía de Seguros S.A.', 'Av. Kennedy y Víctor Emilio Estrada, Guayaquil', '2025-08-07 10:07:18'),
(9, 'Colvida Seguros', '1793344556001', 'contacto@colvida.ec', '022112233', 'activo', 'Colvida Seguros de Vida S.A.', 'Av. Eloy Alfaro, Quito', '2025-08-07 10:07:18'),
(10, 'Oriente Seguros', '0895544332001', 'info@orienteseguros.com.ec', '033334455', 'activo', 'Oriente Compañía de Seguros S.A.', 'Av. Atahualpa y Av. El Rey, Riobamba', '2025-08-07 10:07:18'),
(11, 'Liberty Seguros', '1098765432001', 'atencion@libertyseguros.ec', '042112233', 'activo', 'Liberty Compañía de Seguros S.A.', 'Av. Francisco de Orellana, Guayaquil', '2025-08-07 10:07:18'),
(12, 'Rimac Seguros', '0996655443001', 'contacto@rimac.ec', '025556677', 'activo', 'Rimac Seguros Generales S.A.', 'Av. Los Shyris, Quito', '2025-08-07 10:07:18');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `historial_cotizacion`
--

CREATE TABLE `historial_cotizacion` (
  `idHistorial_Cotizacion` int(11) NOT NULL,
  `Hist_descripcion` text NOT NULL,
  `Hist_fechaCotizacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `idCotizacion` int(11) NOT NULL,
  `idUsuario` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `producto`
--

CREATE TABLE `producto` (
  `idproducto` int(11) NOT NULL,
  `Pro_nombre` varchar(100) NOT NULL,
  `Pro_descripcion` text,
  `Pro_precioTotal` decimal(10,2) NOT NULL,
  `Pro_mesesCobertura` int(11) NOT NULL,
  `Pro_responsabilidadCivil` decimal(10,2) DEFAULT NULL,
  `Pro_roboTotal` enum('si','no') NOT NULL DEFAULT 'no',
  `Pro_asistenciaVial` enum('basica','24/7','ilimitada') NOT NULL DEFAULT 'basica',
  `Pro_dañosColision` decimal(10,2) DEFAULT NULL,
  `Pro_autoReemplazo` enum('si','no') NOT NULL DEFAULT 'no',
  `Pro_gastosLegales` decimal(10,2) DEFAULT NULL,
  `Pro_gastosMedicos` decimal(10,2) DEFAULT NULL,
  `Pro_precioMensual` decimal(10,2) NOT NULL,
  `idCategoria` int(11) NOT NULL,
  `idEmpresaProveedora` int(11) NOT NULL,
  `Pro_estado` enum('activo','inactivo') NOT NULL DEFAULT 'activo',
  `Pro_fechaCreacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `producto`
--

INSERT INTO `producto` (`idproducto`, `Pro_nombre`, `Pro_descripcion`, `Pro_precioTotal`, `Pro_mesesCobertura`, `Pro_responsabilidadCivil`, `Pro_roboTotal`, `Pro_asistenciaVial`, `Pro_dañosColision`, `Pro_autoReemplazo`, `Pro_gastosLegales`, `Pro_gastosMedicos`, `Pro_precioMensual`, `idCategoria`, `idEmpresaProveedora`, `Pro_estado`, `Pro_fechaCreacion`) VALUES
(1, 'Seguro Motos Liberty', 'Cobertura para motos con robo total y asistencia ilimitada.', '1520.00', 12, '27000.00', 'si', 'ilimitada', '22000.00', 'si', '3500.00', '2100.00', '43.33', 1, 11, 'activo', '2025-08-07 10:44:58'),
(2, 'Seguro Motos Rimac', 'Seguro para motos con cobertura parcial y asistencia básica.', '1310.00', 12, '14000.00', 'no', 'basica', '9000.00', 'no', '1800.00', '900.00', '25.83', 1, 12, 'activo', '2025-08-07 10:44:58'),
(3, 'Seguro Camiones Confianza', 'Seguro para camiones con responsabilidad civil alta.', '1750.00', 12, '90000.00', 'no', '24/7', '45000.00', 'no', '5500.00', '3500.00', '145.83', 2, 6, 'activo', '2025-08-07 10:44:58'),
(4, 'Seguro Maquinaria Pichincha', 'Cobertura total para maquinaria pesada con auto reemplazo.', '2250.00', 12, '110000.00', 'si', 'ilimitada', '75000.00', 'si', '7500.00', '5200.00', '187.50', 2, 7, 'activo', '2025-08-07 10:44:58'),
(5, 'Seguro Autos Latina', 'Cobertura integral para autos con asistencia ilimitada.', '1350.00', 12, '52000.00', 'si', 'ilimitada', '37000.00', 'si', '3600.00', '2200.00', '112.50', 3, 8, 'activo', '2025-08-07 10:44:58'),
(6, 'Seguro Autos Seguros Latitud', 'Seguro con responsabilidad civil y robo parcial para autos.', '980.00', 12, '32000.00', 'si', '24/7', '16000.00', 'no', '2600.00', '1400.00', '81.67', 3, 1, 'activo', '2025-08-07 10:44:58'),
(7, 'Seguro Furgonetas Hispana', 'Cobertura para vehículos utilitarios con asistencia 24/7.', '1700.00', 12, '62000.00', 'si', '24/7', '32000.00', 'si', '4200.00', '2400.00', '141.67', 4, 5, 'activo', '2025-08-07 10:44:58'),
(8, 'Seguro Camionetas Sucre', 'Seguro para camionetas de carga con cobertura parcial.', '1150.00', 12, '41000.00', 'no', 'basica', '19000.00', 'no', '3200.00', '1700.00', '95.83', 4, 4, 'activo', '2025-08-07 10:44:58'),
(9, 'Seguro Buses Colvida', 'Seguro para transporte público con gastos legales incluidos.', '2100.00', 12, '95000.00', 'no', '24/7', '52000.00', 'no', '6200.00', '4100.00', '175.00', 5, 9, 'activo', '2025-08-07 10:44:58'),
(10, 'Seguro Transporte Liberty', 'Cobertura total para transporte público con asistencia ilimitada.', '2900.00', 12, '125000.00', 'si', 'ilimitada', '82000.00', 'si', '9300.00', '6200.00', '241.67', 5, 11, 'activo', '2025-08-07 10:44:58'),
(11, 'Seguro Moto Sucre', 'Cobertura básica para motos con robo total.', '400.00', 12, '18000.00', 'si', '24/7', '15000.00', 'no', '2300.00', '1200.00', '33.33', 1, 4, 'activo', '2025-08-07 10:44:58'),
(12, 'Seguro Vehículo Pesado Oriente', 'Seguro para maquinaria pesada con gastos médicos.', '1950.00', 12, '85000.00', 'no', '24/7', '47000.00', 'no', '5800.00', '3700.00', '162.50', 2, 10, 'activo', '2025-08-07 10:44:58'),
(13, 'Seguro Auto Pichincha', 'Cobertura para autos con auto reemplazo y asistencia 24/7.', '1400.00', 12, '54000.00', 'si', '24/7', '38000.00', 'si', '3700.00', '2300.00', '116.67', 3, 7, 'activo', '2025-08-07 10:44:58'),
(14, 'Seguro Vehículo de Carga Latina', 'Seguro para camionetas utilitarias con robo total y gastos legales.', '1650.00', 12, '61000.00', 'si', 'ilimitada', '31000.00', 'si', '4300.00', '2500.00', '137.50', 4, 8, 'activo', '2025-08-07 10:44:58'),
(15, 'Seguro Transporte Hispana', 'Seguro para buses con cobertura integral y asistencia ilimitada.', '2750.00', 12, '115000.00', 'si', 'ilimitada', '78000.00', 'si', '8800.00', '6000.00', '229.17', 5, 5, 'activo', '2025-08-07 10:44:58'),
(16, 'Seguro Motos Pichincha Plus', 'Cobertura completa para motos con asistencia ilimitada y gastos médicos.', '550.00', 12, '28000.00', 'si', 'ilimitada', '23000.00', 'si', '3700.00', '2200.00', '45.83', 1, 7, 'activo', '2025-08-07 10:45:47'),
(17, 'Seguro Motos Latina Protegida', 'Protección básica contra robo y colisión para motos.', '330.00', 12, '16000.00', 'si', '24/7', '12000.00', 'no', '2100.00', '1100.00', '27.50', 1, 8, 'activo', '2025-08-07 10:45:47'),
(18, 'Seguro Pesado Rimac Total', 'Cobertura integral para vehículos pesados con asistencia ilimitada.', '2300.00', 12, '115000.00', 'si', 'ilimitada', '76000.00', 'si', '7800.00', '5300.00', '191.67', 2, 12, 'activo', '2025-08-07 10:45:47'),
(19, 'Seguro Pesado Seguros Latitud', 'Protección estándar para camiones y maquinaria.', '1600.00', 12, '85000.00', 'no', '24/7', '42000.00', 'no', '5600.00', '3300.00', '133.33', 2, 1, 'activo', '2025-08-07 10:45:47'),
(20, 'Seguro Autos Hispana Max', 'Cobertura para vehículos livianos con asistencia 24/7 y robo total.', '1450.00', 12, '56000.00', 'si', '24/7', '39000.00', 'si', '3800.00', '2400.00', '120.83', 3, 5, 'activo', '2025-08-07 10:45:47'),
(21, 'Seguro Autos Confianza Plus', 'Seguro para autos con auto reemplazo y gastos legales.', '1250.00', 12, '48000.00', 'si', 'ilimitada', '34000.00', 'si', '3600.00', '2100.00', '104.17', 3, 6, 'activo', '2025-08-07 10:45:47'),
(22, 'Seguro Carga Rimac Secure', 'Cobertura para furgonetas y camionetas con asistencia ilimitada.', '1750.00', 12, '63000.00', 'si', 'ilimitada', '35000.00', 'si', '4300.00', '2600.00', '145.83', 4, 12, 'activo', '2025-08-07 10:45:47'),
(23, 'Seguro Carga CarPro Protegida', 'Seguro para vehículos de carga con cobertura básica.', '1300.00', 12, '45000.00', 'no', '24/7', '22000.00', 'no', '3500.00', '1800.00', '108.33', 4, 2, 'activo', '2025-08-07 10:45:47'),
(24, 'Seguro Transporte Seguros Sucre', 'Protección integral para transporte público con gastos médicos y legales.', '2950.00', 12, '130000.00', 'si', 'ilimitada', '85000.00', 'si', '9500.00', '6500.00', '245.83', 5, 4, 'activo', '2025-08-07 10:45:47'),
(25, 'Seguro Transporte Aseguradora Pichincha', 'Seguro para buses con asistencia 24/7 y auto reemplazo.', '2650.00', 12, '118000.00', 'si', '24/7', '79000.00', 'si', '8700.00', '5900.00', '220.83', 5, 7, 'activo', '2025-08-07 10:45:47'),
(26, 'TranSeguros', 'El mejor seguro para tu vehiculo.', '2400.00', 12, '2000.00', 'si', 'basica', '10000.00', 'no', NULL, '2000.00', '200.00', 5, 11, 'activo', '2025-08-07 10:49:09');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `roles`
--

CREATE TABLE `roles` (
  `id` int(11) NOT NULL,
  `nombre` varchar(45) NOT NULL,
  `descripcion` text,
  `estado` enum('activo','inactivo') NOT NULL DEFAULT 'activo',
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `roles`
--

INSERT INTO `roles` (`id`, `nombre`, `descripcion`, `estado`, `fecha_creacion`) VALUES
(1, 'admin', NULL, 'activo', '2025-08-07 07:30:39'),
(2, 'asesor', NULL, 'activo', '2025-08-07 07:30:39'),
(3, 'vendedor', NULL, 'activo', '2025-08-07 07:30:39');

-- --------------------------------------------------------

--
-- Estructura de tabla para la tabla `usuarios`
--

CREATE TABLE `usuarios` (
  `id_usuario` int(11) NOT NULL,
  `correo` varchar(100) NOT NULL,
  `contrasena` varchar(255) NOT NULL,
  `nombre` varchar(100) NOT NULL,
  `cedula` varchar(10) NOT NULL,
  `rol_id` int(11) NOT NULL,
  `ultimo_login` datetime DEFAULT NULL,
  `estado` enum('activo','inactivo') NOT NULL DEFAULT 'activo',
  `fecha_creacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Volcado de datos para la tabla `usuarios`
--

INSERT INTO `usuarios` (`id_usuario`, `correo`, `contrasena`, `nombre`, `cedula`, `rol_id`, `ultimo_login`, `estado`, `fecha_creacion`) VALUES
(1, 'admin@sistema.com', '$2y$10$YrA4YVCvUovZOYmVy6rNDuq8iUR3/dYnPCugPjKYJhsDNIL/WQUfm', 'Danna Andrade', '1722651567', 1, '2025-08-08 15:22:56', 'activo', '2025-08-07 07:30:39'),
(2, 'zaith@sistema.com', '$2y$10$P2dCDUaHYhFJsxK8hdBPHuw2lV/06fkmPLRvHNAemL.mS0s7gIdia', 'Zaith Manangon', '1111111111', 2, '2025-08-08 15:49:56', 'activo', '2025-08-07 07:30:39'),
(3, 'jean@sistema.com', '$2y$10$An9mQo.5qbhbKwpRLyjxOukoGmdhNmCrrBPTdYu.Qpfm17k5JYFZm', 'Jeancarlo Santi', '2222222221', 3, '2025-08-08 15:50:08', 'activo', '2025-08-07 07:30:39'),
(4, 'ariel@sistema.com', '12345678', 'Ariel Llumiquinga', '1212121212', 3, NULL, 'inactivo', '2025-08-07 22:59:00'),
(5, 'zuli@sistema.com', '$2y$10$0hNOKL0MtbdhBgpiddWXpu9tjEb41eFZj/Sds0seDFPVlRrEReBzi', 'Zuli Lucio', '1726651567', 1, NULL, 'activo', '2025-08-07 22:40:07'),
(6, 'juan@sistema.com', '$2y$10$NH98AxUUvdOqskRxPomzJe1QfzmdGXS7o66qr0Xnr6VNd0uzL4cM2', 'Juan Erazo', '0147852369', 2, NULL, 'activo', '2025-08-08 15:10:46');

--
-- Disparadores `usuarios`
--
DELIMITER $$
CREATE TRIGGER `tr_usuario_insert` AFTER INSERT ON `usuarios` FOR EACH ROW BEGIN
  INSERT INTO `sistema_cotizaciones`.`auditoria` 
  (`idUsuario`, `Aud_accion`, `Aud_tabla`, `Aud_descripcion`, `Aud_IP`)
  VALUES 
  (NEW.id_usuario, 'INSERT', 'usuarios', CONCAT('Nuevo usuario creado: ', NEW.correo), '127.0.0.1');
END
$$
DELIMITER ;

--
-- Índices para tablas volcadas
--

--
-- Indices de la tabla `auditoria`
--
ALTER TABLE `auditoria`
  ADD PRIMARY KEY (`idAuditoria`),
  ADD KEY `fk_auditoria_usuario_idx` (`idUsuario`),
  ADD KEY `idx_auditoria_fecha` (`Aud_fecha`),
  ADD KEY `idx_auditoria_tabla` (`Aud_tabla`);

--
-- Indices de la tabla `categoria`
--
ALTER TABLE `categoria`
  ADD PRIMARY KEY (`idcategoria`),
  ADD UNIQUE KEY `Cat_nombre_UNIQUE` (`Cat_nombre`);

--
-- Indices de la tabla `cliente`
--
ALTER TABLE `cliente`
  ADD PRIMARY KEY (`idCliente`),
  ADD UNIQUE KEY `Cli_cedula_UNIQUE` (`Cli_cedula`);

--
-- Indices de la tabla `cotizacion`
--
ALTER TABLE `cotizacion`
  ADD PRIMARY KEY (`idCotizacion`),
  ADD KEY `fk_cotizacion_cliente_idx` (`idCliente`),
  ADD KEY `fk_cotizacion_usuario_idx` (`idUsuario`);

--
-- Indices de la tabla `detalle_cotizacion`
--
ALTER TABLE `detalle_cotizacion`
  ADD PRIMARY KEY (`idDetalle_Cotizacion`),
  ADD KEY `fk_detalle_cotizacion_idx` (`idCotizacion`),
  ADD KEY `fk_detalle_producto_idx` (`idProducto`);

--
-- Indices de la tabla `empresas_proveedora`
--
ALTER TABLE `empresas_proveedora`
  ADD PRIMARY KEY (`idEmpresas_Proveedora`),
  ADD UNIQUE KEY `Emp_ruc_UNIQUE` (`Emp_ruc`),
  ADD UNIQUE KEY `Emp_correo_UNIQUE` (`Emp_correo`);

--
-- Indices de la tabla `historial_cotizacion`
--
ALTER TABLE `historial_cotizacion`
  ADD PRIMARY KEY (`idHistorial_Cotizacion`),
  ADD KEY `fk_historial_cotizacion_idx` (`idCotizacion`),
  ADD KEY `fk_historial_usuario_idx` (`idUsuario`);

--
-- Indices de la tabla `producto`
--
ALTER TABLE `producto`
  ADD PRIMARY KEY (`idproducto`),
  ADD KEY `fk_producto_categoria_idx` (`idCategoria`),
  ADD KEY `fk_producto_empresa_idx` (`idEmpresaProveedora`);

--
-- Indices de la tabla `roles`
--
ALTER TABLE `roles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nombre_UNIQUE` (`nombre`);

--
-- Indices de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD PRIMARY KEY (`id_usuario`),
  ADD UNIQUE KEY `correo_UNIQUE` (`correo`),
  ADD UNIQUE KEY `cedula_UNIQUE` (`cedula`),
  ADD KEY `fk_usuarios_roles_idx` (`rol_id`);

--
-- AUTO_INCREMENT de las tablas volcadas
--

--
-- AUTO_INCREMENT de la tabla `auditoria`
--
ALTER TABLE `auditoria`
  MODIFY `idAuditoria` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `categoria`
--
ALTER TABLE `categoria`
  MODIFY `idcategoria` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;

--
-- AUTO_INCREMENT de la tabla `cliente`
--
ALTER TABLE `cliente`
  MODIFY `idCliente` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- AUTO_INCREMENT de la tabla `cotizacion`
--
ALTER TABLE `cotizacion`
  MODIFY `idCotizacion` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `detalle_cotizacion`
--
ALTER TABLE `detalle_cotizacion`
  MODIFY `idDetalle_Cotizacion` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `empresas_proveedora`
--
ALTER TABLE `empresas_proveedora`
  MODIFY `idEmpresas_Proveedora` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=15;

--
-- AUTO_INCREMENT de la tabla `historial_cotizacion`
--
ALTER TABLE `historial_cotizacion`
  MODIFY `idHistorial_Cotizacion` int(11) NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT de la tabla `producto`
--
ALTER TABLE `producto`
  MODIFY `idproducto` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=27;

--
-- AUTO_INCREMENT de la tabla `roles`
--
ALTER TABLE `roles`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- AUTO_INCREMENT de la tabla `usuarios`
--
ALTER TABLE `usuarios`
  MODIFY `id_usuario` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- Restricciones para tablas volcadas
--

--
-- Filtros para la tabla `auditoria`
--
ALTER TABLE `auditoria`
  ADD CONSTRAINT `fk_auditoria_usuario` FOREIGN KEY (`idUsuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Filtros para la tabla `cotizacion`
--
ALTER TABLE `cotizacion`
  ADD CONSTRAINT `fk_cotizacion_cliente` FOREIGN KEY (`idCliente`) REFERENCES `cliente` (`idCliente`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_cotizacion_usuario` FOREIGN KEY (`idUsuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Filtros para la tabla `detalle_cotizacion`
--
ALTER TABLE `detalle_cotizacion`
  ADD CONSTRAINT `fk_detalle_cotizacion` FOREIGN KEY (`idCotizacion`) REFERENCES `cotizacion` (`idCotizacion`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_detalle_producto` FOREIGN KEY (`idProducto`) REFERENCES `producto` (`idproducto`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Filtros para la tabla `historial_cotizacion`
--
ALTER TABLE `historial_cotizacion`
  ADD CONSTRAINT `fk_historial_cotizacion` FOREIGN KEY (`idCotizacion`) REFERENCES `cotizacion` (`idCotizacion`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_historial_usuario` FOREIGN KEY (`idUsuario`) REFERENCES `usuarios` (`id_usuario`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Filtros para la tabla `producto`
--
ALTER TABLE `producto`
  ADD CONSTRAINT `fk_producto_categoria` FOREIGN KEY (`idCategoria`) REFERENCES `categoria` (`idcategoria`) ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT `fk_producto_empresa` FOREIGN KEY (`idEmpresaProveedora`) REFERENCES `empresas_proveedora` (`idEmpresas_Proveedora`) ON DELETE RESTRICT ON UPDATE CASCADE;

--
-- Filtros para la tabla `usuarios`
--
ALTER TABLE `usuarios`
  ADD CONSTRAINT `fk_usuarios_roles` FOREIGN KEY (`rol_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

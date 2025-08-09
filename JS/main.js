/**
 * =================================================================================
 * CS ENSIGNA - main.js (Versión Modular)
 * Orquestador principal de la aplicación.
 * Este script importa y ejecuta la lógica necesaria para las páginas autenticadas.
 * =================================================================================
 */

// Importaciones de Módulos de Funcionalidad Central
import { checkAuth, initializeLogoutButtons } from "./auth.js";
import { manageSidebarVisibility, setActiveMenuItem } from "./sidebar.js";
import { populateProfileData } from "./profile.js";
import { controlElementVisibility } from "./ui.js";
import { SessionManager } from "./session-manager.js";

// Importaciones de Lógica Específica de cada Página
import { loadAdminDashboard } from "./admin_dashboard.js";
import { loadGestionUsuarios } from "./gestion_usuario.js";
import { loadAsesorDashboard } from "./asesor_dashboard.js";
import { loadVendedorDashboard } from "./vendedor_dashboard.js";
import { loadGestionClientes } from "./gestion_clientes.js";
import { loadGestionEmpresas } from "./gestion_empresas.js";
import { loadVisualizarProductos } from "./vizualizar_productos.js";
import { loadProductosAsegurables } from "./productos_asegurables.js";
import { loadReportesAuditoria } from "./reportes_autidorias.js";
import { loadSupervisarCotizaciones } from "./supervisar_cotizaciones.js";
import { loadMiPerfil } from "./miPerfil.js";
/**
 * Función para poblar los datos del perfil del usuario en la barra lateral.
 * @param {string} userName - Nombre del usuario.
 * @param {string} userRole - Rol del usuario.
 */

/**
 * --- ORQUESTADOR PARA PÁGINAS AUTENTICADAS ---
 * Se ejecuta cuando el contenido del DOM está completamente cargado.
 */
document.addEventListener("DOMContentLoaded", () => {
  const isLoginPage =
    window.location.pathname.includes("index.html") ||
    window.location.pathname.endsWith("/") ||
    window.location.pathname.includes("login.php");

  if (!isLoginPage) {
    initAuthenticatedPage();
  }
});

/**
 * Función principal que inicializa cada página protegida.
 */
function initAuthenticatedPage() {
  // 1. Verificar si el usuario está autenticado. Si no, la función lo redirige.
  const session = checkAuth();
  if (!session) return; // Detiene la ejecución si no hay sesión.

  const { userRole, userName } = session;

  // 2. Inicializar el sistema de control de sesiones
  if (!window.sessionManager) {
    window.sessionManager = new SessionManager(5); // 5 minutos de inactividad
    console.log('Sistema de control de sesiones iniciado - Timeout: 5 minutos');
  }

  // 3. Lógica de UI común a todas las páginas autenticadas
  manageSidebarVisibility(userRole);
  setActiveMenuItem();
  initializeLogoutButtons();
  populateProfileData(userName, userRole);
  controlElementVisibility(userRole);

  // 3. Ejecutar la lógica específica de la página actual
  runPageSpecificLogic();
}

/**
 * Enrutador simple que ejecuta la función correcta basándose en la URL.
 */
function runPageSpecificLogic() {
  const path = window.location.pathname;

  if (path.includes("admin_dashboard.html")) loadAdminDashboard();
  else if (path.includes("gestion_usuarios.html")) loadGestionUsuarios();
  else if (path.includes("asesor_dashboard.html")) loadAsesorDashboard();
  else if (path.includes("vendedor_dashboard.html")) loadVendedorDashboard();
  else if (path.includes("gestion_clientes.html")) loadGestionClientes();
  else if (path.includes("gestion_empresas.html")) loadGestionEmpresas();
  else if (path.includes("visualizar_productos.html"))
    loadVisualizarProductos();
  else if (path.includes("productos_asegurables.html"))
    loadProductosAsegurables();
  else if (path.includes("reportes_auditoria.html")) loadReportesAuditoria();
  else if (path.includes("supervisar_cotizaciones.html"))
    loadSupervisarCotizaciones();
  else if (path.includes("miPerfil.html")) loadMiPerfil();
}

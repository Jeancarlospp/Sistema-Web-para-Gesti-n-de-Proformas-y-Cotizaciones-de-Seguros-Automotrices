/**
 * =================================================================================
 * CS ENSIGNA - main.js (Versión Modular y Segura)
 * Orquestador principal de las páginas protegidas de la aplicación.
 * 
 * Responsabilidades:
 * 1.  Implementar defensa contra el caché de retroceso/avance del navegador.
 * 2.  Verificar la autenticación del usuario contra el servidor antes de cargar cualquier página.
 * 3.  Sincronizar el cierre de sesión entre múltiples pestañas del navegador.
 * 4.  Inicializar el gestor de inactividad para cerrar sesión automáticamente.
 * 5.  Configurar la interfaz de usuario común (sidebar, perfil, botones de logout).
 * 6.  Cargar la lógica específica de JavaScript para la página que se está visitando.
 * =================================================================================
 */

// --- Importaciones de Módulos de Funcionalidad Central ---
import { checkAuth, initializeLogoutButtons } from "./auth.js";
import { manageSidebarVisibility, setActiveMenuItem } from "./sidebar.js";
import { populateProfileData } from "./profile.js";
import { controlElementVisibility } from "./ui.js";
import { SessionManager } from "./session_manager.js"; // Asegúrate de que el nombre del archivo sea session-manager.js

// --- Importaciones de Lógica Específica de cada Página ---
import { loadAdminDashboard } from "./admin_dashboard.js";
import { loadGestionUsuarios } from "./gestion_usuario.js";
import { loadAsesorDashboard } from "./asesor_dashboard.js";
import { loadGestionClientes } from "./gestion_clientes.js";
import { loadGestionEmpresas } from "./gestion_empresas.js";
import { loadVisualizarProductos } from "./vizualizar_productos.js";
import { loadProductosAsegurables } from "./productos_asegurables.js";
import { loadReportesAuditoria } from "./reportes_autidorias.js";
import { loadSupervisarCotizaciones } from "./supervisar_cotizaciones.js";
import { loadMiPerfil } from "./miPerfil.js";

/**
 * --- ORQUESTADOR PRINCIPAL ---
 * Se ejecuta cuando el contenido del DOM está completamente cargado.
 * Determina si se está en la página de login o en una página protegida.
 */
document.addEventListener("DOMContentLoaded", () => {
  const path = window.location.pathname;
  const isLoginPage = path.includes("index.html") || path.endsWith("/") || !path.includes("/html/");

  if (isLoginPage) {
    // Si estamos en la página de login, nos aseguramos de que no haya sesión local.
    // Esto previene conflictos si un usuario vuelve al login sin cerrar sesión.
    localStorage.clear();
  } else {
    // Si es cualquier otra página, iniciamos el proceso de validación y carga.
    initAuthenticatedPage();
  }
});

/**
 * Función principal que inicializa cada página protegida de la aplicación.
 * Realiza todas las comprobaciones de seguridad antes de ejecutar la lógica de la página.
 */
async function initAuthenticatedPage() {
  
  // ===== CAPA 2: DEFENSA CONTRA EL CACHÉ DE RETROCESO/AVANCE =====
  // Este evento se dispara CADA VEZ que la página se vuelve visible.
  window.addEventListener('pageshow', function(event) {
    // La propiedad 'persisted' es true si la página se cargó desde el bfcache.
    if (event.persisted) {
      console.log("Página cargada desde caché de retroceso/avance. Forzando recarga.");
      // Forzamos una recarga completa desde el servidor para re-validar la sesión.
      window.location.reload(); 
    }
  });

  // --- 1. VERIFICACIÓN DE SESIÓN (CLIENTE + SERVIDOR) ---
  // Esta es la barrera de seguridad más importante. `checkAuth` es asíncrono.
  // Si la sesión no es válida, `checkAuth` se encargará de redirigir al login.
  const session = await checkAuth();
  if (!session) {
    // Detiene toda ejecución adicional si no hay una sesión válida.
    return;
  }

  const { userRole, userName } = session;

  // --- 2. SINCRONIZACIÓN DE CIERRE DE SESIÓN ENTRE PESTAÑAS ---
  // Escucha cambios en localStorage. Si 'userRole' se elimina en otra pestaña,
  // esta pestaña también se cerrará.
  window.addEventListener('storage', (event) => {
    if (event.key === 'userRole' && event.newValue === null) {
      console.warn("Cierre de sesión detectado desde otra pestaña. Redirigiendo...");
      // Usamos replace() para una mejor seguridad, eliminando la página del historial.
      window.location.replace("../index.html");
    }
  });

  // --- 3. INICIALIZACIÓN DEL GESTOR DE INACTIVIDAD ---
  // Solo se crea una instancia por sesión de la página.
  if (!window.sessionManager) {
    // Inicia un temporizador de 15 minutos de inactividad.
    window.sessionManager = new SessionManager(15);
  }

  // --- 4. LÓGICA DE UI COMÚN (se ejecuta solo si la sesión es válida) ---
  manageSidebarVisibility(userRole);
  setActiveMenuItem();
  initializeLogoutButtons();
  populateProfileData(userName, userRole);
  controlElementVisibility(userRole);

  // --- 5. EJECUTAR LA LÓGICA ESPECÍFICA DE LA PÁGINA ACTUAL ---
  runPageSpecificLogic();
}

/**
 * Enrutador simple del lado del cliente.
 * Ejecuta la función de inicialización correcta basándose en la URL de la página actual.
 */
function runPageSpecificLogic() {
  const path = window.location.pathname;

  if (path.includes("admin_dashboard.html")) {
    loadAdminDashboard();
  } else if (path.includes("gestion_usuarios.html")) {
    loadGestionUsuarios();
  } else if (path.includes("asesor_dashboard.html")) {
    loadAsesorDashboard();
  } else if (path.includes("vendedor_dashboard.html")) {
    loadAsesorDashboard(); // Usar la misma funcionalidad que el asesor
  } else if (path.includes("gestion_clientes.html")) {
    loadGestionClientes();
  } else if (path.includes("gestion_empresas.html")) {
    loadGestionEmpresas();
  } else if (path.includes("visualizar_productos.html")) {
    loadVisualizarProductos();
  } else if (path.includes("productos_asegurables.html")) {
    loadProductosAsegurables();
  } else if (path.includes("reportes_auditoria.html")) {
    loadReportesAuditoria();
  } else if (path.includes("supervisar_cotizaciones.html")) {
    loadSupervisarCotizaciones();
  } else if (path.includes("miPerfil.html")) {
    loadMiPerfil();
  } else {
    console.warn(`No se encontró un módulo de JS para la página actual: ${path}`);
  }
}
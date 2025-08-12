// js/auth.js

/**
 * Verifica si existe la información del usuario en localStorage Y si la sesión del servidor es válida.
 * Si alguna de las dos validaciones falla, limpia los datos locales y redirige al login.
 * @returns {Promise<object|null>} Una promesa que resuelve a un objeto con { userRole, userName } o null si no hay sesión.
 */
export async function checkAuth() {
  const userRole = localStorage.getItem("userRole");
  const userName = localStorage.getItem("userName");

  // 1. Verificación rápida del lado del cliente. Si no hay datos, no hay sesión.
  if (!userRole || !userName) {
    console.error(
      "Acceso denegado. No se encontró información local de la sesión."
    );
    window.location.href = "../index.html";
    return null;
  }

  // 2. Verificación del lado del servidor. La más importante.
  try {
    const response = await fetch("../php/session_check.php");
    if (!response.ok) {
      throw new Error("Error de red al verificar la sesión.");
    }
    const sessionStatus = await response.json();

    if (!sessionStatus.valid) {
      console.error(
        "Acceso denegado. La sesión del servidor es inválida o ha expirado."
      );
      localStorage.clear(); // Limpiamos cualquier dato local inconsistente.
      window.location.href = "../index.html";
      return null;
    }

    // Si ambas verificaciones pasan, la sesión es válida.
    console.log("Autenticación verificada con éxito.");
    return { userRole, userName };
  } catch (error) {
    console.error("Error crítico durante la verificación de la sesión:", error);
    localStorage.clear();
    window.location.href = "../index.html";
    return null;
  }
}

/**
 * Asigna la funcionalidad de logout a los botones de cerrar sesión.
 */
export function initializeLogoutButtons() {
  const setupLogout = (buttonId) => {
    const btn = document.getElementById(buttonId);
    if (btn) {
      btn.addEventListener("click", (e) => {
        e.preventDefault();

        // Notificar al servidor para que destruya la sesión PHP
        fetch("../php/logout.php").finally(() => {
          // Limpiar localStorage y redirigir, sin importar el resultado del fetch.
          localStorage.clear();
          window.location.href = "../index.html";
        });
      });
    }
  };
  setupLogout("logout-btn-sidebar");
  setupLogout("logout-btn");
}

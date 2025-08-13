/**
 * =================================================================================
 * js/login.js - Lógica para la Página de Inicio de Sesión (index.html)
 * =================================================================================
 *
 * Responsabilidades:
 * 1.  Manejar la interacción del usuario con el formulario de inicio de sesión.
 * 2.  Realizar validaciones básicas del lado del cliente.
 * 3.  Comunicarse de forma segura y asíncrona con el script `login.php`.
 * 4.  Procesar la respuesta del servidor para redirigir al usuario o mostrar errores.
 * 5.  Proporcionar retroalimentación visual clara durante todo el proceso.
 *
 */

// Se ejecuta una vez que todo el contenido HTML de la página ha sido cargado y está listo.
document.addEventListener("DOMContentLoaded", () => {
  // --- 1. SELECCIÓN DE ELEMENTOS DEL DOM ---
  // Guardamos las referencias a los elementos clave del formulario para un acceso más eficiente.
  const loginForm = document.getElementById("login-form");

  // Si el formulario principal no existe, detenemos la ejecución para evitar errores.
  if (!loginForm) {
    console.error(
      "Error crítico: El formulario con ID 'login-form' no fue encontrado en la página."
    );
    return;
  }

  const submitButton = loginForm.querySelector('button[type="submit"]');
  const originalButtonHTML = submitButton.innerHTML; // Guardamos el estado original del botón.

  // Creación dinámica de un contenedor para mostrar mensajes de error de forma limpia.
  let errorContainer = document.getElementById("login-error-message");
  if (!errorContainer) {
    errorContainer = document.createElement("div");
    errorContainer.id = "login-error-message";
    errorContainer.className = "alert alert-danger mt-4 d-none"; // Usa clases de Bootstrap; inicia oculto.
    errorContainer.setAttribute("role", "alert");
    // Inserta el contenedor de error justo antes del botón de "Ingresar".
    submitButton.parentNode.insertBefore(errorContainer, submitButton);
  }

  // --- 2. MANEJADOR PRINCIPAL DEL EVENTO 'SUBMIT' ---
  loginForm.addEventListener("submit", async (event) => {
    // Prevenimos el comportamiento por defecto del formulario (que recargaría la página).
    event.preventDefault();

    clearError(); // Ocultamos cualquier mensaje de error de intentos anteriores.
    setButtonState("loading"); // Ponemos el botón en estado de "cargando".

    // Obtenemos los valores de los campos del formulario.
    const correo = loginForm.querySelector('input[name="correo"]').value.trim();
    const contrasena = loginForm.querySelector(
      'input[name="contrasena"]'
    ).value;

    // Validación del lado del cliente para una respuesta inmediata.
    if (!correo || !contrasena) {
      displayError("Por favor, ingrese su correo y contraseña.");
      setButtonState("default"); // Restauramos el botón.
      return;
    }

    // --- 3. LLAMADA A LA API (BACKEND) CON MANEJO DE ERRORES ---
    try {
      // ===== ESTA ES LA RUTA CORRECTA Y PORTABLE =====
      // Desde la carpeta /js/, la ruta '../' sube un nivel a la raíz del proyecto,
      // donde se encuentra 'login.php'. Esto funcionará en cualquier máquina.
      const response = await fetch("./login.php", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ correo, contrasena }),
      });
      // ===============================================

      const result = await response.json();

      if (response.ok && result.success) {
        handleSuccessfulLogin(result.user);
      } else {
        displayError(result.message || "Ocurrió un error inesperado.");
        setButtonState("default");
      }
    } catch (error) {
      console.error("Error de conexión o de formato de respuesta:", error);
      displayError(
        "No se pudo conectar con el servidor. Verifique la ruta y que el servidor esté activo."
      );
      setButtonState("default");
    }
  });

  // --- 4. FUNCIONES AUXILIARES ---

  /**
   * Procesa un inicio de sesión exitoso guardando los datos y redirigiendo al usuario.
   * @param {object} userData - Objeto que contiene `userName` y `userRole`.
   */
  function handleSuccessfulLogin(userData) {
    // Guardamos los datos clave en el almacenamiento local. main.js los leerá en las páginas protegidas.
    localStorage.setItem("userName", userData.userName);
    localStorage.setItem("userRole", userData.userRole);

    // Mapeo de roles a las URLs de sus respectivos dashboards.
    const roleRedirects = {
      Administrador: "html/admin_dashboard.html",
      Asesor: "html/asesor_dashboard.html",
      Vendedor: "html/asesor_dashboard.html", // Vendedor comparte dashboard con Asesor.
    };
    const redirectUrl = roleRedirects[userData.userRole];

    // Verificación de seguridad por si el backend devuelve un rol no esperado.
    if (!redirectUrl) {
      displayError("Rol de usuario no reconocido. Contacte al administrador.");
      setButtonState("default");
      return;
    }

    // Damos retroalimentación visual de éxito antes de redirigir.
    setButtonState("success");

    // Redirigimos después de un breve momento para que el usuario vea el mensaje de éxito.
    setTimeout(() => {
      window.location.href = redirectUrl;
    }, 1000);
  }

  /**
   * Controla el estado visual y funcional del botón de envío.
   * @param {'default'|'loading'|'success'} state - El estado deseado para el botón.
   */
  function setButtonState(state) {
    submitButton.disabled = state === "loading" || state === "success";

    switch (state) {
      case "loading":
        submitButton.innerHTML = `<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Ingresando...`;
        break;
      case "success":
        submitButton.classList.remove("btn-primary");
        submitButton.classList.add("btn-success");
        submitButton.innerHTML = `<i class="bi bi-check-circle"></i> ¡Éxito! Redirigiendo...`;
        break;
      case "default":
      default:
        submitButton.innerHTML = originalButtonHTML;
        submitButton.classList.remove("btn-success");
        submitButton.classList.add("btn-primary");
        break;
    }
  }

  /**
   * Muestra un mensaje de error en el contenedor designado.
   * @param {string} message - El mensaje de error a mostrar.
   */
  function displayError(message) {
    errorContainer.textContent = message;
    errorContainer.classList.remove("d-none"); // Hacemos visible el contenedor de error.
  }

  /**
   * Oculta y limpia el contenedor de errores.
   */
  function clearError() {
    if (errorContainer) {
      errorContainer.textContent = "";
      errorContainer.classList.add("d-none");
    }
  }
});

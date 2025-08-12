/**
 * js/miPerfil.js
 * Lógica para la página de Mi Perfil.
 */

import {
  validarCedulaEcuatoriana,
  agregarValidacionCedula,
} from "./validaciones.js";

// --- FUNCIÓN PARA POBLAR LOS FORMULARIOS CON LOS DATOS DEL USUARIO ---
function populateProfileForms(userData) {
  // Poblar la tarjeta de perfil
  document.getElementById("profile-card-name").textContent =
    userData.nombre || "";
  document.getElementById("profile-card-role").textContent = userData.rol || "";
  document.getElementById("profile-card-email").textContent =
    userData.correo || "";

  // Poblar el formulario de edición de perfil
  document.getElementById("form-profile-id").value = userData.id_usuario || "";
  document.getElementById("form-profile-role").value = userData.rol || "";
  document.getElementById("form-profile-name").value = userData.nombre || "";
  document.getElementById("form-profile-cedula").value = userData.cedula || "";
  document.getElementById("form-profile-email").value = userData.correo || "";
}

// --- FUNCIÓN PARA OBTENER LOS DATOS DEL USUARIO LOGUEADO DESDE LA API ---
async function fetchCurrentUser() {
  try {
    // Asumimos que la API de usuarios, sin parámetros, devuelve el usuario de la sesión actual
    const response = await fetch("../php/usuarios_api.php?me=1"); // Añadimos ?me=1 para esta lógica
    if (!response.ok)
      throw new Error("No se pudo obtener la información del usuario.");

    const userData = await response.json();

    if (userData && userData.id_usuario) {
      populateProfileForms(userData);
    } else {
      throw new Error("La respuesta de la API no contiene datos del usuario.");
    }
  } catch (error) {
    console.error("Error al cargar los datos del perfil:", error);
    alert(
      "No se pudieron cargar los datos de tu perfil. Intenta recargar la página."
    );
  }
}

// --- FUNCIÓN PRINCIPAL EXPORTADA ---
export function loadMiPerfil() {
  console.log("Módulo de Mi Perfil cargado.");

  // Elementos del DOM
  const formEditProfile = document.getElementById("form-edit-profile");
  const formChangePassword = document.getElementById("form-change-password");

  // 1. Cargar los datos del usuario actual en los formularios
  fetchCurrentUser();

  // 2. Manejar el envío del formulario para editar el perfil
  formEditProfile.addEventListener("submit", async (event) => {
    event.preventDefault();

    // Validar cédula ecuatoriana antes del envío
    const cedula = document.getElementById("form-profile-cedula").value;
    if (!validarCedulaEcuatoriana(cedula)) {
      alert("Por favor, ingrese una cédula ecuatoriana válida");
      return;
    }

    const profileData = {
      action: "update_profile", // Acción específica para la API
      id: document.getElementById("form-profile-id").value,
      nombre: document.getElementById("form-profile-name").value,
      cedula: cedula,
      correo: document.getElementById("form-profile-email").value,
    };

    try {
      const response = await fetch("../php/usuarios_api.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileData),
      });
      const result = await response.json();

      if (result.success) {
        // Actualizar el nombre en el localStorage y en la cabecera
        localStorage.setItem("userName", profileData.nombre);
        document.getElementById("profile-name").textContent =
          profileData.nombre;
        document.getElementById("profile-greeting-name").textContent =
          profileData.nombre.split(" ")[0];

        alert("¡Perfil actualizado con éxito!");
        fetchCurrentUser(); // Recargar datos en la tarjeta
      } else {
        throw new Error(result.message || "Error desconocido.");
      }
    } catch (error) {
      alert("Error al actualizar el perfil: " + error.message);
    }
  });

  // 3. Manejar el envío del formulario para cambiar la contraseña
  formChangePassword.addEventListener("submit", async (event) => {
    event.preventDefault();

    const currentPassword = document.getElementById("current-password").value;
    const newPassword = document.getElementById("new-password").value;
    const confirmPassword = document.getElementById("confirm-password").value;

    if (newPassword !== confirmPassword) {
      alert("La nueva contraseña y su confirmación no coinciden.");
      return;
    }

    const passwordData = {
      action: "change_password",
      currentPassword: currentPassword,
      newPassword: newPassword,
    };

    try {
      const response = await fetch("../php/usuarios_api.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordData),
      });
      const result = await response.json();

      if (result.success) {
        alert("¡Contraseña actualizada con éxito!");
        formChangePassword.reset();
      } else {
        throw new Error(result.message || "Error desconocido.");
      }
    } catch (error) {
      alert("Error al cambiar la contraseña: " + error.message);
    }
  });

  // Agregar validación al campo de cédula
  agregarValidacionCedula("form-profile-cedula");
}

// /js/profile.js

/**
 * Rellena la información del perfil del usuario en el header.
 * @param {string} name El nombre del usuario.
 * @param {string} role El rol del usuario.
 */
export function populateProfileData(name, role) {
  const profileNameEl = document.getElementById("profile-name");
  const profileRoleEl = document.getElementById("profile-role");
  const greetingNameEl = document.getElementById("profile-greeting-name");

  if (profileNameEl) profileNameEl.textContent = name;
  if (profileRoleEl) profileRoleEl.textContent = role;
  if (greetingNameEl) greetingNameEl.textContent = name.split(" ")[0];
}

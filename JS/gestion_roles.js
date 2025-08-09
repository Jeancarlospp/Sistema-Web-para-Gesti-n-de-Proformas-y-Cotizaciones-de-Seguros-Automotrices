document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("add-role-form");
  const btnSaveRole = document.getElementById("btn-save-role");
  const selectRole = document.getElementById("add-userRole");

  // === Guardar nuevo rol ===
  if (form && btnSaveRole) {
    btnSaveRole.addEventListener("click", async () => {
      const roleName = document.getElementById("add-roleName").value.trim();
      const permisosSeleccionados = Array.from(
        form.querySelectorAll('input[name="permisos[]"]:checked')
      ).map(cb => cb.value);

      if (!roleName) {
        alert("Ingrese el nombre del rol.");
        return;
      }
      if (permisosSeleccionados.length === 0) {
        alert("Seleccione al menos un permiso.");
        return;
      }

      const data = {
        nombre: roleName,
        permisos: permisosSeleccionados
      };

      try {
        const response = await fetch("../php/roles_api.php", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        const result = await response.json();
        if (result.success) {
          alert("Rol creado correctamente.");
          form.reset();
          document.getElementById("addRoleModal").querySelector(".btn-close").click();
          // Aquí puedes recargar la lista de roles si lo necesitas
        } else {
          alert(result.message || "Error al crear el rol.");
        }
      } catch (error) {
        alert("Error de conexión con el servidor.");
        console.error(error);
      }
    });
  }

  // === Cargar roles en el select de usuarios ===
  if (selectRole) {
    fetch("../php/roles_api.php?action=get_roles")
      .then(response => response.json())
      .then(data => {
        selectRole.innerHTML = ""; // Limpia opciones
        data.forEach(role => {
          const option = document.createElement("option");
          option.value = role.id;
          option.textContent = role.nombre;
          selectRole.appendChild(option);
        });
      })
      .catch(error => {
        console.error("Error cargando roles:", error);
      });
  }

  
});

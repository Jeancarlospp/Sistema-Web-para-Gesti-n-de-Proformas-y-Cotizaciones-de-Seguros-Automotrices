/**
 * Funciones de validación para cédula ecuatoriana y RUC
 */

/**
 * Valida si una cédula ecuatoriana es válida
 * @param {string} cedula - Número de cédula a validar
 * @returns {boolean} - True si es válida, false si no
 */
export function validarCedulaEcuatoriana(cedula) {
  // Eliminar espacios y caracteres no numéricos
  cedula = cedula.replace(/\D/g, "");

  // Verificar que tenga exactamente 10 dígitos
  if (cedula.length !== 10) {
    return false;
  }

  // Verificar que los dos primeros dígitos correspondan a una provincia válida (01-24)
  const provincia = parseInt(cedula.substring(0, 2));
  if (provincia < 1 || provincia > 24) {
    return false;
  }

  // Verificar que el tercer dígito sea menor a 6 (para personas naturales)
  const tercerDigito = parseInt(cedula.substring(2, 3));
  if (tercerDigito >= 6) {
    return false;
  }

  // Algoritmo de validación del dígito verificador
  const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
  let suma = 0;

  for (let i = 0; i < coeficientes.length; i++) {
    let valor = parseInt(cedula.charAt(i)) * coeficientes[i];
    if (valor >= 10) {
      valor = Math.floor(valor / 10) + (valor % 10);
    }
    suma += valor;
  }

  const digitoVerificador = parseInt(cedula.charAt(9));
  const residuo = suma % 10;
  const resultado = residuo === 0 ? 0 : 10 - residuo;

  return resultado === digitoVerificador;
}

/**
 * Valida si un RUC ecuatoriano es válido
 * @param {string} ruc - Número de RUC a validar
 * @returns {boolean} - True si es válido, false si no
 */
export function validarRucEcuatoriano(ruc) {
  // Eliminar espacios y caracteres no numéricos
  ruc = ruc.replace(/\D/g, "");

  // Verificar que tenga exactamente 13 dígitos
  if (ruc.length !== 13) {
    return false;
  }

  // Verificar que los dos primeros dígitos correspondan a una provincia válida (01-24)
  const provincia = parseInt(ruc.substring(0, 2));
  if (provincia < 1 || provincia > 24) {
    return false;
  }

  const tercerDigito = parseInt(ruc.substring(2, 3));

  // RUC de persona natural (tercer dígito < 6)
  if (tercerDigito < 6) {
    // Validar los primeros 10 dígitos como cédula
    const cedula = ruc.substring(0, 10);
    if (!validarCedulaEcuatoriana(cedula)) {
      return false;
    }

    // Verificar que los últimos 3 dígitos sean "001"
    return ruc.substring(10) === "001";
  }

  // RUC de sociedad privada (tercer dígito = 9)
  else if (tercerDigito === 9) {
    const coeficientes = [4, 3, 2, 7, 6, 5, 4, 3, 2];
    let suma = 0;

    for (let i = 0; i < coeficientes.length; i++) {
      suma += parseInt(ruc.charAt(i)) * coeficientes[i];
    }

    const digitoVerificador = parseInt(ruc.charAt(9));
    const residuo = suma % 11;
    const resultado = residuo === 0 ? 0 : 11 - residuo;

    if (resultado !== digitoVerificador) {
      return false;
    }

    // Verificar que los últimos 3 dígitos sean "001"
    return ruc.substring(10) === "001";
  }

  // RUC de entidad pública (tercer dígito = 6)
  else if (tercerDigito === 6) {
    const coeficientes = [3, 2, 7, 6, 5, 4, 3, 2];
    let suma = 0;

    for (let i = 0; i < coeficientes.length; i++) {
      suma += parseInt(ruc.charAt(i)) * coeficientes[i];
    }

    const digitoVerificador = parseInt(ruc.charAt(8));
    const residuo = suma % 11;
    const resultado = residuo === 0 ? 0 : 11 - residuo;

    if (resultado !== digitoVerificador) {
      return false;
    }

    // Verificar que los últimos 4 dígitos sean "0001"
    return ruc.substring(9) === "0001";
  }

  return false;
}

/**
 * Formatea un número de cédula para mostrar con guiones
 * @param {string} cedula - Número de cédula
 * @returns {string} - Cédula formateada
 */
export function formatearCedula(cedula) {
  cedula = cedula.replace(/\D/g, "");
  if (cedula.length === 10) {
    return `${cedula.substring(0, 2)}-${cedula.substring(
      2,
      9
    )}-${cedula.substring(9)}`;
  }
  return cedula;
}

/**
 * Formatea un número de RUC para mostrar con guiones
 * @param {string} ruc - Número de RUC
 * @returns {string} - RUC formateado
 */
export function formatearRuc(ruc) {
  ruc = ruc.replace(/\D/g, "");
  if (ruc.length === 13) {
    return `${ruc.substring(0, 2)}-${ruc.substring(2, 10)}-${ruc.substring(
      10
    )}`;
  }
  return ruc;
}

/**
 * Añade validación en tiempo real a un campo de cédula
 * @param {string} inputId - ID del campo de entrada
 */
export function agregarValidacionCedula(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;

  // Crear elemento para mostrar mensajes de error
  let errorElement = document.getElementById(`${inputId}-error`);
  if (!errorElement) {
    errorElement = document.createElement("div");
    errorElement.id = `${inputId}-error`;
    errorElement.className = "invalid-feedback";
    errorElement.style.display = "none";
    input.parentNode.appendChild(errorElement);
  }

  // Limitar a solo números y máximo 10 caracteres
  input.addEventListener("input", function (e) {
    let valor = e.target.value.replace(/\D/g, "");
    if (valor.length > 10) {
      valor = valor.substring(0, 10);
    }
    e.target.value = valor;

    // Validar si tiene 10 dígitos
    if (valor.length === 10) {
      if (validarCedulaEcuatoriana(valor)) {
        input.classList.remove("is-invalid");
        input.classList.add("is-valid");
        errorElement.style.display = "none";
      } else {
        input.classList.remove("is-valid");
        input.classList.add("is-invalid");
        errorElement.textContent = "La cédula ingresada no es válida";
        errorElement.style.display = "block";
      }
    } else {
      input.classList.remove("is-valid", "is-invalid");
      errorElement.style.display = "none";
    }
  });

  // Validar al perder el foco
  input.addEventListener("blur", function (e) {
    const valor = e.target.value.replace(/\D/g, "");
    if (valor.length > 0 && valor.length !== 10) {
      input.classList.add("is-invalid");
      errorElement.textContent = "La cédula debe tener exactamente 10 dígitos";
      errorElement.style.display = "block";
    }
  });
}

/**
 * Añade validación en tiempo real a un campo de RUC
 * @param {string} inputId - ID del campo de entrada
 */
export function agregarValidacionRuc(inputId) {
  const input = document.getElementById(inputId);
  if (!input) return;

  // Crear elemento para mostrar mensajes de error
  let errorElement = document.getElementById(`${inputId}-error`);
  if (!errorElement) {
    errorElement = document.createElement("div");
    errorElement.id = `${inputId}-error`;
    errorElement.className = "invalid-feedback";
    errorElement.style.display = "none";
    input.parentNode.appendChild(errorElement);
  }

  // Limitar a solo números y máximo 13 caracteres
  input.addEventListener("input", function (e) {
    let valor = e.target.value.replace(/\D/g, "");
    if (valor.length > 13) {
      valor = valor.substring(0, 13);
    }
    e.target.value = valor;

    // Validar si tiene 13 dígitos
    if (valor.length === 13) {
      if (validarRucEcuatoriano(valor)) {
        input.classList.remove("is-invalid");
        input.classList.add("is-valid");
        errorElement.style.display = "none";
      } else {
        input.classList.remove("is-valid");
        input.classList.add("is-invalid");
        errorElement.textContent = "El RUC ingresado no es válido";
        errorElement.style.display = "block";
      }
    } else {
      input.classList.remove("is-valid", "is-invalid");
      errorElement.style.display = "none";
    }
  });

  // Validar al perder el foco
  input.addEventListener("blur", function (e) {
    const valor = e.target.value.replace(/\D/g, "");
    if (valor.length > 0 && valor.length !== 13) {
      input.classList.add("is-invalid");
      errorElement.textContent = "El RUC debe tener exactamente 13 dígitos";
      errorElement.style.display = "block";
    }
  });
}

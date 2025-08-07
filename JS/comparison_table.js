/**
 * js/comparisonTable.js
 * Módulo reutilizable y 100% dinámico para construir la tabla comparativa de seguros,
 * adaptado al esquema SQL de 'sistemas_cotizaciones'.
 */

// Este objeto mapea los nombres de las columnas de características a etiquetas amigables.
// MEJORA: Se han eliminado 'Pro_descripcion' y 'Pro_mesesCobertura' de aquí
// porque se manejarán de forma especial.
const featureLabels = {
    Pro_responsabilidadCivil: "Responsabilidad Civil",
    Pro_roboTotal: "Robo Total",
    Pro_asistenciaVial: "Asistencia Vial",
    Pro_dañosColision: "Daños por Colisión",
    Pro_autoReemplazo: "Auto de Reemplazo",
    Pro_gastosLegales: "Gastos Legales",
    Pro_gastosMedicos: "Gastos Médicos"
};

/**
 * Muestra un estado de carga o error en las tres partes de la tabla.
 */
function setTableState(message, ...tableParts) {
    const [tableHead, tableBody, tableFoot] = tableParts;
    tableHead.innerHTML = '';
    tableFoot.innerHTML = '';
    tableBody.innerHTML = `<tr><td colspan="4" class="text-center">${message}</td></tr>`; // Colspan ajustado
}

/**
 * Construye y rellena la tabla comparativa de planes obteniendo los datos desde la API.
 */
export async function buildComparisonTable(selectedPlanIds, tableHead, tableBody, tableFoot) {
    setTableState('Cargando datos de la comparativa...', tableHead, tableBody, tableFoot);

    try {
        const idsQueryString = selectedPlanIds.join(',');
        const response = await fetch(`../php/productos_api.php?ids=${idsQueryString}`);
        if (!response.ok) throw new Error('No se pudieron obtener los detalles de los productos.');
        
        const products = await response.json();
        if (!products || products.length === 0) {
            setTableState('No se encontraron detalles para los planes seleccionados.', tableHead, tableBody, tableFoot);
            return;
        }

        tableHead.innerHTML = '';
        tableBody.innerHTML = '';
        tableFoot.innerHTML = '';

        // --- 1. CONSTRUIR LA CABECERA ---
        let headRow = '<tr><th>Característica</th>';
        products.forEach(product => {
            headRow += `<th><h5>${product.Pro_nombre}</h5></th>`;
        });
        tableHead.innerHTML = headRow + '</tr>';

        // --- 2. CONSTRUIR EL CUERPO DE LA TABLA ---

        // ===== MEJORA 1: Añadir la fila de DESCRIPCIÓN primero y con formato especial =====
        let descriptionRow = '<tr><td class="text-start"><strong>Descripción</strong></td>';
        products.forEach(product => {
            descriptionRow += `<td class="text-start"><small>${product.Pro_descripcion || 'N/A'}</small></td>`;
        });
        tableBody.innerHTML += descriptionRow + '</tr>';
        
        // ===== MEJORA 2: Añadir la fila de MESES DE COBERTURA con formato especial =====
        let monthsRow = '<tr><td class="text-start"><strong>Meses de Cobertura</strong></td>';
        products.forEach(product => {
            // CORRECCIÓN: Se usa `Pro_mesesCobertura` que coincide con el SQL.
            monthsRow += `<td class="fw-bold">${product.Pro_mesesCobertura || 'N/A'} meses</td>`;
        });
        tableBody.innerHTML += monthsRow + '</tr>';


        // --- 3. CONSTRUIR EL RESTO DE CARACTERÍSTICAS ---
        // Iteramos sobre las características restantes definidas en `featureLabels`.
        Object.keys(featureLabels).forEach(featureKey => {
            let bodyRow = `<tr><td class="text-start"><strong>${featureLabels[featureKey]}</strong></td>`;
            
            products.forEach(product => {
                const value = product[featureKey];
                let cellContent = '';

                if ((featureKey === 'Pro_roboTotal' || featureKey === 'Pro_autoReemplazo') && value === 'si') {
                    cellContent = `<i class="bi bi-check-circle-fill text-success fs-4"></i>`;
                } else if (value && !isNaN(parseFloat(value)) && parseFloat(value) > 0) {
                    // Maneja números como precios y montos
                    cellContent = `<i class="bi bi-check-circle-fill text-success fs-4"></i><br><small>Hasta $${parseFloat(value).toLocaleString('es-EC')}</small>`;
                } else if (typeof value === 'string' && value && value.toLowerCase() !== 'no') {
                    // Maneja texto como 'basica', '24/7', etc.
                    cellContent = `<i class="bi bi-check-circle-fill text-success fs-4"></i><br><small>${value}</small>`;
                } else {
                    cellContent = `<i class="bi bi-x-circle-fill text-danger fs-4"></i>`;
                }
                bodyRow += `<td>${cellContent}</td>`;
            });
            tableBody.innerHTML += bodyRow + '</tr>';
        });

        // --- 4. CONSTRUIR EL PIE DE TABLA ---
        let footRow = '<tr class="table-light"><td class="text-start"><strong>Precio Mensual</strong></td>';
        products.forEach(product => {
            footRow += `<td><h4>$${parseFloat(product.Pro_precioMensual).toFixed(2)}</h4></td>`;
        });
        tableFoot.innerHTML = footRow + '</tr>';

    } catch (error) {
        console.error("Error construyendo la tabla de comparación:", error);
        setTableState('<span class="text-danger">Error al cargar los datos.</span>', tableHead, tableBody, tableFoot);
    }
}
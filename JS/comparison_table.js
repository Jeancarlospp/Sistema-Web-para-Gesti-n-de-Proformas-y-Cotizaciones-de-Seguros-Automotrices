/**
 * Módulo reutilizable para construir la tabla comparativa de seguros.
 */

const mockInsuranceData = {
    basico:     { name: 'Plan Básico',     price: 50,  features: { responsabilidadCivil: 'Hasta $20,000',  roboTotal: true, asistenciaVial: 'Básica',          colision: null,            autoReemplazo: null } },
    intermedio: { name: 'Plan Intermedio', price: 85,  features: { responsabilidadCivil: 'Hasta $50,000',  roboTotal: true, asistenciaVial: 'Completa 24/7',   colision: 'Deducible 5%',  autoReemplazo: null } },
    completo:   { name: 'Plan Completo',   price: 120, features: { responsabilidadCivil: 'Hasta $100,000', roboTotal: true, asistenciaVial: 'VIP Ilimitada',   colision: 'Sin Deducible', autoReemplazo: 'Hasta 15 días' } }
};

const featureLabels = {
    responsabilidadCivil: 'Responsabilidad Civil',
    roboTotal: 'Robo Total',
    asistenciaVial: 'Asistencia Vial',
    colision: 'Daños por Colisión',
    autoReemplazo: 'Auto de Reemplazo'
};

/**
 * Construye y rellena la tabla comparativa de planes.
 * @param {string[]} selectedPlans - Array con las claves de los planes a mostrar (ej: ['basico', 'completo']).
 * @param {HTMLElement} tableHead - El elemento <thead> de la tabla.
 * @param {HTMLElement} tableBody - El elemento <tbody> de la tabla.
 * @param {HTMLElement} tableFoot - El elemento <tfoot> de la tabla.
 */
export function buildComparisonTable(selectedPlans, tableHead, tableBody, tableFoot) {
    tableHead.innerHTML = '';
    tableBody.innerHTML = '';
    tableFoot.innerHTML = '';

    // Construir cabecera
    let headRow = '<tr><th>Cobertura</th>';
    selectedPlans.forEach(planKey => {
        headRow += `<th><h5>${mockInsuranceData[planKey].name}</h5></th>`;
    });
    tableHead.innerHTML = headRow + '</tr>';

    // Construir cuerpo
    Object.keys(featureLabels).forEach(featureKey => {
        let bodyRow = `<tr><td><strong>${featureLabels[featureKey]}</strong></td>`;
        selectedPlans.forEach(planKey => {
            const val = mockInsuranceData[planKey].features[featureKey];
            const cellContent = val
                ? `<i class="bi bi-check-circle-fill text-success fs-4"></i><br><small>${val === true ? '' : val}</small>`
                : `<i class="bi bi-x-circle-fill text-danger fs-4"></i>`;
            bodyRow += `<td>${cellContent}</td>`;
        });
        tableBody.innerHTML += bodyRow + '</tr>';
    });

    // Construir pie
    let footRow = '<tr class="table-light"><td><strong>Precio Mensual</strong></td>';
    selectedPlans.forEach(planKey => {
        footRow += `<td><h4>$${mockInsuranceData[planKey].price}</h4></td>`;
    });
    tableFoot.innerHTML = footRow + '</tr>';
}
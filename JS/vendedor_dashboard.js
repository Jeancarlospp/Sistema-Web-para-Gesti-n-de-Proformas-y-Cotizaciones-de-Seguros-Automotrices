/**
 * js/vendedor_dashboard.js
 * Lógica 100% dinámica para la página: Dashboard del Vendedor,
 * adaptada al esquema SQL de 'sistemas_cotizaciones'.
 */

// Importamos la función reutilizable para crear la tabla de comparación.
// ¡Asegúrate de que este nombre de archivo coincida con el tuyo!
import { buildComparisonTable } from './comparison_table.js';

/**
 * Muestra un mensaje de carga o error en un contenedor.
 * @param {string} message - El texto a mostrar.
 * @param {boolean} isError - Si es true, el texto se mostrará en rojo.
 * @param {HTMLElement} container - El div que contendrá el mensaje.
 */
function showMessage(message, isError = false, container) {
    container.innerHTML = `<p class="text-${isError ? 'danger' : 'muted'}">${message}</p>`;
}

/**
 * Carga las categorías de vehículos desde la API y las añade al <select>.
 * @param {HTMLElement} selectElement - El elemento <select> a poblar.
 */
async function populateVehicleTypes(selectElement) {
    try {
        const response = await fetch('../php/productos_api.php?action=get_categories');
        if (!response.ok) throw new Error('No se pudieron cargar los tipos de vehículo.');
        
        const categories = await response.json(); // Espera JSON: [{idcategoria: 1, Cat_nombre: 'Auto Liviano'}, ...]
        selectElement.innerHTML = '<option value="" disabled selected>-- Seleccione un tipo --</option>';
        
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.idcategoria; // Coincide con `categoria`.`idcategoria`
            option.textContent = category.Cat_nombre; // Coincide con `categoria`.`Cat_nombre`
            selectElement.appendChild(option);
        });
    } catch (error) {
        console.error("Error al poblar tipos de vehículo:", error);
        selectElement.innerHTML = '<option value="" disabled selected>Error al cargar</option>';
    }
}

/**
 * Carga los planes (productos) para una categoría específica desde la API.
 * @param {string} categoryId - El ID de la categoría seleccionada.
 * @param {HTMLElement} container - El div que contendrá los checkboxes.
 */
async function fetchAndRenderPlans(categoryId, container) {
    showMessage('Cargando planes...', false, container);
    
    try {
        const response = await fetch(`../php/productos_api.php?category_id=${categoryId}`);
        if (!response.ok) throw new Error('No se pudieron cargar los planes.');

        const plans = await response.json(); // Espera JSON: [{idproducto: 1, Pro_nombre: 'Plan Básico'}, ...]
        
        container.innerHTML = '';
        if (!plans || plans.length === 0) {
            showMessage('No hay planes disponibles para este tipo de vehículo.', true, container);
            return;
        }

        plans.forEach(plan => {
            const checkboxHtml = `
                <div class="form-check form-check-inline">
                    <input class="form-check-input" type="checkbox" id="vendedor-plan-${plan.idproducto}" value="${plan.idproducto}">
                    <label class="form-check-label" for="vendedor-plan-${plan.idproducto}">${plan.Pro_nombre}</label>
                </div>
            `;
            container.innerHTML += checkboxHtml;
        });
    } catch (error) {
        console.error(`Error al cargar planes para la categoría ${categoryId}:`, error);
        showMessage('Error al cargar los planes.', true, container);
    }
}


/**
 * Función principal que se exporta y se llama desde main.js.
 */
export function loadVendedorDashboard() {
    console.log("Módulo del Dashboard del Vendedor (sincronizado con SQL) cargado.");

    // Elementos del DOM
    const form = document.getElementById('quick-quote-form');
    const vehicleTypeSelect = document.getElementById('vendedor-vehicle-type');
    const plansContainer = document.getElementById('vendedor-plans-container');
    const comparisonArea = document.getElementById('vendedor-comparison-area');
    const clientNameInput = document.getElementById('vendedor-client-name');
    const clientNameDisplay = document.getElementById('vendedor-client-name-display');
    const pdfBtn = document.getElementById('vendedor-generate-pdf-btn');
    const resetBtn = document.getElementById('btn-vendedor-reset');
    const compareBtn = document.getElementById('btn-vendedor-compare');

    // --- LÓGICA DE INICIALIZACIÓN ---
    populateVehicleTypes(vehicleTypeSelect);

    // --- MANEJO DE EVENTOS ---

    // 1. Cuando se cambia el tipo de vehículo.
    vehicleTypeSelect.addEventListener('change', () => {
        const selectedCategoryId = vehicleTypeSelect.value;
        if (selectedCategoryId) {
            fetchAndRenderPlans(selectedCategoryId, plansContainer);
            compareBtn.disabled = false;
        } else {
            showMessage('Por favor, seleccione primero un tipo de vehículo.', false, plansContainer);
            compareBtn.disabled = true;
        }
        comparisonArea.style.display = 'none';
    });

    // 2. Cuando se envía el formulario para cotizar.
    form.addEventListener('submit', async (event) => {
        event.preventDefault();
        
        const selectedPlanIds = Array.from(plansContainer.querySelectorAll('input[type=checkbox]:checked'))
            .map(cb => cb.value);

        if (selectedPlanIds.length === 0) {
            alert('Por favor, seleccione al menos un plan para comparar.');
            return;
        }

        const clientName = clientNameInput.value || 'Cliente';
        
        // La función `buildComparisonTable` necesita poder obtener los detalles de los productos por su ID.
        await buildComparisonTable(
            selectedPlanIds,
            document.getElementById('vendedor-comparison-head'),
            document.getElementById('vendedor-comparison-body'),
            document.getElementById('vendedor-comparison-foot')
        );

        clientNameDisplay.textContent = clientName;
        comparisonArea.style.display = 'block';
        comparisonArea.scrollIntoView({ behavior: 'smooth' });
    });

    // 3. Cuando se limpia el formulario.
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            comparisonArea.style.display = 'none';
            showMessage('Por favor, seleccione primero un tipo de vehículo.', false, plansContainer);
            compareBtn.disabled = true;
        });
    }

    // 4. Lógica del botón PDF.
    if (pdfBtn) {
        pdfBtn.addEventListener('click', () => {
            alert(`Simulación: PDF generado para ${clientNameDisplay.textContent}.`);
        });
    }
}
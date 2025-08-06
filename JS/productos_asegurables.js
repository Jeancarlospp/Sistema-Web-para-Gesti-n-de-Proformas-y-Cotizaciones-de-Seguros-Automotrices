/**
 * js/productosAsegurables.js
 * Lógica para la página de gestión de Productos Asegurables.
 */

// --- FUNCIÓN PARA RENDERIZAR LAS TARJETAS DE PRODUCTOS ---
function renderProductCards(products, container) {
    container.innerHTML = ''; // Limpiar el contenedor (quita el spinner de carga)

    if (!products || products.length === 0) {
        container.innerHTML = '<div class="col-12"><p class="text-center text-muted">No hay productos para mostrar.</p></div>';
        return;
    }

    products.forEach(product => {
        // Determinar el estilo de la tarjeta (destacado o normal)
        const cardClass = product.es_destacado ? 'border-primary' : '';
        const headerClass = product.es_destacado ? 'bg-primary text-white' : 'bg-light-secondary';

        // Construir la lista de características dinámicamente
        let featuresHtml = '';
        const features = JSON.parse(product.caracteristicas || '{}'); // Convertir el JSON de características a objeto

        featuresHtml += `<li class="list-group-item"><i class="bi bi-check-circle-fill text-success"></i> Responsabilidad Civil ($${features.responsabilidadCivil || 'N/A'})</li>`;
        featuresHtml += features.roboTotal ? `<li class="list-group-item"><i class="bi bi-check-circle-fill text-success"></i> Robo Total</li>` : `<li class="list-group-item"><i class="bi bi-x-circle text-danger"></i> Robo Total</li>`;
        featuresHtml += features.asistenciaVial ? `<li class="list-group-item"><i class="bi bi-check-circle-fill text-success"></i> Asistencia Vial</li>` : `<li class="list-group-item"><i class="bi bi-x-circle text-danger"></i> Asistencia Vial</li>`;
        featuresHtml += features.colision ? `<li class="list-group-item"><i class="bi bi-check-circle-fill text-success"></i> Daños por Colisión (${features.colision})</li>` : `<li class="list-group-item"><i class="bi bi-x-circle text-danger"></i> Daños por Colisión</li>`;
        featuresHtml += features.autoReemplazo ? `<li class="list-group-item"><i class="bi bi-check-circle-fill text-success"></i> Auto de Reemplazo (${features.autoReemplazo})</li>` : `<li class="list-group-item"><i class="bi bi-x-circle text-danger"></i> Auto de Reemplazo</li>`;
        
        const cardHtml = `
            <div class="col-md-4">
                <div class="card h-100 ${cardClass}">
                    <div class="card-header ${headerClass}">
                        <h4 class="card-title text-center">${product.nombre_producto}</h4>
                    </div>
                    <div class="card-body d-flex flex-column">
                        <p class="card-text">${product.descripcion}</p>
                        <ul class="list-group list-group-flush mt-auto">
                            ${featuresHtml}
                        </ul>
                    </div>
                    <div class="card-footer text-center">
                        <h4>$${parseFloat(product.precio).toFixed(2)} / mes</h4>
                    </div>
                </div>
            </div>
        `;
        container.innerHTML += cardHtml;
    });
}

// --- FUNCIÓN PARA CARGAR LOS PRODUCTOS DESDE LA API ---
async function fetchAndRenderProducts() {
    const container = document.getElementById('product-cards-container');
    try {
        // En el futuro, crearás `productos_api.php`
        const response = await fetch('../php/productos_api.php');
        if (!response.ok) {
            throw new Error('La respuesta de la red no fue correcta.');
        }
        const products = await response.json();
        renderProductCards(products, container);
    } catch (error) {
        console.error('Error al cargar los productos:', error);
        container.innerHTML = '<div class="col-12"><p class="text-center text-danger">Error al cargar los productos. Por favor, intente de nuevo más tarde.</p></div>';
    }
}


// --- FUNCIÓN PRINCIPAL EXPORTADA ---
export function loadProductosAsegurables() {
    console.log("Módulo de Productos Asegurables cargado.");

    // Elementos del DOM
    const btnGuardar = document.getElementById('btnGuardarProducto');
    const formNuevoProducto = document.getElementById('formNuevoProducto');
    const addProductModalEl = document.getElementById('addProductModal');
    const modalInstance = new bootstrap.Modal(addProductModalEl);

    // Cargar los productos al iniciar la página
    fetchAndRenderProducts();

    // Manejar el evento de clic en el botón de guardar del modal
    btnGuardar.addEventListener('click', async () => {
        if (!formNuevoProducto.checkValidity()) {
            formNuevoProducto.reportValidity();
            return;
        }

        const nuevoProducto = {
            nombre_producto: document.getElementById('nombreProducto').value,
            precio: parseFloat(document.getElementById('precioProducto').value),
            descripcion: document.getElementById('descripcionProducto').value,
            estado: document.getElementById('estadoProducto').value,
            caracteristicas: JSON.stringify({
                responsabilidadCivil: document.getElementById('responsabilidadCivil').value,
                roboTotal: document.getElementById('coberturaRobo').checked,
                asistenciaVial: document.getElementById('coberturaAsistencia').checked,
                colision: document.getElementById('coberturaColision').checked ? "Incluido" : null, // Simplificado
                autoReemplazo: document.getElementById('coberturaReemplazo').checked ? "Incluido" : null, // Simplificado
            })
        };

        try {
            // Enviar los datos a la API para guardarlos
            const response = await fetch('../php/productos_api.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(nuevoProducto)
            });

            const result = await response.json();

            if (result.success) {
                modalInstance.hide(); // Ocultar el modal
                formNuevoProducto.reset(); // Limpiar el formulario
                await fetchAndRenderProducts(); // Recargar y renderizar las tarjetas actualizadas
                alert('¡Producto guardado con éxito!'); // O usar una notificación más elegante
            } else {
                throw new Error(result.message || 'Error desconocido al guardar.');
            }
        } catch (error) {
            console.error('Error al guardar el producto:', error);
            alert('Error al guardar el producto: ' + error.message);
        }
    });
}
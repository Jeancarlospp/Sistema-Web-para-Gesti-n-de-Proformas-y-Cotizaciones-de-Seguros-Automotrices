/**
 * Lógica para la página: Dashboard del Vendedor.
 */
import { buildComparisonTable } from './comparison_table.js';

export function loadVendedorDashboard() {
    const form = document.getElementById('quick-quote-form');
    if (!form) return;

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const selectedPlans = Array.from(form.querySelectorAll('input[type=checkbox]:checked')).map(cb => cb.value);
        if (selectedPlans.length === 0) {
            alert('Por favor, seleccione al menos un paquete.');
            return;
        }
        
        const area = document.getElementById('vendedor-comparison-area');
        buildComparisonTable(
            selectedPlans,
            document.getElementById('vendedor-comparison-head'),
            document.getElementById('vendedor-comparison-body'),
            document.getElementById('vendedor-comparison-foot')
        );

        area.style.display = 'block';
        area.scrollIntoView({ behavior: 'smooth' });
    });

    const pdfBtn = document.getElementById('vendedor-generate-pdf-btn');
    if (pdfBtn) {
        pdfBtn.addEventListener('click', () => {
            const clientName = document.getElementById('vendedor-client-name').value || 'el cliente';
            alert(`Simulación: PDF generado para ${clientName}.`);
        });
    }
}
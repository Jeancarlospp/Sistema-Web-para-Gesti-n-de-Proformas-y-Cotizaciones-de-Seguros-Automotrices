/**
 * Lógica para la página: Dashboard del Asesor.
 */
import { buildComparisonTable } from './comparison_table.js';

export function loadAsesorDashboard() {
    const form = document.getElementById('quote-form');
    if (!form) return;

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const selectedPlans = Array.from(form.querySelectorAll('input[type=checkbox]:checked')).map(cb => cb.value);
        if (selectedPlans.length === 0) {
            alert('Por favor, seleccione al menos un plan para comparar.');
            return;
        }

        const area = document.getElementById('comparison-area');
        const clientName = document.getElementById('client-name').value || 'Cliente';
        
        buildComparisonTable(
            selectedPlans,
            document.getElementById('comparison-table-head'),
            document.getElementById('comparison-table-body'),
            document.getElementById('comparison-table-foot')
        );

        document.getElementById('client-name-display').textContent = clientName;
        area.style.display = 'block';
        area.scrollIntoView({ behavior: 'smooth' });
    });

    const pdfBtn = document.getElementById('generate-pdf-btn');
    if (pdfBtn) {
        pdfBtn.addEventListener('click', () => {
            const clientName = document.getElementById('client-name-display').textContent;
            alert(`Simulación: PDF generado para ${clientName}.`);
        });
    }
}
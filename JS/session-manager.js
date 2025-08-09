/**
 * Sistema de control de sesiones con timeout por inactividad
 */

class SessionManager {
    constructor(timeoutMinutes = 5) {
        this.timeoutDuration = timeoutMinutes * 60 * 1000; // Convertir a milisegundos
        this.warningTime = 1 * 60 * 1000; // Advertir 1 minuto antes
        this.lastActivity = Date.now();
        this.timeoutId = null;
        this.warningTimeoutId = null;
        this.isWarningShown = false;
        this.warningModal = null;
        
        this.init();
    }

    init() {
        // Eventos que resetean el timer de inactividad
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];
        
        events.forEach(event => {
            document.addEventListener(event, () => {
                this.resetTimer();
            }, true);
        });

        // Crear modal de advertencia
        this.createWarningModal();
        
        // Iniciar el timer
        this.resetTimer();
        
        // Verificar el estado de la sesión cada 30 segundos
        setInterval(() => {
            this.checkSession();
        }, 30000);
    }

    resetTimer() {
        this.lastActivity = Date.now();
        
        // Limpiar timers existentes
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        if (this.warningTimeoutId) {
            clearTimeout(this.warningTimeoutId);
        }
        
        // Ocultar advertencia si está visible
        if (this.isWarningShown) {
            this.hideWarning();
        }
        
        // Configurar nuevo timer de advertencia
        this.warningTimeoutId = setTimeout(() => {
            this.showWarning();
        }, this.timeoutDuration - this.warningTime);
        
        // Configurar nuevo timer de logout
        this.timeoutId = setTimeout(() => {
            this.logout();
        }, this.timeoutDuration);
    }

    createWarningModal() {
        // Crear modal de advertencia si no existe
        if (!document.getElementById('session-warning-modal')) {
            const modalHTML = `
                <div class="modal fade" id="session-warning-modal" tabindex="-1" aria-labelledby="sessionWarningModalLabel" aria-hidden="true" data-bs-backdrop="static">
                    <div class="modal-dialog modal-dialog-centered">
                        <div class="modal-content">
                            <div class="modal-header bg-warning text-dark">
                                <h5 class="modal-title" id="sessionWarningModalLabel">
                                    <i class="bi bi-exclamation-triangle-fill"></i> Sesión por Expirar
                                </h5>
                            </div>
                            <div class="modal-body text-center">
                                <p>Su sesión expirará en <span id="countdown-timer" class="fw-bold text-danger">60</span> segundos por inactividad.</p>
                                <p>¿Desea continuar con su sesión?</p>
                            </div>
                            <div class="modal-footer justify-content-center">
                                <button type="button" class="btn btn-primary" id="extend-session-btn">
                                    <i class="bi bi-check-circle"></i> Continuar Sesión
                                </button>
                                <button type="button" class="btn btn-secondary" id="logout-now-btn">
                                    <i class="bi bi-box-arrow-right"></i> Cerrar Sesión
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            
            // Agregar event listeners
            document.getElementById('extend-session-btn').addEventListener('click', () => {
                this.extendSession();
            });
            
            document.getElementById('logout-now-btn').addEventListener('click', () => {
                this.logout();
            });
        }
        
        this.warningModal = new bootstrap.Modal(document.getElementById('session-warning-modal'));
    }

    showWarning() {
        this.isWarningShown = true;
        this.warningModal.show();
        
        // Iniciar countdown
        let timeLeft = 60;
        const countdownElement = document.getElementById('countdown-timer');
        
        const countdownInterval = setInterval(() => {
            timeLeft--;
            countdownElement.textContent = timeLeft;
            
            if (timeLeft <= 0 || !this.isWarningShown) {
                clearInterval(countdownInterval);
            }
        }, 1000);
    }

    hideWarning() {
        if (this.isWarningShown) {
            this.isWarningShown = false;
            this.warningModal.hide();
        }
    }

    extendSession() {
        this.hideWarning();
        this.resetTimer();
        
        // Llamar al servidor para extender la sesión
        this.pingServer();
        
        // Actualizar estado visual
        this.updateSessionStatus('Extendida', 'info');
        
        // Restaurar estado normal después de 2 segundos
        setTimeout(() => {
            this.updateSessionStatus('Activa', 'success');
        }, 2000);
        
        // Mostrar notificación de éxito
        this.showNotification('Sesión extendida correctamente', 'success');
    }

    async checkSession() {
        try {
            const response = await fetch('../php/session_check.php', {
                method: 'GET',
                credentials: 'same-origin'
            });
            
            const result = await response.json();
            
            if (!result.valid) {
                // Sesión inválida, redirigir al login
                this.updateSessionStatus('Expirada', 'danger');
                this.forceLogout();
            } else {
                // Sesión válida, actualizar indicador
                this.updateSessionStatus('Activa', 'success');
            }
        } catch (error) {
            console.warn('Error verificando sesión:', error);
            this.updateSessionStatus('Error', 'warning');
        }
    }

    updateSessionStatus(status, badgeClass) {
        const statusElement = document.getElementById('session-status');
        if (statusElement) {
            statusElement.textContent = status;
            statusElement.className = `badge bg-${badgeClass} small`;
        }
    }

    async pingServer() {
        try {
            await fetch('../php/session_ping.php', {
                method: 'POST',
                credentials: 'same-origin'
            });
        } catch (error) {
            console.warn('Error enviando ping al servidor:', error);
        }
    }

    logout() {
        this.showNotification('Sesión cerrada por inactividad', 'warning');
        
        setTimeout(() => {
            this.forceLogout();
        }, 2000);
    }

    forceLogout() {
        // Limpiar localStorage
        localStorage.clear();
        
        // Redirigir al login
        window.location.href = '../index.html';
    }

    showNotification(message, type = 'info') {
        // Crear notificación toast
        const toastId = 'session-toast-' + Date.now();
        const bgClass = type === 'success' ? 'bg-success' : type === 'warning' ? 'bg-warning' : 'bg-info';
        
        const toastHTML = `
            <div class="toast align-items-center text-white ${bgClass} border-0" id="${toastId}" role="alert" aria-live="assertive" aria-atomic="true">
                <div class="d-flex">
                    <div class="toast-body">
                        <i class="bi bi-info-circle-fill me-2"></i>
                        ${message}
                    </div>
                    <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                </div>
            </div>
        `;
        
        // Crear contenedor de toasts si no existe
        let toastContainer = document.getElementById('toast-container');
        if (!toastContainer) {
            toastContainer = document.createElement('div');
            toastContainer.id = 'toast-container';
            toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
            toastContainer.style.zIndex = '9999';
            document.body.appendChild(toastContainer);
        }
        
        toastContainer.insertAdjacentHTML('beforeend', toastHTML);
        
        const toastElement = document.getElementById(toastId);
        const toast = new bootstrap.Toast(toastElement, {
            autohide: true,
            delay: 5000
        });
        
        toast.show();
        
        // Limpiar el elemento después de que se oculte
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }

    // Método público para extender manualmente la sesión
    static extendSession() {
        if (window.sessionManager) {
            window.sessionManager.extendSession();
        }
    }

    // Método público para cerrar manualmente la sesión
    static logout() {
        if (window.sessionManager) {
            window.sessionManager.logout();
        }
    }
}

// Inicializar el gestor de sesiones cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    // Solo inicializar si no estamos en la página de login
    if (!window.location.pathname.includes('index.html') && !window.location.pathname.endsWith('/')) {
        window.sessionManager = new SessionManager(5); // 5 minutos de inactividad
        console.log('Sistema de control de sesiones iniciado - Timeout: 5 minutos');
    }
});

// Exportar para uso en otros módulos
export { SessionManager };

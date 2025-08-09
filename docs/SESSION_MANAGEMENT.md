# Sistema de Control de Sesiones

## Descripción
Sistema automático de gestión de sesiones que controla la inactividad del usuario y cierra automáticamente la sesión después de 5 minutos sin actividad.

## Características

### 1. **Detección de Inactividad**
- Monitorea eventos del usuario: clics, movimiento del mouse, teclas, scroll, etc.
- Tiempo límite configurable (por defecto: 5 minutos)
- Advertencia 1 minuto antes del cierre automático

### 2. **Modal de Advertencia**
- Aparece 1 minuto antes del cierre automático
- Cuenta regresiva visual de 60 segundos
- Opciones para extender o cerrar sesión manualmente

### 3. **Verificación del Servidor**
- Verifica el estado de la sesión cada 30 segundos
- Valida que la sesión PHP siga activa
- Cierre automático si la sesión del servidor expira

### 4. **Indicador Visual**
- Badge en el dropdown del perfil que muestra el estado de la sesión
- Estados: Activa, Extendida, Expirada, Error
- Colores indicativos según el estado

### 5. **Notificaciones Toast**
- Mensajes informativos sobre el estado de la sesión
- Notificaciones de extensión exitosa
- Alertas de cierre por inactividad

## Archivos Principales

### JavaScript
- `session-manager.js` - Clase principal del sistema
- `main.js` - Inicialización en páginas autenticadas

### PHP
- `session_check.php` - Verificación del estado de la sesión
- `session_ping.php` - Extensión de la sesión (ping)
- `login.php` - Inicialización del timestamp de sesión

### CSS
- `session-styles.css` - Estilos específicos del sistema

## Configuración

### Tiempo de Inactividad
```javascript
// En main.js o session-manager.js
new SessionManager(5); // 5 minutos
```

### Tiempo de Advertencia
```javascript
// En session-manager.js
this.warningTime = 1 * 60 * 1000; // 1 minuto antes
```

## Uso

### Inicialización Automática
El sistema se inicializa automáticamente en todas las páginas autenticadas a través de `main.js`.

### Métodos Públicos
```javascript
// Extender sesión manualmente
SessionManager.extendSession();

// Cerrar sesión manualmente
SessionManager.logout();
```

## Eventos del Sistema

### Eventos que Resetean el Timer
- `mousedown` - Clic del mouse
- `mousemove` - Movimiento del mouse
- `keypress` - Teclas presionadas
- `scroll` - Desplazamiento de página
- `touchstart` - Toque en dispositivos móviles
- `click` - Clics generales

### Estados de Sesión
1. **Activa** - Sesión normal funcionando
2. **Extendida** - Sesión recién extendida
3. **Expirada** - Sesión cerrada por inactividad
4. **Error** - Problema de comunicación con el servidor

## Flujo de Funcionamiento

1. **Inicio**: Se inicia el timer al cargar la página
2. **Actividad**: Cualquier actividad del usuario resetea el timer
3. **Advertencia**: 1 minuto antes del límite aparece el modal
4. **Cuenta Regresiva**: 60 segundos para decidir
5. **Extensión**: El usuario puede extender la sesión
6. **Cierre**: Cierre automático o manual de la sesión

## Verificación del Servidor

### Cada 30 segundos
- Solicitud a `session_check.php`
- Validación del estado de la sesión PHP
- Actualización del indicador visual

### En Extensión
- Solicitud a `session_ping.php`
- Actualización del timestamp en PHP
- Confirmación de extensión exitosa

## Seguridad

### Validaciones
- Verificación tanto en cliente como servidor
- Timestamp de última actividad en PHP
- Cierre automático si la sesión del servidor expira

### Limpieza
- Limpieza del localStorage al cerrar sesión
- Redirección automática a la página de login
- Destrucción de la sesión PHP

## Responsive Design

- Modal adaptado para dispositivos móviles
- Toasts posicionados apropiadamente
- Indicadores visibles en todas las resoluciones

## Compatibilidad

- Compatible con Bootstrap 5
- Funciona en todos los navegadores modernos
- Soporte para dispositivos táctiles
- No requiere librerías adicionales

## Personalización

### Modificar Tiempos
```javascript
// Cambiar tiempo de inactividad a 10 minutos
new SessionManager(10);

// Modificar tiempo de advertencia a 2 minutos
this.warningTime = 2 * 60 * 1000;
```

### Personalizar Estilos
Editar `session-styles.css` para cambiar:
- Colores de los indicadores
- Animaciones del modal
- Estilos de las notificaciones

### Eventos Personalizados
```javascript
// Agregar eventos adicionales
const customEvents = ['focus', 'blur'];
customEvents.forEach(event => {
    document.addEventListener(event, () => {
        this.resetTimer();
    }, true);
});
```

## Troubleshooting

### Problemas Comunes

1. **Modal no aparece**: Verificar que Bootstrap esté cargado
2. **Sesión no se extiende**: Revisar `session_ping.php`
3. **Indicador no actualiza**: Verificar `session_check.php`
4. **Cierre inmediato**: Revisar configuración de tiempos

### Debug
```javascript
// Habilitar logs de debug
console.log('SessionManager iniciado');
console.log('Tiempo de inactividad:', this.timeoutDuration);
```

## Implementación en Nuevas Páginas

1. Incluir `session-manager.js` en `main.js`
2. Agregar indicador de estado en el HTML
3. Incluir estilos CSS específicos
4. Verificar que la página no sea de login

El sistema está diseñado para ser plug-and-play en todas las páginas autenticadas del sistema.

// ── Guard: redirigir al login solo si no hay token ──────────────
// sessionStorage se borra al cerrar la pestaña/ventana (comportamiento deseado)
// pero persiste en recargas de página
if (!sessionStorage.getItem('token')) {
    window.location.href = '/login.html';
}

// ── Interceptor fetch — agrega token automáticamente ────────────
// NO redirige al login si hay errores; eso le corresponde a cada página
const _fetchOriginal = window.fetch;

window.fetch = function(url, opciones = {}) {
    if (
        typeof url === 'string' &&
        !url.includes('.html') &&
        !url.includes('.js') &&
        !url.includes('.css')
    ) {
        opciones.headers = {
            ...opciones.headers,
            Authorization: `Bearer ${sessionStorage.getItem('token')}`
        };
    }

    // Devuelve la promesa SIN capturar errores aquí.
    // Si el servidor responde 401, cada página decide qué hacer.
    // Si hay un error de red o bug, no redirige al login.
    return _fetchOriginal(url, opciones).then(response => {
        // Solo redirige al login si el servidor explícitamente dice 401
        // Y solo si la URL es una llamada a la API (no recursos estáticos)
        if (
            response.status === 401 &&
            typeof url === 'string' &&
            !url.includes('.html') &&
            !url.includes('.js') &&
            !url.includes('.css')
        ) {
            sessionStorage.removeItem('token');
            window.location.href = '/login.html';
        }
        return response;
    });
    // Sin .catch() aquí — los errores de red (500, bugs, rutas inexistentes)
    // los maneja cada página individualmente, no este interceptor
};

// ── Botón flotante — nunca en index ni login ────────────────────
const ruta = window.location.pathname;

if (ruta !== '/' && !ruta.includes('index') && !ruta.includes('login')) {
    const btnInicio = document.createElement('a');

    btnInicio.href  = '/index.html';
    btnInicio.title = 'Volver al menú principal';

    btnInicio.style.cssText = `
        position: fixed;
        bottom: 28px;
        left: 28px;
        background: #003366;
        color: #fff;
        border-radius: 50px;
        padding: 10px 18px;
        font-family: 'Segoe UI', sans-serif;
        font-size: .88rem;
        font-weight: 600;
        text-decoration: none;
        box-shadow: 0 4px 14px rgba(0,0,0,.25);
        z-index: 9999;
    `;

    btnInicio.textContent = '← Menú';

    btnInicio.onmouseenter = () => btnInicio.style.opacity = '.85';
    btnInicio.onmouseleave = () => btnInicio.style.opacity = '1';

    document.body.appendChild(btnInicio);
}

// ── Botón cerrar sesión ─────────────────────────────────────────
if (!ruta.includes('login')) {
    const btnLogout = document.createElement('button');

    btnLogout.textContent = 'Cerrar sesión';
    btnLogout.title       = 'Cerrar sesión';

    btnLogout.style.cssText = `
        position: fixed;
        bottom: 28px;
        right: 28px;
        background: #c0392b;
        color: #fff;
        border: none;
        border-radius: 50px;
        padding: 10px 18px;
        font-family: 'Segoe UI', sans-serif;
        font-size: .88rem;
        font-weight: 600;
        cursor: pointer;
        box-shadow: 0 4px 14px rgba(0,0,0,.25);
        z-index: 9999;
    `;

    btnLogout.onmouseenter = () => btnLogout.style.opacity = '.85';
    btnLogout.onmouseleave = () => btnLogout.style.opacity = '1';

    btnLogout.onclick = async () => {
        try {
            await fetch('/auth/logout', { method: 'POST' });
        } catch {
            // Si falla el logout en el servidor, igual se limpia el token local
        } finally {
            sessionStorage.removeItem('token');
            window.location.href = '/login.html';
        }
    };

    document.body.appendChild(btnLogout);
}
// Redirigir al login si no hay token
if (!sessionStorage.getItem('token')) {
    window.location.href = '/login.html';
}

// Interceptor fetch — agrega token automáticamente
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

    return _fetchOriginal(url, opciones);
};

// Botón flotante — nunca en index ni login
const ruta = window.location.pathname;

if (ruta !== '/' && !ruta.includes('index') && !ruta.includes('login')) {
    const btnInicio = document.createElement('a');

    btnInicio.href = '/index.html';
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

// Botón cerrar sesión
if (!ruta.includes('login')) {
    const btnLogout = document.createElement('button');

    btnLogout.textContent = 'Cerrar sesión';
    btnLogout.title = 'Cerrar sesión';

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
        await fetch('/auth/logout', { method: 'POST' });
        sessionStorage.removeItem('token');
        window.location.href = '/login.html';
    };

    document.body.appendChild(btnLogout);
}
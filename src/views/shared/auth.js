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
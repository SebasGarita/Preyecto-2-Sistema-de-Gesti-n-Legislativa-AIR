// Protección de ruta — redirige al login si no hay token
console.log('Token en auth.js:', localStorage.getItem('token'));
if (!localStorage.getItem('token')) {
    window.location.href = '/login.html';
}

// Sobrescribe fetch globalmente para incluir el token automáticamente
const _fetchOriginal = window.fetch;
window.fetch = function(url, opciones = {}) {
    if (typeof url === 'string' && !url.includes('.html') && !url.includes('.js') && !url.includes('.css')) {
        opciones.headers = {
            ...opciones.headers,
            Authorization: `Bearer ${localStorage.getItem('token')}`
        };
    }
    return _fetchOriginal(url, opciones);
};

// Botón flotante para volver al inicio
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
    transition: all .2s;
`;
btnInicio.textContent = '← Menú';
btnInicio.onmouseenter = () => btnInicio.style.opacity = '.85';
btnInicio.onmouseleave = () => btnInicio.style.opacity = '1';
document.body.appendChild(btnInicio);
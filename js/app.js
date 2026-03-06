/**
 * app.js — Punto de entrada principal de Morata
 * Inicializa la UI y coordina los módulos de la tienda.
 */

/**
 * Actualiza el badge del carrito en el header.
 * @param {number} count - Número de ítems en el carrito.
 */
function updateCartBadge(count) {
    const badge = document.getElementById('cart-badge');
    if (badge) {
        badge.textContent = count;
        badge.style.display = count > 0 ? 'flex' : 'none';
    }
}

/**
 * Inicializa la aplicación.
 */
async function init() {
    // Inicializar módulo de carrito
    const carrito = initCarrito();
    updateCartBadge(carrito.getCount());

    // Escuchar cambios en el carrito para actualizar el badge
    document.addEventListener('carritoUpdated', (e) => {
        updateCartBadge(e.detail.count);
    });

    // Lógica para el formulario de registro
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegisterSubmit);
    }

    // Cargar productos en Populares
    const popularesContainer = document.getElementById('populares-container');
    if (popularesContainer) {
        popularesContainer.innerHTML = '<div class="col-span-full py-10 flex justify-center"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>';

        try {
            const products = await fetchProducts();

            if (!products || products.length === 0) {
                popularesContainer.innerHTML = '<div class="col-span-full text-center text-text-muted py-10">No se encontraron productos populares recientes.</div>';
            } else {
                popularesContainer.innerHTML = products.map(p => `
                    <div class="flex flex-col gap-3 group border border-primary rounded-xl p-3 bg-white hover:shadow-xl hover:shadow-primary/10 transition-all duration-300 h-full">
                        <div class="relative w-full aspect-square rounded-lg overflow-hidden bg-slate-100">
                            <img alt="${p.nombre}"
                                class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                src="${p.imagen_url || 'https://via.placeholder.com/400?text=Sin+Imagen'}" />
                            <button class="heart-btn absolute top-3 right-3 bg-white/80 backdrop-blur-md text-primary shadow-sm" data-id="${p.id_producto}">
                                <span class="heart-icon material-symbols-outlined text-[20px]">favorite</span>
                            </button>
                            <div class="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button data-add-cart="${p.id_producto}" data-product='${JSON.stringify({ id: p.id_producto, nombre: p.nombre, precio: p.precio, imagen: p.imagen_url || "" }).replace(/'/g, "&#39;")}' class="add-to-cart-btn flex items-center justify-center size-10 rounded-full bg-accent text-primary shadow-lg hover:bg-yellow-400 transition-colors">
                                    <span class="material-symbols-outlined text-[20px]">add_shopping_cart</span>
                                </button>
                            </div>
                        </div>
                        <div class="px-1 py-2 flex flex-col flex-1">
                            <div class="flex justify-between items-start gap-2">
                                <div class="min-w-0 overflow-hidden">
                                    <h3 class="text-text-main font-bold text-lg leading-tight group-hover:text-primary transition-colors truncate max-w-[15ch]" title="${p.nombre}">
                                        ${p.nombre}</h3>
                                    <p class="text-text-muted text-sm mt-1 truncate" title="${p.tipo_producto?.nombre || 'Categoría Desconocida'}">${p.tipo_producto?.nombre || 'Categoría Desconocida'}</p>
                                </div>
                                <div class="flex flex-col items-end">
                                    <p class="text-primary font-bold text-lg whitespace-nowrap">$${Number(p.precio).toFixed(2)}</p>
                                    <p class="text-text-muted text-xs whitespace-nowrap">Stock: ${p.stock}</p>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('');

                // Re-vincular eventos a los nuevos botones de favoritos
                bindFavoriteButtons(popularesContainer);
                bindAddCartButtons(popularesContainer, carrito);
            }
        } catch (error) {
            console.error('Error cargando populares:', error);
            popularesContainer.innerHTML = '<div class="col-span-full py-10 text-center text-red-500">Error al conectarse a la base de datos.</div>';
        }
    }

    console.log('Morata inicializado.');
}

/**
 * Manejador del envío del formulario de registro
 */
async function handleRegisterSubmit(e) {
    e.preventDefault();
    const errorDiv = document.getElementById('register-error');
    if (errorDiv) {
        errorDiv.classList.add('hidden');
        errorDiv.textContent = '';
    }

    const primer_nombre = document.getElementById('primer_nombre').value.trim();
    const segundo_nombre = document.getElementById('segundo_nombre').value.trim();
    const primer_apellido = document.getElementById('primer_apellido').value.trim();
    const segundo_apellido = document.getElementById('segundo_apellido').value.trim();
    const email = document.getElementById('email').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const direccion = document.getElementById('direccion').value.trim();
    const documento = document.getElementById('documento').value.trim();
    const password = document.getElementById('password').value;
    const confirmar_password = document.getElementById('confirmar_password').value;

    if (password !== confirmar_password) {
        if (errorDiv) {
            errorDiv.textContent = 'Las contraseñas no coinciden. Por favor, verifícalas.';
            errorDiv.classList.remove('hidden');
        } else {
            alert('Las contraseñas no coinciden.');
        }
        return;
    }

    const nombres = `${primer_nombre} ${segundo_nombre}`.trim();
    const apellidos = `${primer_apellido} ${segundo_apellido}`.trim();

    const clientData = {
        nombres,
        apellidos,
        email,
        telefono,
        direccion,
        documento,
        fecha_registro: new Date().toISOString(),
        estado: true
    };

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span class="material-symbols-outlined animate-spin">progress_activity</span> Cargando...';
    submitBtn.disabled = true;

    try {
        await registerClient(clientData);
        alert('¡Registro exitoso! Tus datos han sido guardados.');
        window.location.href = 'login.html';
    } catch (err) {
        console.error('Error al registrar:', err);
        if (errorDiv) {
            errorDiv.textContent = 'Ocurrió un error al registrarse. Es posible que el correo o documento ya estén en uso.';
            errorDiv.classList.remove('hidden');
        } else {
            alert('Error al registrarse. Inténtalo de nuevo.');
        }
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

document.addEventListener('DOMContentLoaded', init);

/* ─── Heart Favourite Buttons ─── */
function bindFavoriteButtons(container = document) {
    container.querySelectorAll('.heart-btn').forEach(btn => {
        // Clonar y reemplazar para evitar múltiples listeners
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', function () {
            if (this.classList.contains('is-favorited')) {
                this.classList.remove('is-favorited');
                return;
            }
            if (this.classList.contains('is-sparking')) return;
            this.classList.add('is-sparking');
            setTimeout(() => {
                this.classList.remove('is-sparking');
                this.classList.add('is-favorited');
            }, 650);
        });
    });
}

// Vinculación inicial para botones estáticos en el DOM
document.addEventListener('DOMContentLoaded', () => bindFavoriteButtons());

/* ─── Add to Cart Buttons ─── */
function bindAddCartButtons(container = document, carrito) {
    container.querySelectorAll('button[data-add-cart]').forEach(btn => {
        const newBtn = btn.cloneNode(true);
        btn.parentNode.replaceChild(newBtn, btn);

        newBtn.addEventListener('click', function () {
            // Verificar sesión activa antes de añadir al carrito
            if (!estaLogueado()) {
                mostrarTooltipLogin(this);
                return;
            }

            try {
                const productData = JSON.parse(this.getAttribute('data-product'));
                carrito.agregar(productData, 1);

                // Animación visual del badge en el carrito para dar feedback
                const badge = document.getElementById('cart-badge');
                if (badge) {
                    badge.classList.add('scale-150');
                    setTimeout(() => badge.classList.remove('scale-150'), 200);
                }

                // Feedback visual en el botón
                mostrarFeedbackCarrito(this);
            } catch (err) {
                console.error("Error al agregar al carrito", err);
            }
        });
    });
}

/**
 * Muestra un tooltip "Inicia sesión" junto al botón y redirige a login.
 * @param {HTMLElement} btn
 */
function mostrarTooltipLogin(btn) {
    // Evitar duplicados
    if (btn._tooltipActive) return;
    btn._tooltipActive = true;

    const tip = document.createElement('div');
    tip.textContent = '¡Inicia sesión para comprar!';
    tip.style.cssText = `
        position:absolute; z-index:9999; bottom:calc(100% + 8px); left:50%;
        transform:translateX(-50%); white-space:nowrap;
        background:#1a1a1a; color:#fbbf24; font-size:12px; font-weight:700;
        padding:6px 12px; border-radius:999px; pointer-events:none;
        opacity:0; transition:opacity 0.2s;
    `;

    // El botón necesita position:relative para el posicionamiento del tooltip
    const parent = btn.offsetParent || btn.parentElement;
    btn.style.position = 'relative';
    btn.appendChild(tip);

    requestAnimationFrame(() => { tip.style.opacity = '1'; });

    setTimeout(() => {
        tip.style.opacity = '0';
        setTimeout(() => {
            tip.remove();
            btn._tooltipActive = false;
        }, 200);
        window.location.href = 'login.html';
    }, 1200);
}

/**
 * Animación de confirmación cuando se agrega al carrito exitosamente.
 * @param {HTMLElement} btn
 */
function mostrarFeedbackCarrito(btn) {
    const originalHTML = btn.innerHTML;
    btn.innerHTML = '<span class="material-symbols-outlined text-[20px]">check</span>';
    btn.style.background = '#22c55e';
    setTimeout(() => {
        btn.innerHTML = originalHTML;
        btn.style.background = '';
    }, 800);
}

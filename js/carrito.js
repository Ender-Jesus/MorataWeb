/**
 * carrito.js — Módulo de gestión del carrito de compras de Morata
 * 
 * Comportamiento por sesión:
 *  - Sin sesión activa : el carrito de invitado se borra al cargar la página
 *                        y cualquier acción trabaja sobre una clave temporal
 *                        que se descarta al cerrar/recargar.
 *  - Con sesión activa : el carrito se persiste bajo la clave del usuario
 *                        (morata_carrito_<id>) y sobrevive cierres de pestaña.
 */

const SESSION_KEY = 'morata_session';
const GUEST_KEY = 'morata_carrito_guest';

/**
 * Devuelve la clave de localStorage que corresponde al estado de sesión actual.
 * Si no hay sesión, elimina el carrito de invitado (estado base vacío) y
 * devuelve la clave de invitado para que la sesión actual quede limpia.
 * @param {boolean} [skipClear=false] - Si true, no borra el carrito guest al llamar.
 * @returns {string}
 */
function getCartKey(skipClear = false) {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (raw) {
            const session = JSON.parse(raw);
            if (session && session.id) {
                return `morata_carrito_${session.id}`;
            }
        }
    } catch { /* ignore */ }

    // Sin sesión: limpiar carrito de invitado para empezar siempre vacío
    if (!skipClear) {
        localStorage.removeItem(GUEST_KEY);
    }
    return GUEST_KEY;
}

/**
 * Lee el carrito del localStorage según la sesión activa.
 * @returns {Array} Array de ítems {id, nombre, precio, cantidad, imagen}.
 */
function leerCarrito() {
    try {
        // skipClear=true para no borrar en cada lectura individual
        return JSON.parse(localStorage.getItem(getCartKey(true))) || [];
    } catch {
        return [];
    }
}

/**
 * Guarda el carrito en localStorage y emite el evento carritoUpdated.
 * @param {Array} items
 */
function guardarCarrito(items) {
    localStorage.setItem(getCartKey(true), JSON.stringify(items));
    const count = items.reduce((sum, i) => sum + i.cantidad, 0);
    document.dispatchEvent(new CustomEvent('carritoUpdated', { detail: { count, items } }));
}

/**
 * Inicializa el módulo del carrito.
 * Debe llamarse una vez al cargar la página.
 * Si no hay sesión, limpia el carrito de invitado para garantizar estado vacío.
 */
function initCarrito() {
    // Ejecutar getCartKey sin skipClear para limpiar el guest si aplica
    getCartKey(false);

    return {
        /** Devuelve todos los ítems del carrito */
        getItems() {
            return leerCarrito();
        },

        /** Devuelve la cantidad total de ítems */
        getCount() {
            return leerCarrito().reduce((sum, i) => sum + i.cantidad, 0);
        },

        /** Devuelve el total monetario */
        getTotal() {
            return leerCarrito().reduce((sum, i) => sum + i.precio * i.cantidad, 0);
        },

        /**
         * Agrega un producto al carrito o incrementa su cantidad.
         * Solo funciona si hay sesión activa.
         * @param {{id, nombre, precio, imagen}} producto
         * @param {number} [cantidad=1]
         */
        agregar(producto, cantidad = 1) {
            if (!estaLogueado()) return;
            const items = leerCarrito();
            const existente = items.find(i => i.id === producto.id);
            if (existente) {
                existente.cantidad += cantidad;
            } else {
                items.push({ ...producto, cantidad });
            }
            guardarCarrito(items);
        },

        /**
         * Elimina un producto del carrito por su ID.
         * @param {string|number} id
         */
        eliminar(id) {
            const items = leerCarrito().filter(i => i.id !== id);
            guardarCarrito(items);
        },

        /**
         * Actualiza la cantidad de un ítem. Si cantidad <= 0 lo elimina.
         * @param {string|number} id
         * @param {number} cantidad
         */
        actualizarCantidad(id, cantidad) {
            if (cantidad <= 0) {
                this.eliminar(id);
                return;
            }
            const items = leerCarrito();
            const item = items.find(i => i.id === id);
            if (item) {
                item.cantidad = cantidad;
                guardarCarrito(items);
            }
        },

        /** Vacía el carrito por completo */
        vaciar() {
            guardarCarrito([]);
        },
    };
}

/**
 * Devuelve true si hay una sesión de usuario activa.
 * @returns {boolean}
 */
function estaLogueado() {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) return false;
        const s = JSON.parse(raw);
        return !!(s && s.id);
    } catch {
        return false;
    }
}

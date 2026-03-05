/**
 * carrito.js — Módulo de gestión del carrito de compras
 * Persiste el estado en localStorage y emite eventos DOM custom.
 */

const STORAGE_KEY = 'lumina_carrito';

/**
 * Lee el carrito del localStorage.
 * @returns {Array} Array de ítems {id, nombre, precio, cantidad, imagen}.
 */
function leerCarrito() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    } catch {
        return [];
    }
}

/**
 * Guarda el carrito en localStorage y emite el evento carritoUpdated.
 * @param {Array} items
 */
function guardarCarrito(items) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    const count = items.reduce((sum, i) => sum + i.cantidad, 0);
    document.dispatchEvent(new CustomEvent('carritoUpdated', { detail: { count, items } }));
}

/**
 * Inicializa y retorna la API pública del carrito.
 * @returns {Object}
 */
function initCarrito() {
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
         * @param {{id, nombre, precio, imagen}} producto
         * @param {number} [cantidad=1]
         */
        agregar(producto, cantidad = 1) {
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

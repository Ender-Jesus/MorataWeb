/**
 * api.js — Módulo de comunicación con la API de Morata Lighting Store
 * Conectado a Supabase (versión global UMD para soportar file://)
 */

// Usar el cliente global 'supabase' que cargamos desde el CDN en el HTML
const { createClient } = supabase;

// Configuración de Supabase
const supabaseUrl = 'https://tmjdzzgsizdeegzhbiju.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRtamR6emdzaXpkZWVnemhiaWp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIyMDI2OTAsImV4cCI6MjA4Nzc3ODY5MH0.EUxWDHsyYsv9QrX9WrevPS8T78FIQvCdWTM-24U4ANM';
const supabaseClient = createClient(supabaseUrl, supabaseKey);

/**
 * Obtiene el listado de productos más populares (4 más recientes para este caso).
 * @returns {Promise<Array>} Lista de productos con la info de la categoría unida.
 */
async function fetchProducts() {
    try {
        const { data, error } = await supabaseClient
            .from('producto')
            .select('*, tipo_producto(nombre)')
            .order('fecha_creacion', { ascending: false });

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('fetchProducts (Supabase):', err);
        return [];
    }
}

/**
 * Obtiene un producto por su ID.
 * @param {string|number} id - ID del producto.
 * @returns {Promise<Object|null>} Datos del producto.
 */
async function fetchProductById(id) {
    try {
        const { data, error } = await supabaseClient
            .from('producto')
            .select('*, tipo_producto(nombre)')
            .eq('id_producto', id)
            .single();

        if (error) throw error;
        return data;
    } catch (err) {
        console.error('fetchProductById:', err);
        return null;
    }
}

/**
 * Obtiene las categorías disponibles.
 * @returns {Promise<Array>} Lista de categorías.
 */
async function fetchCategories() {
    try {
        const { data, error } = await supabaseClient
            .from('tipo_producto')
            .select('*');

        if (error) throw error;
        return data || [];
    } catch (err) {
        console.error('fetchCategories:', err);
        return [];
    }
}

/**
 * Registra un nuevo cliente en la base de datos de Supabase.
 * @param {Object} clientData - Objeto con los datos del cliente.
 * @returns {Promise<Object|null>} Retorna los datos insertados o lanza un error si falla.
 */
async function registerClient(clientData) {
    try {
        const { data, error } = await supabaseClient
            .from('cliente')
            .insert([clientData])
            .select();

        if (error) throw error;
        return data ? data[0] : null;
    } catch (err) {
        console.error('Error en registerClient (Supabase):', err);
        throw err;
    }
}

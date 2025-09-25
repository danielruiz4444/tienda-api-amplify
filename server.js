// Cargar variables de entorno desde el archivo .env
require('dotenv').config();

const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const PORT = process.enc.PORT || 3000;

// --- Middlewares ---
app.use(cors()); // Habilita CORS para permitir peticiones desde el frontend
app.use(express.json()); // Permite al servidor entender JSON en el body de las peticiones
app.use(express.static('public')); // Sirve los archivos estáticos (nuestro frontend) desde la carpeta 'public'

// --- Endpoint del Proxy ---
// El frontend llamará a esta ruta
app.post('/api/execute', async (req, res) => {
    // 1. Extraer las preferencias del cuerpo de la petición que envía el frontend
    //const { preferences } = req.body;
    const { preferences, amount, reference } = req.body;

    // Validar que las preferencias llegaron
    if (!preferences) {
        return res.status(400).json({ error: 'El objeto "preferences" es requerido.' });
    }

    try {
        // 2. Construir el cuerpo completo para el API de PayClip
        const requestBody = {
            reference: reference, // <-- Se usa la variable 'reference' recibida
            amount: amount,       // <-- Se usa la variable 'amount' recibida
            serial_number_pos: "P8C1231120001899",
            preferences: preferences 
        };

        // 3. Configurar los headers, usando la API Key desde el archivo .env
        const headers = {
            'Accept': 'application/vnd.com.payclip.v2+json',
            'Content-Type': 'application/json',
            'Authorization': process.env.PAYCLIP_API_KEY // ¡La clave se obtiene de forma segura!
        };

        console.log('Enviando petición al API de PayClip...');
        
        // 4. Realizar la llamada POST al API real usando Axios
        const apiResponse = await axios.post(process.env.PAYCLIP_API_URL, requestBody, { headers });

        // 5. Devolver la respuesta del API de PayClip al frontend
        res.status(200).json(apiResponse.data);

    } catch (error) {
        console.error('Error al llamar al API de PayClip:', error.response?.data || error.message);
        
        // Si el API externo da un error, lo reenviamos al frontend
        res.status(error.response?.status || 500).json({ 
            error: 'Error al procesar la petición externa.',
            details: error.response?.data 
        });
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Servidor proxy escuchando en http://localhost:${PORT}`);
});
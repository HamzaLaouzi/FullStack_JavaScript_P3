const express = require('express'); // Importamos el módulo "express"
const { createHandler } = require('graphql-http/lib/use/express'); // Importamos "createHandler" desde la librería "graphql-http"
const schema = require('./GraphQL/schema.js'); // Importamos los schemas GraphQL
const root = require('./GraphQL/Resolvers.js'); // Importamos los resolvers GraphQL
const { verifyToken, getUserFromToken } = require("./auth.js"); // Importamos funciones de autenticación

const userRoutes = require('./routes/users.js');
const cardRoutes = require('./routes/cards.js');

const port = 4000; // Puerto en el que se ejecutará el servidor
const route = "graphql"; // Ruta base para GraphQL

const app = express(); // Inicializamos la aplicación de Express

/**
 * Ruta de prueba para confirmar que el servidor está funcionando.
 * @name GET/
 * @function
 * @memberof module:expressApp
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {String} Mensaje de bienvenida
 */
app.get('/', (req, res) => res.send('API GraphQL funcionando correctamente'));

// Middleware para parsear JSON
app.use(express.json());

// Rutas REST (opcional, puedes usar GraphQL en su lugar)
app.use('/api/users', userRoutes);
app.use('/api/cards', cardRoutes);

/**
 * Configura el middleware para manejar peticiones GraphQL.
 * 
 * @name POST/graphql
 * @function
 * @memberof module:expressApp
 * @param {Object} req - Objeto de solicitud HTTP
 * @param {Object} res - Objeto de respuesta HTTP
 * @returns {Object} Contexto que incluye el usuario autenticado
 */
app.use('/' + route, createHandler({
  schema,
  rootValue: root,
  /**
   * Función de contexto para GraphQL.
   * Extrae y verifica el token de autorización para obtener los datos del usuario.
   * 
   * @async
   * @param {Object} req - Objeto de solicitud HTTP
   * @param {Object} res - Objeto de respuesta HTTP
   * @returns {Promise<Object>} Objeto de contexto con información del usuario
   */
  context: async (req, res) => {
    console.log("Cabecera recibida:", req.headers.authorization);
    const token = req.headers.authorization?.split(' ')[1];
    console.log("Token extraído:", token);
    const userData = token ? verifyToken(token) : null;
    const currentUser = getUserFromToken(token);
    return { user: userData, currentUser };
  }
}));

/**
 * Inicia el servidor en el puerto especificado y muestra la URL de acceso en consola.
 * 
 * @function
 * @memberof module:expressApp
 */
app.listen(port, () => console.log('Servidor en http://localhost:' + port + '/' + route));
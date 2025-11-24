/**
 * Importa los módulos y configura las variables de entorno.
 * Define y configura el servidor Express, los middlewares, rutas, GraphQL y la base de datos.
 * @module index
 */

const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { schema, root } = require('./schema');
const { connectDB } = require('./database');
const jwt = require('jsonwebtoken');
require('dotenv').config();

/**
 * Instancia principal de la aplicación Express.
 * @type {object}
 */

const express = require('express');
const app = express();
const usersRouter = require('./routes/users');
app.use('/users', usersRouter);

app.listen(3000, () => {
  console.log('Servidor en marcha');
});

/**
 * Middleware para decodificar el token JWT de la cabecera Authorization.
 * Adjunta el usuario decodificado a la petición (req.user).
 * @param {object} req - La petición HTTP.
 * @param {object} res - La respuesta HTTP.
 * @param {function} next - Función para pasar al siguiente middleware.
 * @returns {void}
 */
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const token = authHeader.split(' ')[1]; // Formato: "Bearer <token>"
    if (token) {
      try {
        const user = jwt.verify(token, process.env.JWT_SECRET);
        req.user = user; // Adjuntamos el usuario decodificado a la petición
      } catch (err) {
        console.log("Token inválido");
      }
    }
  }
  next();
};
/**
 * Aplica el middleware de autenticación a todas las rutas.
 */
app.use(authMiddleware);

/**
 * Endpoint GraphQL.
 * Configura el servidor de GraphQL con el esquema y el root.
 * Pasa el usuario autenticado (si lo hay) al contexto.
 */

app.use('/graphql', graphqlHTTP((req) => ({
  schema: schema,
  rootValue: root,
  graphiql: true,
  // Pasamos el usuario detectado (si existe) al contexto de GraphQL
  context: {
    user: req.user
  }
})));

/**
 * Endpoint raíz '/' que indica el funcionamiento del servidor.
 * @param {object} req - La petición HTTP.
 * @param {object} res - La respuesta HTTP.
 * @returns {void}
 */

app.get('/', (req, res) => {
    res.send('¡Hola! El servidor backend del Producto 3 está funcionando');
});

/**
 * Conecta a la base de datos y arranca el servidor.
 * Muestra los endpoints disponibles en consola.
 */
connectDB().then(() => {
  app.listen(PORT, () => {
      console.log(`Servidor escuchando en http://localhost:${PORT}`);
      console.log(`Prueba GraphQL en http://localhost:${PORT}/graphql`);
  });
});
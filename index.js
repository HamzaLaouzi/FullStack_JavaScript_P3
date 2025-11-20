const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { schema, root } = require('./schema');
const { connectDB } = require('./database');
const jwt = require('jsonwebtoken');
require('dotenv').config();

const app = express();
const PORT = 3000;

// Middleware para decodificar el token
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

app.use(authMiddleware);

app.use('/graphql', graphqlHTTP((req) => ({
  schema: schema,
  rootValue: root,
  graphiql: true,
  // Pasamos el usuario detectado (si existe) al contexto de GraphQL
  context: {
    user: req.user
  }
})));

app.get('/', (req, res) => {
    res.send('¡Hola! El servidor backend del Producto 3 está funcionando 🚀');
});

connectDB().then(() => {
  app.listen(PORT, () => {
      console.log(`Servidor escuchando en http://localhost:${PORT}`);
      console.log(`Prueba GraphQL en http://localhost:${PORT}/graphql`);
  });
});
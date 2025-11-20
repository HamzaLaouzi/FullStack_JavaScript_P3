const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { schema, root } = require('./schema');
const { connectDB } = require('./database'); // <--- NUEVO: Importamos la conexión

const app = express();
const PORT = 3000;

app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: root,
  graphiql: true
}));

app.get('/', (req, res) => {
    res.send('¡Hola! El servidor backend del Producto 3 está funcionando 🚀');
});

// 1. Primero conectamos a la base de datos
connectDB().then(() => {
  // 2. Solo si conecta bien, arrancamos el servidor
  app.listen(PORT, () => {
      console.log(`Servidor escuchando en http://localhost:${PORT}`);
      console.log(`Prueba GraphQL en http://localhost:${PORT}/graphql`);
  });
});
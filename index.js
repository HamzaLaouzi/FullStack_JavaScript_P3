// Herramientas -----------------------------------------------------------------------------------------------------
const dotenv = require('dotenv'); // variables de entorno
dotenv.config(); // cargar configuración
const express = require('express'); // crear el servidor web
const {graphqlHTTP} = require('express-graphql'); // manejar graphql
const {ruruHTML} = require('ruru/server'); // para probar graphql
const cors = require('cors'); // permitir peticiones desde postman
const {MongoClient} = require('mongodb'); // driver mongodb
// modulos -----------------------------------------------------------------------------------------------------------
const { connectDB } = require('./mongo'); // conectar con mongodb
const { verifyToken } = require("./auth"); // autenticacion
const schema = require('./graphql/schema'); // define qué preguntar
const resolvers = require('./graphql/resolvers'); // define cómo responder
const userRoutes = require('./rutas/userRoutes'); // rutas rest users
const cardRoutes = require('./rutas/cardRoutes'); // rutas rest voluntariados

// Conexión con mongodb
const uri = process.env.MONGODB_URI;

// comprobación uri encontrada
if (!uri) {
    console.error('Eerror MONGODB_URI no está bien definida en el archivo .env');
    process.exit(1);
}
console.log('uri encontrada')

// Crear la aplicación con express -----------------------------------------------------------------------------------
const app = express();
const PORT = process.env.PORT || 4000; // puerto para correr el servidor

// Configurar procesadores -------------------------------------------------------------------------------------------
app.use(cors()); // permitir peticiones desde postman
app.use(express.json()); // para que express entienda json

// rutas rest --------------------------------------------------------------------------------------------------------
app.use('/api/users', userRoutes);
app.use('/api/cards', cardRoutes);

// Configurar graphql ------------------------------------------------------------------------------------------------
// ruta para la interfaz grafica ----------------------------------------
app.get('/', (_req, res) => {
  res.type('html');
  res.end(ruruHTML({endpoint: "/graphql"}));
});

// ruta para las consultas de graphql -------------------------------------
app.use('/graphql', graphqlHTTP(async (req) => {
    let user = null;
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) { // autenticacion
        token = req.headers.authorization.split(' ')[1];
        if (token) {
            user = verifyToken(token);
        }
    }
    
    return {
        schema: schema,
        rootValue: resolvers,
        context: { user: user }, 
        graphiql: true, 
    };
}));

// ruta inicio -------------------------------------------------------------------------------------------------------
app.get('/api', async (_req, res) => {
  try {
    const db = await connectDB();
    const totalUsuarios = await db.collection('usuarios').countDocuments();
    const totalVoluntariados = await db.collection('voluntariados').countDocuments();
  
  res.json({
    mensaje: 'Servidor graphql en funcionamiento',
    endpoints: {
      graphql: '/graphql',
      interfaz: '/',
      estado: '/api/estado'
    },
    datos_en_mongodb: {
      usuarios: totalUsuarios,
      voluntariados: totalVoluntariados
    }
  });
 } catch (error) {
  res.status(500).json({
    error: 'Error al obtener los datos de mongodb',
    mensaje: error.message
  });
 } 
});

// reuta comprobación datos ----------------------------------------------------------------------------------------
app.get('/api/estado', async (_req, res) => {
  try {
    const db = await connectDB();;
    const estado = db ? 'Conectado' : 'Desconectado';
  
    const usuarios = await db.collection('usuarios').find().limit(3).toArray();
    const voluntariados = await db.collection('voluntariados').find().limit(3).toArray();
  
  res.json({
    message: 'servidor y bbdd en funcionamiento',
    estado_ddbb: estado,
    conexion_mongodb: 'activa',
    timestamp: new Date().toISOString(),
    api_rest_rutas: ['/api/users', '/api/cards'],
    graphql_endpoint: '/graphql',
    datos_en_mongodb: {
                usuarios: usuarios.map(u => ({ 
                    id: u._id.toString(), 
                    name: u.name, 
                    email: u.email 
                })),
                voluntariados: voluntariados.map(a => ({ 
                    id: a._id.toString(), 
                    title: a.title, 
                    autor: a.autor 
                }))
    }
  });
 } catch (error) {
  res.status(500).json({
    error: 'Error al obtener los datos de mongodb',
    mensaje: error.message
  });
 }
});

// errores --------------------------------------------------------------------------------------------------------
// ruta --------------------------------------------------------
app.use((req, res) => {
  res.status(404).json({
    error: 'la ruta no se encuentra',
    mensaje: `la ruta ${req.url} no existe`,
    rutas_validas: ['/graphql', '/', '/api', '/api/estado', '/api/users', '/api/cards']
  });
});

// servidor -----------------------------------------------------
app.use((error, req, res, next) => {
  console.error('error del servidor:', error.message);
  res.status(500).json({
    error: 'error interno del servidor',
    mensaje: error.message,
  });
});

// iniciar el servidor --------------------------------------------------------------------------------------------------
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el localhost: ${PORT}`);
  console.log(`Interfaz graphiqL en el localhost: ${PORT}/`);
  console.log(`🔧 Modo (dev/prod): ${process.env.NODE_ENV || 'desarrollo'}`);
  console.log(`Conectado a mongodb Atlas`);
  });






// Herramientas -----------------------------------------------------------------------------------------------------
const dotenv = require('dotenv'); // variables de entorno
dotenv.config(); // cargar configuración
const express = require('express'); // crear el servidor web
const {createHandler} = require('graphql-http/lib/use/express'); // manejar graphql sobre hhtp
const {ruruHTML} = require('ruru/server'); // para probar graphql
const cors = require('cors'); // permitir peticiones desde postman
const {MongoClient} = require('mongodb'); // driver mongodb

// Conexión con mongodb
const uri = process.env.MONGODB_URI;

// comprobación uri encontrada
if (!uri) {
    console.error('Eerror MONGODB_URI no está bien definida en el archivo .env');
    process.exit(1);
}
console.log('uri encontrada')

const client = new MongoClient(uri);
let db, usuariosCollection, voluntariadosCollection;

// Importar módulos --------------------------------------------------------------------------------------------------
const schema = require('./src/schemas/schema'); // define qué preguntar
const resolvers = require('./src/resolvers/resolvers'); // define cómo responder
// const {usuarios, voluntariados} = require('./src/datos/datos'); // datos iniciales (prueba inicial)

// Crear la aplicación con express -----------------------------------------------------------------------------------
const app = express();
const PORT = process.env.PORT || 4000; // puerto para correr el servidor

// Configurar procesadores -------------------------------------------------------------------------------------------
app.use(cors()); // permitir peticiones desde postman
app.use(express.json()); // para que express entienda json

// conectar con la bbdd ---------------------------------------------------------------------------------------------
async function conectarDB() {
    try {
      await client.connect();
      db = client.db('voluntariadosDB');
      usuariosCollection = db.collection('usuarios');
      voluntariadosCollection = db.collection('voluntariados');
      console.log('Conectado a mongodb');
      console.log(`Base de datos: ${db.databaseName}`);

      await db.command({ ping: 1 }); // ping prueba de conexión
      console.log('✅ Ping exitoso a MongoDB Atlas');

      try { // listar coleciones por favor funciona
            const colecciones = await db.listCollections().toArray();
            if (colecciones && Array.isArray(colecciones)) {
                const nombres = colecciones.map(c => c.name).join(', ');
                console.log(`colecciones disponibles: ${nombres}`);
            } else {
                console.log('no hay colecciones en la BBDD');
            }
        } catch (error) {
            console.log('error al listar colecciones');
        }
  } catch (error) {
      console.error('Error al conectar a mongodb:', error.message);
      console.error('detalles:', error);
      process.exit(1);
    }
  }

// Configurar graphql ------------------------------------------------------------------------------------------------
// ruta para la interfaz grafica -------------------------------------------
app.get('/', (_req, res) => {
  res.type('html');
res.end(ruruHTML({endpoint: "/graphql"}));
});

// ruta para las consultas de graphql -------------------------------------
app.all('/graphql', createHandler({
  schema: schema, // esquema graphql
  rootValue: resolvers, // funciones resolvers
  context: { // datos para los resolvers
    usuariosCollection,
    voluntariadosCollection
  },
  graphiql: true // habilitar la interfaz
}));

// ruta inicio -------------------------------------------------------------------------------------------------------
app.get('/api', async (_req, res) => {
  try {
    const totalUsuarios = await usuariosCollection.countDocuments();
    const totalVoluntariados = await voluntariadosCollection.countDocuments();
  
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
    const usuarios = await usuariosCollection.find({}).limit(3).toArray();
    const voluntariados = await voluntariadosCollection.find({}).limit(3).toArray();
  
  res.json({
    estado: 'ok',
    timestamp: new Date().toISOString(),
    conexion_mongodb: 'activa',
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
    rutas_validas: ['/graphql', '/', '/api', '/api/estado']
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
async function iniciarServidor() {
    try {
        await conectarDB();
        app.listen(PORT, () => {
            console.log(`Servidor corriendo en el localhost: ${PORT}`);
            console.log(`Interfaz graphiqL en el localhost: ${PORT}/`);
            console.log(`🔧 Modo (dev/prod): ${process.env.NODE_ENV || 'desarrollo'}`);
            console.log(`Conectado a mongodb Atlas`);
        });
        
    } catch (error) {
        console.error('error al iniciar el servidor:', error.message);
        process.exit(1);
    }
}

//verificación uri por favor funcionaaaaaa
if (!process.env.MONGODB_URI) {
    console.error('mongodb uri no funciona');
    process.exit(1);
}
console.log('🔍 URI de MongoDB encontrada');

iniciarServidor();



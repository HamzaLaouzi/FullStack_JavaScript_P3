// Herramientas -----------------------------------------------------------------------------------------------------
const dotenv = require('dotenv'); // variables de entorno
dotenv.config(); // cargar configuración
const express = require('express'); // crear el servidor web
const {graphqlHTTP} = require('express-graphql'); // manejar graphql
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

// variables globales para las coleciones ----------------------------------------------------------------------------
let usuariosCollection, voluntariadosCollection;

// conectar con la bbdd ---------------------------------------------------------------------------------------------
async function conectarDB() {
    try {
      const client = new MongoClient(uri);
      await client.connect();
      const db = client.db('voluntariadosDB');
      usuariosCollection = db.collection('usuarios');
      voluntariadosCollection = db.collection('voluntariados');
      console.log('Conectado a mongodb');
      console.log(`Base de datos: ${db.databaseName}`);

      await db.command({ ping: 1 }); // ping prueba de conexión
      console.log('ping con éxito a mongodb');

      try { // listar coleciones por favor funciona
            const colecciones = await db.listCollections().toArray();
            if (colecciones && Array.isArray(colecciones)) {
                const nombres = colecciones.map(c => c.name).join(', ');
                console.log(`colecciones disponibles: ${nombres}`);
            } else {
                console.log('no hay colecciones en la BBDD');
            }
        } catch (error) {
            console.log('error al listar colecciones', error.message);
        }
        return { usuariosCollection, voluntariadosCollection };
  } catch (error) {
      console.error('Error al conectar a mongodb:', error.message);
      console.error('detalles:', error);
      process.exit(1);
    }
  }

// Configurar graphql ------------------------------------------------------------------------------------------------
async function iniciarServidor() {
  try {
    const collections = await conectarDB();

    global.usuariosCollection = collections.usuariosCollection;
    global.voluntariadosCollection = collections.voluntariadosCollection;
    console.log('Conexiones en global ----------'); // verificar
    // verificacion variables globales
     try {
      const countUsuarios = await global.usuariosCollection.countDocuments();
      const countVoluntariados = await global.voluntariadosCollection.countDocuments();
      console.log(`users en la bbdd: ${countUsuarios}`);
      console.log(`voluntariados en la bbdd: ${countVoluntariados}`);
    } catch (error) {
      console.error('error al buscar elementos:', error.message);
    }

    //guardar colecciones ------------------------------------------------
    //usuariosCollection = collections.usuariosCollection;
    //voluntariadosCollection = collections.voluntariadosCollection;

    // verificacion de colecciones definidas ------------------------------
    console.log('usuariosCollection:', usuariosCollection ? 'Definida' : 'Undefined');
    console.log('voluntariadosCollection:', voluntariadosCollection ? 'Definida' : 'Undefined');
    
    if (!usuariosCollection || !voluntariadosCollection) {
      throw new Error('Las colecciones de MongoDB no se definieron correctamente');
    }

  
    // ruta para la interfaz grafica ----------------------------------------
app.get('/', (_req, res) => {
  res.type('html');
  res.end(ruruHTML({endpoint: "/graphql"}));
});

// ruta para las consultas de graphql -------------------------------------
app.use('/graphql', graphqlHTTP({
  schema: schema,
  rootValue: resolvers,
  graphiql: true
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
    app.listen(PORT, () => {
        console.log(`Servidor corriendo en el localhost: ${PORT}`);
        console.log(`Interfaz graphiqL en el localhost: ${PORT}/`);
        console.log(`🔧 Modo (dev/prod): ${process.env.NODE_ENV || 'desarrollo'}`);
        console.log(`Conectado a mongodb Atlas`);
    });
        
} catch (error){
    console.error('error al iniciar el servidor:', error.message);
    process.exit(1);
}
}

iniciarServidor();


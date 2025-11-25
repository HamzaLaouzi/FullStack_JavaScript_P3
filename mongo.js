const { MongoClient } = require("mongodb"); // Importamos MongoClient desde mongodb

const uri = "mongodb://localhost:27017"; // URI de conexión a MongoDB local
const client = new MongoClient(uri); // Cliente de MongoDB

let db; // Variable para almacenar la instancia de la base de datos

/**
 * Conecta a la base de datos MongoDB si no existe una conexión activa.
 *
 * @async
 * @function
 * @returns {Promise<Object>} Retorna la instancia de la base de datos conectada.
 * @throws {Error} Lanza un error si la conexión falla.
 * @example
 * const { connectDB } = require('./db');
 * const db = await connectDB();
 */
async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db("voluntariado"); // Nombre de la base de datos
    console.log("🟢 Conectado a MongoDB");
  }
  return db;
}

module.exports = { connectDB };
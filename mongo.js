const { MongoClient } = require("mongodb");

const uri = "mongodb+srv://edumrgz_db_user:fullstackp3@cluster0.rrfihtl.mongodb.net/voluntariadosDB?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);

let db;

/**
 * Conecta a mongodb
 * @async
 */
async function connectDB() {
  if (!db) {
    try {
      await client.connect();
      db = client.db("voluntariadosDB");
      console.log("Conectado a mongo db");
    } catch (error) {
      console.error("Error al conectar con mongodb:", error);
      throw error;
    }
  }
  return db;
}

module.exports = { connectDB };
const { MongoClient } = require('mongodb');
require('dotenv').config();

// Usa la variable de entorno o local por defecto
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const dbName = "ruedas_esperanza"; // Nombre consistente de tu BD

let client;
let db; // Variable para almacenar la instancia de la base de datos (Singleton)

async function connectDB() {
  // Si ya existe una conexión, la devolvemos inmediatamente (Singleton)
  if (db) return db;

  try {
    client = new MongoClient(uri);
    await client.connect();
    
    db = client.db(dbName);
    console.log(`Conectado a MongoDB en: ${dbName}`);
    return db;
  } catch (error) {
    console.error("Error fatal conectando a MongoDB:", error);
    process.exit(1); // Detenemos la app si no hay base de datos
  }
}

// Función auxiliar opcional por si necesitas acceder sin await en otros sitios (avanzado)
function getDB() {
    if (!db) throw new Error("La base de datos no está inicializada");
    return db;
}

module.exports = { connectDB, getDB };
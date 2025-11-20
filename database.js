const { MongoClient } = require('mongodb');
require('dotenv').config();

// Recuperamos la URL de conexión del archivo .env
const uri = process.env.MONGO_URI;

let db;

async function connectDB() {
  if (db) return db; // Si ya estamos conectados, devuelve la conexión existente

  try {
    const client = new MongoClient(uri);
    await client.connect();
    
    // Nombre de la base de datos: 'ruedas_esperanza'
    db = client.db('ruedas_esperanza'); 
    console.log("Conectado a MongoDB");
    return db;
  } catch (error) {
    console.error("Error conectando a MongoDB:", error);
    process.exit(1); // Detener la applicacion si no encontramos BBDD
  }
}

function getDB() {
  if (!db) {
    throw new Error('La base de datos no está inicializada. Llama a connectDB primero.');
  }
  return db;
}

module.exports = { connectDB, getDB };
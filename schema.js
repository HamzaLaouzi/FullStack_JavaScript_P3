const { buildSchema } = require('graphql');
const { getDB } = require('./database');
const { ObjectId } = require('mongodb'); // <--- NUEVO: Importante para buscar por ID

const schema = buildSchema(`
  type Usuario {
    id: ID
    name: String
    email: String
  }

  type Voluntariado {
    id: ID
    date: String
    title: String
    description: String
    autor: String
    email: String
    volunType: String
  }

  type Query {
    getUsuarios: [Usuario]
    getVoluntariados: [Voluntariado]
  }

  type Mutation {
    addUsuario(name: String!, email: String!, password: String!): Usuario
    addVoluntariado(date: String!, title: String!, description: String!, autor: String!, email: String!, volunType: String!): Voluntariado
    
    # --- NUEVO: Mutaciones para borrar ---
    deleteUsuario(id: ID!): String
    deleteVoluntariado(id: ID!): String
  }
`);

const root = {
  // --- CONSULTAS (READ) ---
  getUsuarios: async () => {
    const db = getDB();
    const usuarios = await db.collection('usuarios').find().toArray();
    return usuarios.map(user => ({ ...user, id: user._id.toString() }));
  },
  
  getVoluntariados: async () => {
    const db = getDB();
    const voluntariados = await db.collection('voluntariados').find().toArray();
    return voluntariados.map(vol => ({ ...vol, id: vol._id.toString() }));
  },

  // --- MUTACIONES (CREATE) ---
  addUsuario: async ({ name, email, password }) => {
    const db = getDB();
    const newUser = { name, email, password };
    const result = await db.collection('usuarios').insertOne(newUser);
    return { ...newUser, id: result.insertedId.toString() };
  },

  addVoluntariado: async ({ date, title, description, autor, email, volunType }) => {
    const db = getDB();
    const newVoluntariado = { date, title, description, autor, email, volunType };
    const result = await db.collection('voluntariados').insertOne(newVoluntariado);
    return { ...newVoluntariado, id: result.insertedId.toString() };
  },

  // --- MUTACIONES (DELETE) ---
  deleteUsuario: async ({ id }) => {
    const db = getDB();
    // Convertimos el String 'id' a un ObjectId de Mongo para poder borrarlo
    await db.collection('usuarios').deleteOne({ _id: new ObjectId(id) });
    return "Usuario eliminado correctamente";
  },

  deleteVoluntariado: async ({ id }) => {
    const db = getDB();
    await db.collection('voluntariados').deleteOne({ _id: new ObjectId(id) });
    return "Voluntariado eliminado correctamente";
  }
};

module.exports = { schema, root };
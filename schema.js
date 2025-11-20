const { buildSchema } = require('graphql');
const { getDB } = require('./database');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs'); // Para encriptar
const jwt = require('jsonwebtoken'); // Para el token

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

  # Tipo especial para la respuesta del Login
  type AuthData {
    userId: ID
    token: String
    tokenExpiration: Int
  }

  type Query {
    getUsuarios: [Usuario]
    getVoluntariados: [Voluntariado]
    # Login suele ser una Query en algunos diseños, pero como genera un token nuevo, usaremos Mutation mejor
  }

  type Mutation {
    addUsuario(name: String!, email: String!, password: String!): Usuario
    
    # Mutación para Loguearse
    login(email: String!, password: String!): AuthData

    addVoluntariado(date: String!, title: String!, description: String!, autor: String!, email: String!, volunType: String!): Voluntariado
    
    # Mutaciones protegidas
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

  // --- MUTACIONES (CREATE / LOGIN) ---
  
  // 1. REGISTRO CON HASH
  addUsuario: async ({ name, email, password }) => {
    const db = getDB();
    
    // Verificar si ya existe
    const existingUser = await db.collection('usuarios').findOne({ email });
    if (existingUser) {
      throw new Error('El usuario ya existe.');
    }

    // Encriptar contraseña (Hash)
    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = { name, email, password: hashedPassword };
    const result = await db.collection('usuarios').insertOne(newUser);
    
    return { ...newUser, id: result.insertedId.toString() };
  },

  // 2. LOGIN (Generar Token)
  login: async ({ email, password }) => {
    const db = getDB();
    const user = await db.collection('usuarios').findOne({ email });
    
    if (!user) {
      throw new Error('Usuario no encontrado.');
    }

    // Comparamos la contraseña plana con la encriptada
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      throw new Error('Contraseña incorrecta.');
    }

    // Si es correcta, creamos el token
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // El token caduca en 1 hora
    );

    return { userId: user._id.toString(), token: token, tokenExpiration: 1 };
  },

  addVoluntariado: async ({ date, title, description, autor, email, volunType }) => {
    const db = getDB();
    const newVoluntariado = { date, title, description, autor, email, volunType };
    const result = await db.collection('voluntariados').insertOne(newVoluntariado);
    return { ...newVoluntariado, id: result.insertedId.toString() };
  },

  // --- MUTACIONES PROTEGIDAS (DELETE) ---
  
  deleteUsuario: async ({ id }, context) => {
    // VERIFICACIÓN DE SEGURIDAD
    if (!context.user) {
      throw new Error('No autenticado. Debes hacer login primero.');
    }

    const db = getDB();
    await db.collection('usuarios').deleteOne({ _id: new ObjectId(id) });
    return "Usuario eliminado correctamente";
  },

  deleteVoluntariado: async ({ id }, context) => {
    // VERIFICACIÓN DE SEGURIDAD
    if (!context.user) {
      throw new Error('No autenticado. Debes hacer login primero.');
    }

    const db = getDB();
    await db.collection('voluntariados').deleteOne({ _id: new ObjectId(id) });
    return "Voluntariado eliminado correctamente";
  }
};

module.exports = { schema, root };
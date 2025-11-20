const { buildSchema } = require('graphql');
const { getDB } = require('./database');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs'); // Para encriptar contraseñas
const jwt = require('jsonwebtoken'); // Para generar tokens JWT

/**
 * Definición del Esquema de GraphQL (Schema).
 * Aquí se definen los tipos de datos, las consultas (Query) y las mutaciones (Mutation).
 */
const schema = buildSchema(`
  type Usuario {
    id: ID!
    name: String!
    email: String!
    # Por seguridad, nunca devolvemos la contraseña
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

  # Tipo especial para devolver el token de sesión
  type AuthData {
    userId: ID
    token: String
    tokenExpiration: Int
  }

  type Query {
    getUsuarios: [Usuario]
    getVoluntariados: [Voluntariado]
  }

  type Mutation {
    # Registro de usuario (encriptando contraseña)
    addUsuario(name: String!, email: String!, password: String!): Usuario
    
    # Inicio de sesión (devuelve token)
    login(email: String!, password: String!): AuthData

    # Gestión de voluntariados
    addVoluntariado(date: String!, title: String!, description: String!, autor: String!, email: String!, volunType: String!): Voluntariado
    
    # Mutaciones protegidas (requieren token)
    deleteUsuario(id: ID!): String
    deleteVoluntariado(id: ID!): String
  }
`);

/**
 * Objeto Root Resolver.
 * Contiene la lógica de negocio para resolver las peticiones del esquema.
 * Interactúa con MongoDB y maneja la seguridad.
 */
const root = {
  // --- CONSULTAS (READ) ---

  /**
   * Obtiene la lista de todos los usuarios registrados.
   * @returns {Promise<Array>} Array de objetos Usuario.
   */
  getUsuarios: async () => {
    const db = getDB();
    const usuarios = await db.collection('usuarios').find().toArray();
    return usuarios.map(user => ({ ...user, id: user._id.toString() }));
  },
  
  /**
   * Obtiene la lista de todos los voluntariados (ofertas y peticiones).
   * @returns {Promise<Array>} Array de objetos Voluntariado.
   */
  getVoluntariados: async () => {
    const db = getDB();
    const voluntariados = await db.collection('voluntariados').find().toArray();
    return voluntariados.map(vol => ({ ...vol, id: vol._id.toString() }));
  },

  // --- MUTACIONES (CREATE / LOGIN) ---
  
  /**
   * Registra un nuevo usuario en la base de datos.
   * Verifica duplicados y encripta la contraseña antes de guardar.
   * @param {Object} args - Argumentos: name, email, password.
   * @returns {Promise<Object>} El usuario creado (sin password).
   */
  addUsuario: async ({ name, email, password }) => {
    const db = getDB();
    
    // 1. Verificar si el usuario ya existe
    const existingUser = await db.collection('usuarios').findOne({ email });
    if (existingUser) {
      throw new Error('El usuario ya existe con este email.');
    }

    // 2. Encriptar contraseña (Hash) con factor de coste 12
    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = { name, email, password: hashedPassword };
    const result = await db.collection('usuarios').insertOne(newUser);
    
    return { ...newUser, id: result.insertedId.toString() };
  },

  /**
   * Autentica un usuario verificando sus credenciales.
   * @param {Object} args - Argumentos: email, password.
   * @returns {Promise<Object>} Objeto con userId, token y tiempo de expiración.
   */
  login: async ({ email, password }) => {
    const db = getDB();
    const user = await db.collection('usuarios').findOne({ email });
    
    if (!user) {
      throw new Error('Usuario no encontrado.');
    }

    // Comparar la contraseña introducida con la encriptada en BD
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      throw new Error('Contraseña incorrecta.');
    }

    // Generar Token JWT válido por 1 hora
    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } 
    );

    return { userId: user._id.toString(), token: token, tokenExpiration: 1 };
  },

  /**
   * Añade un nuevo voluntariado.
   * @param {Object} args - Datos del voluntariado.
   * @returns {Promise<Object>} El voluntariado creado.
   */
  addVoluntariado: async ({ date, title, description, autor, email, volunType }) => {
    const db = getDB();
    const newVoluntariado = { date, title, description, autor, email, volunType };
    const result = await db.collection('voluntariados').insertOne(newVoluntariado);
    return { ...newVoluntariado, id: result.insertedId.toString() };
  },

  // --- MUTACIONES PROTEGIDAS (DELETE) ---
  
  /**
   * Elimina un usuario por su ID.
   * REQUIERE AUTENTICACIÓN (Token válido).
   * @param {Object} args - ID del usuario a borrar.
   * @param {Object} context - Contexto de la petición (contiene info del usuario autenticado).
   * @returns {Promise<String>} Mensaje de confirmación.
   */
  deleteUsuario: async ({ id }, context) => {
    // Verificación de seguridad: ¿Existe usuario en el contexto?
    if (!context.user) {
      throw new Error('No autenticado. Debes hacer login y enviar el token Bearer.');
    }

    const db = getDB();
    await db.collection('usuarios').deleteOne({ _id: new ObjectId(id) });
    return "Usuario eliminado correctamente";
  },

  /**
   * Elimina un voluntariado por su ID.
   * REQUIERE AUTENTICACIÓN (Token válido).
   * @param {Object} args - ID del voluntariado.
   * @param {Object} context - Contexto de la petición.
   * @returns {Promise<String>} Mensaje de confirmación.
   */
  deleteVoluntariado: async ({ id }, context) => {
    if (!context.user) {
      throw new Error('No autenticado. Debes hacer login y enviar el token Bearer.');
    }

    const db = getDB();
    await db.collection('voluntariados').deleteOne({ _id: new ObjectId(id) });
    return "Voluntariado eliminado correctamente";
  }
};

module.exports = { schema, root };
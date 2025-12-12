const {buildSchema} = require('graphql');

// esquema principal para definir tipos de datos, querys y mutations ---------------------------------------------------------------------------
const schema = buildSchema(`
  type User {
  id:ID!
  name:String!
  email:String!
  password:String!
  createdAt:String!
  }

  type Voluntariado {
  id:ID!
  date:String!
  title:String!
  description:String!
  autor:String!
  email:String!
  volunType:String!
  createdAt:String!
  }

  input UserInput {
  name:String!
  email:String!
  password:String!
  }

  input VoluntariadoInput {
  title:String!
  description:String!
  autor:String!
  date:String!
  email:String!
  volunType:String!
  }

  type Query {
  # busca usuarios y devuelve array --------------------------
  usuarios: [User]

  # busca usuario por id y devuelve el usuario ---------------
  usuario(id: ID!): User

  # busca usuario por email y devuelve el usuario ------------
  usuarioPorEmail(email: String!): User

  # busca voluntariados y devuelve array ---------------------  
  voluntariados: [Voluntariado]

  # busca voluntariado por id y devuelve el voluntariado ------
  voluntariado(id: ID!): Voluntariado

  # busca voluntariado por tipo y devuelve array --------------
  voluntariadosPorTipo(tipo: String!): [Voluntariado]

  # busca voluntariado por autor y devuelve array -------------
  voluntariadosPorAutor(email: String!): [Voluntariado]
}

type Mutation {
  # crear usuario y devuelve usuario creado -------------------
  crearUsuario(input: UserInput!): User

  # editar usuario y devuelve usuario updated -----------------
  actualizarUsuario(id: ID!, input: UserInput): User

  # eliminar usuario y devuleve Uusario eliminado -------------
  eliminarUsuario(id: ID!): User

  # crear voluntariado y devuelve voluntariado creado ---------
  crearVoluntariado(input: VoluntariadoInput!): Voluntariado

  # editar voluntariado y devuelve voluntariado updated -------
  actualizarVoluntariado(id: ID!, input: VoluntariadoInput): Voluntariado

  # eliminar voluntariado y devuelve voluntariado eliminado ---
  eliminarVoluntariado(id: ID!): Voluntariado
  }
`);

module.exports = schema;
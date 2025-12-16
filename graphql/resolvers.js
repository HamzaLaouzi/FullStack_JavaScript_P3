const bcrypt = require("bcryptjs"); // libreria contraseñas
const { ObjectId } = require('mongodb'); // manejo ids mongodb
const { GraphQLError } = require('graphql');// manejo errores graphql

// importacion modulos
const { connectDB } = require('../mongo'); // conexion con mongodb
const { generateToken } = require('../auth'); // generador de tokens jwt

/**
 * resolvers para operaciones de graphql y crud ususarios y voluntariados
 * @module resolvers
 */

const resolvers = {
  // querys ----------------------------------------------------------------------------------------------------------------------------------------------
  // obtener los usuarios ----------------------------------------------------------------
  usuarios: async () => {
    try {
      const db = await connectDB();
      const usuarios = await db.collection('usuarios').find().toArray();
      return usuarios.map(usuario => ({
        ...usuario,
        id: usuario._id.toString()
      }));
    } catch (error) {
      throw new GraphQLError(`Error al obtener los usuarios: ${error.message}`);
    }
  },

  // buscar usuarios por id --------------------------------------------------------------
  usuario: async (args) => {    
    const { id } = args;
    
    if (!id) {
      throw new GraphQLError('El parametro ID es necesario');
    }
    
    try {
      if (!ObjectId.isValid(id)) {
        throw new GraphQLError(`"${id}" no es un ID valido para mongodb`);
      }
      
      const db = await connectDB();
      const usuario = await db.collection('usuarios').findOne({
        _id: new ObjectId(id)
      });
      
      if (!usuario) {
        return null;
      }
      
      return {
        ...usuario,
        id: usuario._id.toString()
      };
    } catch (error) {
      throw new GraphQLError(`Error al buscar el usuario: ${error.message}`);
    }
  },

  // buscar usuario por email ------------------------------------------------------------
  usuarioPorEmail: async (args) => {
    const { email } = args;

    if (!email) {
      throw new GraphQLError('el parametro email es ncesario');
    }

    try {
      const db = await connectDB();
      const usuario = await db.collection('usuarios').findOne({ email });
      
      if (!usuario) {
        return null;
      }
      
      return {
        ...usuario,
        id: usuario._id.toString()
      };
    } catch (error) {
      throw new GraphQLError(`Error al buscar el usuario por email: ${error.message}`);
    }
  },

  // obtener los voluntariados -----------------------------------------------------------
  voluntariados: async () => {
    try {
      const db = await connectDB();
      const voluntariados = await db.collection('voluntariados').find().toArray();
      return voluntariados.map(v => ({
        ...v,
        id: v._id.toString()
      }));
    } catch (error) {
      throw new GraphQLError(`Error al obtener los voluntariados: ${error.message}`);
    }
  },

  // buscar voluntariado por id ----------------------------------------------------------
  voluntariado: async (args) => {
    const { id } = args;
    
    if (!id) {
      throw new GraphQLError('Se requiere el parámetro ID');
    }
    
    try {
      if (!ObjectId.isValid(id)) {
        throw new GraphQLError(`"${id}" no es un ID válido de MongoDB`);
      }
      
      const db = await connectDB();
      const voluntariado = await db.collection('voluntariados').findOne({
        _id: new ObjectId(id)
      });
      
      if (!voluntariado) {
        return null;
      }
      
      return {
        ...voluntariado,
        id: voluntariado._id.toString()
      };
    } catch (error) {
      throw new GraphQLError(`Error al buscar el voluntariado: ${error.message}`);
    }
  },

  // buscar voluntariados por tipo -------------------------------------------------------
  voluntariadosPorTipo: async (args) => {
    const { tipo } = args;

    if (!tipo) {
      throw new GraphQLError('el parametro tipo es necesario');
    }

    try {
      const db = await connectDB();
      const voluntariados = await db.collection('voluntariados').find({ volunType: tipo }).toArray();
      return voluntariados.map(v => ({
        ...v,
        id: v._id.toString()
      }));
    } catch (error) {
      throw new GraphQLError(`Error al buscar por tipo: ${error.message}`);
    }
  },

  // buscar voluntariados por autor ------------------------------------------------------
  voluntariadosPorAutor: async (args) => {
    const { email } = args;

    if (!email) {
      throw new GraphQLError('el parametro email es necesario');
    }

    try {
      const db = await connectDB();
      const voluntariados = await db.collection('voluntariados').find({ email: email }).toArray();
      return voluntariados.map(v => ({
        ...v,
        id: v._id.toString()
      }));
    } catch (error) {
      throw new GraphQLError(`Error al buscar por autor: ${error.message}`);
    }
  },

  // mutations -------------------------------------------------------------------------------------------------------------------------------------------

  // inicio de sesión autenticado -------------------------------------------------------
  login: async (args) => {
    const { email, password } = args;

    try {
      const db = await connectDB();
      const usuario = await db.collection('usuarios').findOne({ email });

      if (!usuario) {
        throw new GraphQLError('El correo no es correcto', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const isPasswordValid = await bcrypt.compare(password, usuario.password);

      if (!isPasswordValid) {
        throw new GraphQLError('La contraseña no es correcta', {
          extensions: { code: 'UNAUTHENTICATED' },
        });
      }

      const token = generateToken({ id: usuario._id.toString(), email: usuario.email });
      return token;
    } catch (error) {
      if (error.extensions?.code === 'UNAUTHENTICATED') {
          throw error;
      }
      throw new GraphQLError(`Error, no se ha podido hacer login: ${error.message}`);
    }
  },

  // crear usuario ----------------------------------------------------------------------
  crearUsuario: async (args) => {
    const { input } = args;

    if (!input || !input.name || !input.email || !input.password) {
        throw new GraphQLError('los campos son obligatorios');
    }

    try {
      const db = await connectDB();
      const usersCol = db.collection('usuarios');

      const emailExiste = await usersCol.findOne({ email: input.email }); // comprobar si el email existe
      if (emailExiste) {
        throw new GraphQLError('Este correo ya tiene una cuenta', {
          extensions: { code: 'BAD_USER_INPUT' },
        });
      }

      const hashedPassword = await bcrypt.hash(input.password, 10); //hash de la contraseña
      const nuevoUsuario = { // crear el usuario
        name: input.name,
        email: input.email,
        password: hashedPassword,
        createdAt: new Date().toISOString()
      };

      const result = await usersCol.insertOne(nuevoUsuario); // insertar en la bbdd
      
      return {
        ...nuevoUsuario,
        id: result.insertedId.toString()
      };
    } catch (error) {
      throw new GraphQLError(`Error al crear el usuario: ${error.message}`);
    }
  },

  // actualizar usuario -----------------------------------------------------------------
  actualizarUsuario: async (args) => {
    const { id, input } = args;
    try {
      if (!id || !input) {
        throw new GraphQLError('Se requiere el ID y el los nuevos datos en input"');
      }
      if (!ObjectId.isValid(id)) {
        throw new GraphQLError(`"${id}" no es un ID valido de mongodb`);
      }

      const db = await connectDB();
      const usersCol = db.collection('usuarios');
      let updateData = { ...input };

      if (updateData.password) { // hash contraseña si se cambia
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }
      
      delete updateData.email; // para no actualizar el email

      const usuarioActualizado = await usersCol.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: updateData },
        { returnDocument: 'after' }
      );

      if (!usuarioActualizado) {
        throw new GraphQLError(`Usuario con id ${id} no encontrado`);
      }

      return {
        ...usuarioActualizado,
        id: usuarioActualizado._id.toString()
      };
    } catch (error) {
      throw new GraphQLError(`Error al actualizar el usuario: ${error.message}`);
    }
  },

  // eliminar usuario -------------------------------------------------------------------
  eliminarUsuario: async (args) => {
    const { id } = args;
    try {
      if (!id) {
        throw new GraphQLError('Se requiere el ID como parametro');
      }
      if (!ObjectId.isValid(id)) {
        throw new GraphQLError(`"${id}" no es un ID valido de mongodb`);
      }

      const db = await connectDB();
      const usersCol = db.collection('usuarios');

      const usuarioAEliminar = await usersCol.findOne({ _id: new ObjectId(id) }); // buscael usuario
      if (!usuarioAEliminar) {
        throw new GraphQLError(`Usuario con id ${id} no encontrado`);
      }

      await usersCol.deleteOne({ _id: new ObjectId(id) }); // eliminar el usuario

      return {
        ...usuarioAEliminar,
        id: usuarioAEliminar._id.toString()
      };
    } catch (error) {
      throw new GraphQLError(`Error al eliminar el usuario: ${error.message}`);
    }
  },

  //crear voluntariado ----------------------------------------------------------------
  crearVoluntariado: async (args) => {
    const { input } = args;

    if (!input) throw new GraphQLError('nuevo input requerido');

    try {
      const db = await connectDB();
      const voluntariadoCol = db.collection('voluntariados');
      const usersCol = db.collection('usuarios');

      const usuarioExiste = await usersCol.findOne({ email: input.email });
      if (!usuarioExiste) {
        throw new GraphQLError('el usuario no existe');
      }

      const nuevoVoluntariado = {
        ...input,
        createdAt: new Date().toISOString()
      };

      const result = await voluntariadoCol.insertOne(nuevoVoluntariado);
      
      return {
        ...nuevoVoluntariado,
        id: result.insertedId.toString()
      };
    } catch (error) {
      throw new GraphQLError(`Error al crear el voluntariado: ${error.message}`);
    }
  },

  // actualizar voluntariado -----------------------------------------------------------
  actualizarVoluntariado: async (args) => {
    const { id, input } = args;

    if (!id || !input) {
        throw new GraphQLError('el ID y los nuevos datos son obligatorios');
    }

    try {
      if (!ObjectId.isValid(id)) {
        throw new GraphQLError(`"${id}" no es un ID valido de mongodb`);
      }

      const db = await connectDB();
      const voluntariadoCol = db.collection('voluntariados');
      
      const volunActualizado = await voluntariadoCol.findOneAndUpdate(
        { _id: new ObjectId(id) },
        { $set: input },
        { returnDocument: 'after' }
      );

      if (!volunActualizado) {
        throw new GraphQLError(`Voluntariado con id ${id} no encontrado`);
      }

      return {
        ...volunActualizado,
        id: volunActualizado._id.toString()
      };
    } catch (error) {
      throw new GraphQLError(`Error al actualizar el voluntariado: ${error.message}`);
    }
  },

  // eliminar voluntariado ------------------------------------------------------------
  eliminarVoluntariado: async (args) => {
    const { id } = args;
    try {
      if (!id) {
        throw new GraphQLError('Se requiere el ID como parametro');
      }
      if (!ObjectId.isValid(id)) {
        throw new GraphQLError(`"${id}" no es un ID valido de mongodb`);
      }

      const db = await connectDB();
      const voluntariadoCol = db.collection('voluntariados');

      // Buscar antes de eliminar para devolver el objeto eliminado
      const voluntariadoAEliminar = await voluntariadoCol.findOne({ _id: new ObjectId(id) });
      if (!voluntariadoAEliminar) {
        throw new GraphQLError(`Voluntariado con id ${id} no encontrado`);
      }

      // Eliminar el voluntariado
      await voluntariadoCol.deleteOne({ _id: new ObjectId(id) });

      return {
        ...voluntariadoAEliminar,
        id: voluntariadoAEliminar._id.toString()
      };
    } catch (error) {
      throw new GraphQLError(`Error al eliminar el voluntariado: ${error.message}`);
    }
  },
};

module.exports = resolvers;
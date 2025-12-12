const { ObjectId } = require('mongodb');

const resolvers = {
  // querys ----------------------------------------------------------------------------------------------------------------------------------------------
  // obtener los usuarios ----------------------------------------------------------------
  usuarios: async (_, __, context) => {
    try {
      const usuarios = await context.usuariosCollection.find().toArray();
      return usuarios.map(usuario => ({
        ...usuario,
        id: usuario._id.toString()
      }));
    } catch (error) {
      throw new Error(`Error al obtener los usuarios: ${error.message}`);
    }
  },

  // buscar usuarios por id --------------------------------------------------------------
  usuario: async (_, args, context) => {
    try {
      const usuario = await context.usuariosCollection.findOne({
        _id: new ObjectId(args.id)
      });
      if (!usuario) {
        throw new Error(`Usuario con id ${args.id} no encontrado`);
      }
      return {
        ...usuario,
        id: usuario._id.toString()
      };
    } catch (error) {
      throw new Error(`Error al buscar el usuario: ${error.message}`);
    }
  },

  // buscar usuario por email ------------------------------------------------------------
  usuarioPorEmail: async (_, args, context) => {
    try {
      const usuario = await context.usuariosCollection.findOne({
        email: args.email
      });
      if (!usuario) {
        throw new Error(`Usuario con email ${args.email} no encontrado`);
      }
      return {
        ...usuario,
        id: usuario._id.toString()
      };
    } catch (error) {
      throw new Error(`Error al buscar el usuario por email: ${error.message}`);
    }
  },

  // obtener los voluntariados -----------------------------------------------------------
  voluntariados: async(_, __, context) => {
    try {
      const voluntariados = await context.voluntariadosCollection.find().toArray();
      return voluntariados.map(v => ({
        ...voluntariado,
        id: voluntariado._id.toString()
      }));
    } catch (error) {
      throw new Error(`Error al obtener los voluntariados: ${error.message}`);
    }
  },

  // buscar voluntariado por id ----------------------------------------------------------
  voluntariado: async (_, args, context) => {
    try {
      const voluntariado = await context.voluntariadosCollection.findOne({
        _id: new ObjectId(args.id)
      });
      if (!voluntariado) {
        throw new Error(`Voluntariado con id ${args.id} no encontrado`);
      }
      return {
        ...voluntariado,
        id: voluntariado._id.toString()
      };
    } catch (error) {
      throw new Error(`Error al buscar el voluntariado: ${error.message}`);
    }
  },

  // buscar voluntariados por tipo -------------------------------------------------------
  voluntariadosPorTipo: async (_, args, context) => {
    try {
      const voluntariados = await context.voluntariadosCollection.find({
        volunType: args.tipo
      }).toArray();
       return voluntariados.map(v => ({
        ...voluntariado,
        id: voluntariado._id.toString()
      }));
    } catch (error) {
      throw new Error(`Error al buscar voluntariados por tipo: ${error.message}`);
    }
  },

  // buscar voluntariados por autor ------------------------------------------------------
  voluntariadosPorAutor: (_, args, context) => {
    try {
      const voluntariados = context.voluntariados.filter(a => a.email === args.email);
       return voluntariados.map(v => ({
        ...voluntariado,
        id: voluntariado._id.toString()
      }));
    } catch (error) {
      throw new Error(`Error al buscar voluntariados por autor: ${error.message}`);
    }
  },

  // mutations -------------------------------------------------------------------------------------------------------------------------------------------
  // crear usuario ----------------------------------------------------------------------
  crearUsuario: async (_, args, context) => {
    try {
      if (!args.input.name || !args.input.email || !args.input.password) { // validar datos de entrada
        throw new Error('Completa los campos son obligatorios');
      }

      const emailExiste = await context.usuariosCollection.findOne({ // comprobar que el email no existe
        email: args.input.email
      }); 
      if (emailExiste) {
        throw new Error('Este email ya tiene una cuenta');
      }

      const {generarId} = require('../datos/datos'); // generar el id
      const nuevoUsuario = {
        ...args.input,
        createdAt: new Date().toISOString()
      };
      const resultado = await context.usuariosCollection.insertOne(nuevoUsuario); // añadir a la base de datos
      return {
        ...nuevoUsuario,
        id: resultado.insertedId.toString()
      };
    } catch (error) {
      throw new Error(`Error al crear el usuario: ${error.message}`);
    }
  },

  // actualizar usuario -----------------------------------------------------------------
  actualizarUsuario: async (_, args, context) => {
    try {
      const usuarioExiste = context.usuariosCollection.findOne({ // buscar el usuario
        _id: new ObjectId(args.id)
      });
      
      if (!usuarioExiste) {
        throw new Error(`Usuario con id ${args.id} no encontrado`);
      }

      if (args.input.email) { // comprobar si el email ya existe
        const emailExistente = await context.usuariosCollection.findOne({
          email: args.input.email,
          _id: { $ne: new ObjectId(args.id) }
        });
        if (emailExistente) {
          throw new Error('Este email ya tiene una cuenta');
        }
      }

      await context.usuariosCollection.updateOne(
        { _id: new ObjectId(args.id) },
        { $set: args.input }
      );

      const actualizado = await context.usuariosCollection.findOne({
        _id: new ObjectId(args.id)
      });

      return {
        ...actualizado,
        id: actualizado._id.toString()
      };
    } catch (error) {
      throw new Error(`Error al actualizar el usuario: ${error.message}`);
    }
  },

  // eliminar usuario -------------------------------------------------------------------
  eliminarUsuario: async (_, args, context) => {
    try {
      const usuario = await context.usuariosCollection.findOne({ // buscar el usuario por índice
        _id: new ObjectId(args.id)
      });
      if (!usuario) {
        throw new Error(`Usuario con id ${args.id} no encontrado`);
      }

      await context.usuariosCollection.deleteOne({ // eliminar el usuario
        _id: new ObjectId(args.id)
      });

      await context.voluntariadosCollection.deleteMany({ // eliminar voluntariados del usuario eliminado
        email: usuario.email 
      });
      return {
        ...usuario,
        id: usuario._id.toString()
      };
    } catch (error) {
      throw new Error(`Error al eliminar el usuario: ${error.message}`);
    }
  },

  //crear voluntariado ----------------------------------------------------------------
  crearVoluntariado: async (_, args, context) => {
    try {
      const camposObligatorios = ['title', 'description', 'autor', 'date', 'email', 'volunType']; // validar datos
      for (const campo of camposObligatorios) {
        if (!args.input[campo]) {
          throw new Error(`El campo ${campo} es obligatorio`);
        }
      }

    const usuarioExiste = context.usuariosCollection.findOne({ // comprobar que el usuario exista
      email: args.input.email
    });
    if (!usuarioExiste) {
      throw new Error('No existe un usuario con este email');
    }

    const nuevoVoluntariado = {
      ...args.input,
      createdAt: new Date().toISOString()
    };

    const resultado = await context.voluntariadosCollection.insertOne(nuevoVoluntariado); // añadir a la memoria
    return {
      ...nuevoVoluntariado,
      id: resultado.insertedId.toString()
    };
  } catch (error) {
      throw new Error(`Error al crear el voluntariado: ${error.message}`);
    }
  },

  // actualizar voluntariado -----------------------------------------------------------
  actualizarVoluntariado: async(_, args, context) => {
    try {
      const voluntariadoExiste = context.voluntariadosCollection.findOne({ // buscar el voluntariado por índice
        _id: new ObjectId(args.id)
      });
      if (!voluntariadoExiste) {
        throw new Error(`Voluntariado con id ${args.id} no encontrado`);
      }

      if (args.input.email) { // comprobar que el título no se repita
        const tituloExistente = await context.voluntariadosCollection.findOne({
          title: args.input.title,
          _id: { $ne: new ObjectId(args.id) }
        });
        if (tituloExistente) {
          throw new Error('Ya existe un voluntariado con este título');
        }
      }

      await context.voluntariadosCollection.updateOne( // actualizar
        { _id: new ObjectId(args.id) },
        { $set: args.input }
      );

      const actualizado = await context.voluntariadosCollection.findOne({
        _id: new ObjectId(args.id)
      });

      return {
        ...actualizado,
        id: actualizado._id.toString()
      };
     } catch (error) {
      throw new Error(`Error al actualizar el voluntariado: ${error.message}`);
    }
  },

  // eliminar voluntariado -------------------------------------------------------------
  eliminarVoluntariado: async (_, args, context) => {
    try {
      const voluntariado = await context.voluntariadosCollection.findOne({ // buscar el voluntariado por índice
        _id: new ObjectId(args.id)
      });
      if (!voluntariado) {
        throw new Error(`Voluntariado con id ${args.id} no encontrado`);
      }

      await context.voluntariadosCollection.deleteOne({ // eliminar1 el voluntariado
        _id: new ObjectId(args.id)
      });

      return {
        ...voluntariado,
        id: voluntariado._id.toString()
    };
    } catch (error) {
      throw new Error(`Error al eliminar el voluntariado: ${error.message}`);
    }
  }
};

module.exports = resolvers;
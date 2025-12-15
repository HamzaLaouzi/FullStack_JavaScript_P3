const { ObjectId } = require('mongodb');

const resolvers = {
  // querys ----------------------------------------------------------------------------------------------------------------------------------------------
  // obtener los usuarios ----------------------------------------------------------------
  usuarios: async () => {
    // pruebas de contexto para depuracion    
    try {
      const usuarios = await global.usuariosCollection.find().toArray();
      return usuarios.map(usuario => ({
        ...usuario,
        id: usuario._id.toString()
      }));
    } catch (error) {
      throw new Error(`Error al obtener los usuarios: ${error.message}`);
    }
  },

  // buscar usuarios por id --------------------------------------------------------------
  usuario: async (parent, args) => {    
    console.log('debug - args recibidos en resolver usuario:', args);
    const queryArgs = parent;

    if (!queryArgs || !queryArgs.id) {
      throw new Error('se requiere el parametro ID');
    }
    
    const id = queryArgs.id;
    
    try {
    // Validaciones
    if (!ObjectId.isValid(id)) {
      throw new Error(`"${id}" no es un ID válido de MongoDB`);
    }
    
      const usuario = await global.usuariosCollection.findOne({
        _id: new ObjectId(id)
      });
      if (!usuario) {
        throw new Error(`Usuario con id ${id} no encontrado`);
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
  usuarioPorEmail: async (parent, args) => {
    const queryArgs = parent;
    if (!queryArgs || !queryArgs.email) {
      throw new Error('se requiere el parametro email');
    }
    const email = queryArgs.email;
    try {
      
      const usuario = await global.usuariosCollection.findOne({
        email: queryArgs.email
      });
      
      if (!usuario) {
        throw new Error(`Usuario con email ${email} no encontrado`);
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
  voluntariados: async() => {
    try {
      const voluntariados = await global.voluntariadosCollection.find().toArray();
      return voluntariados.map(v => ({
        ...v,
        id: v._id.toString()
      }));
    } catch (error) {
      throw new Error(`Error al obtener los voluntariados: ${error.message}`);
    }
  },

  // buscar voluntariado por id ----------------------------------------------------------
  voluntariado: async (parent, args) => {
    const queryArgs = parent; 
    try {
      if (!queryArgs || !queryArgs.id) {
        throw new Error('Se requiere el parámetro "id"');
      }
      
      const id = queryArgs.id;

      if (!ObjectId.isValid(id)) {
        throw new Error(`"${id}" no es un ID válido de MongoDB`);
      }
      
      const voluntariado = await global.voluntariadosCollection.findOne({
        _id: new ObjectId(id)
      });
      
      if (!voluntariado) {
        throw new Error(`Voluntariado con id ${id} no encontrado`);
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
  voluntariadosPorTipo: async (parent, args) => {
    const queryArgs = parent; 
    try {
      if (!queryArgs || !queryArgs.tipo) {
        throw new Error('Se requiere el parámetro "tipo"');
      }
      
      const voluntariados = await global.voluntariadosCollection.find({
        volunType: queryArgs.tipo
      }).toArray();
      
      return voluntariados.map(v => ({
        ...v,
        id: v._id.toString()
      }));
    } catch (error) {
      throw new Error(`Error al buscar voluntariados por tipo: ${error.message}`);
    }
  },

  // buscar voluntariados por autor ------------------------------------------------------
  voluntariadosPorAutor: async (parent, args) => {
    const queryArgs = parent; 
    try {
      if (!queryArgs || !queryArgs.email) {
        throw new Error('Se requiere el parámetro "email"');
      }
      
      const voluntariados = await global.voluntariadosCollection.find({
        email: queryArgs.email
      }).toArray();
      
      return voluntariados.map(v => ({
        ...v,
        id: v._id.toString()
      }));
    } catch (error) {
      throw new Error(`Error al buscar voluntariados por autor: ${error.message}`);
    }
  },

  // mutations -------------------------------------------------------------------------------------------------------------------------------------------
  // crear usuario ----------------------------------------------------------------------
  crearUsuario: async (parent, args) => {
    const mutationArgs = parent;
    try {
      if (!mutationArgs || !mutationArgs.input) {
        throw new Error('No se recibieron datos para crear el usuario');
      }
      
      if (!mutationArgs.input.name || !mutationArgs.input.email || !mutationArgs.input.password) {
        throw new Error('Los campos name, email y password son obligatorios');
      }

      const emailExiste = await global.usuariosCollection.findOne({
        email: mutationArgs.input.email
      });
      
      if (emailExiste) {
        throw new Error('Este email ya tiene una cuenta');
      }

      const nuevoUsuario = {
        ...mutationArgs.input,
        createdAt: new Date().toISOString()
      };
      const resultado = await global.usuariosCollection.insertOne(nuevoUsuario); // añadir a la base de datos
      return {
        ...nuevoUsuario,
        id: resultado.insertedId.toString()
      };
    } catch (error) {
      throw new Error(`Error al crear el usuario: ${error.message}`);
    }
  },

  // actualizar usuario -----------------------------------------------------------------
  actualizarUsuario: async (parent, args) => {
    const mutationArgs = parent;
    try {
      if (!mutationArgs || !mutationArgs.id) {
        throw new Error('Se requiere el parámetro "id"');
      }
      
      if (!ObjectId.isValid(mutationArgs.id)) {
        throw new Error(`"${mutationArgs.id}" no es un ID válido de mongo`);
      }
      
      const usuarioExiste = await global.usuariosCollection.findOne({
        _id: new ObjectId(mutationArgs.id)
      });
      
      if (!usuarioExiste) {
        throw new Error(`Usuario con id ${mutationArgs.id} no encontrado`);
      }

      if (mutationArgs.input && mutationArgs.input.email) {
        const emailExistente = await global.usuariosCollection.findOne({
          email: mutationArgs.input.email,
          _id: { $ne: new ObjectId(mutationArgs.id) }
        });
        
        if (emailExistente) {
          throw new Error('Este email ya tiene una cuenta');
        }
      }

      await global.usuariosCollection.updateOne(
        { _id: new ObjectId(mutationArgs.id) },
        { $set: mutationArgs.input }
      );

      const actualizado = await global.usuariosCollection.findOne({
        _id: new ObjectId(mutationArgs.id)
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
  eliminarUsuario: async (parent, args) => {
    const mutationArgs = parent; 
    try {
      if (!mutationArgs || !mutationArgs.id) {
        throw new Error('Se requiere el parámetro id');
      }
      
      if (!ObjectId.isValid(mutationArgs.id)) {
        throw new Error(`"${mutationArgs.id}" no es un ID válido de mongodb`);
      }
      
      const usuario = await global.usuariosCollection.findOne({
        _id: new ObjectId(mutationArgs.id)
      });
      
      if (!usuario) {
        throw new Error(`Usuario con id ${mutationArgs.id} no encontrado`);
      }

      await global.usuariosCollection.deleteOne({
        _id: new ObjectId(mutationArgs.id)
      });

      await global.voluntariadosCollection.deleteMany({
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
  crearVoluntariado: async (parent, args) => {
    const mutationArgs = parent;
    try {
      if (!mutationArgs || !mutationArgs.input) {
        throw new Error('No se recibieron datos para crear el voluntariado');
      }
      
      const camposObligatorios = ['title', 'description', 'autor', 'date', 'email', 'volunType'];
      for (const campo of camposObligatorios) {
        if (!mutationArgs.input[campo]) {
          throw new Error(`El campo ${campo} es obligatorio`);
        }
      }

    const usuarioExiste = await global.usuariosCollection.findOne({ // comprobar que el usuario exista
      email: mutationArgs.input.email
    });
    if (!usuarioExiste) {
      throw new Error('No existe un usuario con este email');
    }

    const nuevoVoluntariado = {
      ...mutationArgs.input,
      createdAt: new Date().toISOString()
    };

    const resultado = await global.voluntariadosCollection.insertOne(nuevoVoluntariado); // añadir a la memoria
    return {
      ...nuevoVoluntariado,
      id: resultado.insertedId.toString()
    };
  } catch (error) {
      throw new Error(`Error al crear el voluntariado: ${error.message}`);
    }
  },

  // actualizar voluntariado -----------------------------------------------------------
  actualizarVoluntariado: async(parent, args) => {
    const mutationArgs = parent;
    try {
      if (!mutationArgs || !mutationArgs.id) {
        throw new Error('Se requiere el parámetro "id"');
      }

      if (!ObjectId.isValid(mutationArgs.id)) {
        throw new Error(`"${mutationArgs.id}" no es un ID válido de MongoDB`);
      }
      
      const voluntariadoExiste = await global.voluntariadosCollection.findOne({
        _id: new ObjectId(mutationArgs.id)
      });
      
      if (!voluntariadoExiste) {
        throw new Error(`Voluntariado con id ${mutationArgs.id} no encontrado`);
      }

      if (mutationArgs.input && mutationArgs.input.title) { // comprobar que el título no se repita
        const tituloExistente = await global.voluntariadosCollection.findOne({
          title: mutationArgs.input.title,
          _id: { $ne: new ObjectId(mutationArgs.id) }
        });
        if (tituloExistente) {
          throw new Error('Ya existe un voluntariado con este título');
        }
      }

      await global.voluntariadosCollection.updateOne( // actualizar
        { _id: new ObjectId(mutationArgs.id) },
        { $set: mutationArgs.input }
      );

      const actualizado = await global.voluntariadosCollection.findOne({
        _id: new ObjectId(mutationArgs.id)
      });

      return {
        ...actualizado,
        id: actualizado._id.toString()
      };
     } catch (error) {
      throw new Error(`Error al actualizar el voluntariado: ${error.message}`);
    }
  },

  // eliminar voluntariado ------------------------------------------------------------
  eliminarVoluntariado: async (parent, args) => {
    const mutationArgs = parent;
    try {
      if (!mutationArgs || !mutationArgs.id) {
        throw new Error('Se requiere el parámetro "id"');
      }

      if (!ObjectId.isValid(mutationArgs.id)) {
        throw new Error(`"${mutationArgs.id}" no es un ID válido de MongoDB`);
      }

      const voluntariado = await global.voluntariadosCollection.findOne({ // buscar el voluntariado por índice
        _id: new ObjectId(mutationArgs.id)
      });
      if (!voluntariado) {
        throw new Error(`Voluntariado con id ${mutationArgs.id} no encontrado`);
      }

      await global.voluntariadosCollection.deleteOne({ // eliminar1 el voluntariado
        _id: new ObjectId(mutationArgs.id)
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
const { connectDB } = require("../mongo"); // para manejar ids de mongo
const bcrypt = require("bcryptjs"); // libreria contraseñas
const { ObjectId } = require('mongodb'); // manejo errores graphql

// obtener ususarios ------------------------------------------------
exports.getAllUsers = async (req, res) => {
  try {
    const db = await connectDB();
    const users = await db.collection('usuarios').find().toArray();
    const usersMapped = users.map(u => ({ ...u, id: u._id.toString() }));
    res.json(usersMapped);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los usuarios', error: error.message });
  }
};

// buscar usuario por id ---------------------------------------------
exports.getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'El id del usuario es invalido' });
    }
    const db = await connectDB();
    const user = await db.collection('usuarios').findOne({ _id: new ObjectId(id) });
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    res.json({ ...user, id: user._id.toString() });
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar usuario por id', error: error.message });
  }
};

// buscar usuario por email -------------------------------------------
exports.getUserByEmail = async (req, res) => {
  const { email } = req.body;
  try {
    const db = await connectDB();
    const user = await db.collection('usuarios').findOne({ email });
    
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    res.json({ ...user, id: user._id.toString() });
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar usuario por email', error: error.message });
  }
};

// crear usuario ------------------------------------------------
exports.createUser = async (req, res) => {
  const { name, email, password } = req.body;
  
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Completa los campos obligatorios' });
  }

  try {
    const db = await connectDB();
    const usersCol = db.collection('usuarios');

    const existingUser = await usersCol.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Este correo ya está registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = { 
      name, 
      email, 
      password: hashedPassword,
      createdAt: new Date().toISOString()
    };

    const result = await usersCol.insertOne(newUser);
    
    res.status(201).json({ 
      message: 'El usuario se ha creado correctamente',
      user: { ...newUser, id: result.insertedId.toString() }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear usuario', error: error.message });
  }
};

// actualizar usuario ------------------------------------------------
exports.updateUser = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'El id del usuario es invalido' });
    }

    const db = await connectDB();
    const usersCol = db.collection('usuarios');
    let dataToUpdate = { ...updateData };

    if (dataToUpdate.password) {
      dataToUpdate.password = await bcrypt.hash(dataToUpdate.password, 10);
    }
    
    delete dataToUpdate.email; 

    const result = await usersCol.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: dataToUpdate },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ message: 'El usuario se ha actualizado correctamente', user: { ...result.value, id: result.value._id.toString() } });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar usuario', error: error.message });
  }
};

// eliminar usuario ------------------------------------------------
exports.deleteUser = async (req, res) => {
  const { id } = req.params;
  
  try {
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'el id del usuario es invalido' });
    }
    
    const db = await connectDB();
    const result = await db.collection('usuarios').deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.json({ message: `El usuario se ha eliminado correctamente` });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar usuario', error: error.message });
  }
};
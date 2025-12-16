const { connectDB } = require('../mongo'); // para manejar ids de mongo
const { ObjectId } = require('mongodb'); // manejo errores graphql

// obtener los voluntariados --------------------------------
exports.getAllCards = async (req, res) => {
  try {
    const db = await connectDB();
    const cards = await db.collection('voluntariados').find().toArray();
    const cardsMapped = cards.map(c => ({ ...c, id: c._id.toString() }));
    res.json(cardsMapped);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener voluntariados', error: error.message });
  }
};

// buscar voluntariado por id ---------------------------------------------
exports.getCardById = async (req, res) => {
  const { id } = req.params;
  try {
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'el id del voluntariado es invalido' });
    }
    const db = await connectDB();
    const card = await db.collection('voluntariados').findOne({ _id: new ObjectId(id) });
    
    if (!card) {
      return res.status(404).json({ message: 'Voluntariado no encontrado' });
    }
    
    res.json({ ...card, id: card._id.toString() });
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar voluntariado', error: error.message });
  }
};

// buscar voluntariados por email del autor -----------------------------
exports.getCardsByEmail = async (req, res) => {
  const { email } = req.body;
  try {
    const db = await connectDB();
    const cards = await db.collection('voluntariados').find({ email: email }).toArray();
    const cardsMapped = cards.map(c => ({ ...c, id: c._id.toString() }));
    res.json(cardsMapped);
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar voluntariados por email', error: error.message });
  }
};

// buscar voluntariados por tipo -----------------------------------------
exports.getCardsByType = async (req, res) => {
  const { type } = req.body;
  try {
    const db = await connectDB();
    const cards = await db.collection('voluntariados').find({ volunType: type }).toArray();
    const cardsMapped = cards.map(c => ({ ...c, id: c._id.toString() }));
    res.json(cardsMapped);
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar voluntariados por tipo', error: error.message });
  }
};

// crear voluntariado - -------------------------------------------------
exports.createCard = async (req, res) => {
  const { date, title, description, autor, volunType, email } = req.body;
  
  if (!date || !title || !description || !autor || !volunType || !email) {
    return res.status(400).json({ message: 'completa los campos obligatorios' });
  }

  try {
    const db = await connectDB();
    const newCard = { 
      date, title, description, autor, volunType, email,
      createdAt: new Date().toISOString()
    };
    
    const result = await db.collection('voluntariados').insertOne(newCard);
    
    res.status(201).json({ 
      message: 'Voluntariado creado correctamente',
      card: { ...newCard, id: result.insertedId.toString() }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear voluntariado', error: error.message });
  }
};

// actualizar voluntariado ------------------------------------------------
exports.updateCard = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'el id del voluntariado es invalido' });
    }

    const db = await connectDB();
    const result = await db.collection('voluntariados').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: updateData },
      { returnDocument: 'after' }
    );

    if (!result.value) {
      return res.status(404).json({ message: 'Voluntariado no encontrado' });
    }

    res.json({ message: 'el voluntariado se ha actualizado correctamente', card: { ...result.value, id: result.value._id.toString() } });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar voluntariado', error: error.message });
  }
};

// eliminar voluntariado ------------------------------------------------
exports.deleteCard = async (req, res) => {
  const { id } = req.params;
  
  try {
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'el id del voluntariado es invalido' });
    }
    
    const db = await connectDB();
    const result = await db.collection('voluntariados').deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Voluntariado no encontrado' });
    }

    res.json({ message: `Voluntariado con ID ${id} eliminado correctamente` });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar voluntariado', error: error.message });
  }
};
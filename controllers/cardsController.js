// Nota: Para operaciones reales, usa GraphQL en /graphql
// Estos endpoints REST son simples stubs

// Read
exports.getAllCards = (req, res) => {
  res.json({ message: 'Usa GraphQL para obtener tarjetas: POST /graphql' });
};

exports.getCardsByEmail = (req, res) => {
  res.json({ message: 'Usa GraphQL para consultas: POST /graphql' });
};

exports.getCardsByType = (req, res) => {
  res.json({ message: 'Usa GraphQL para consultas: POST /graphql' });
};

// Create
exports.createCard = (req, res) => {
  res.status(201).json({ message: 'Usa GraphQL para crear: POST /graphql' });
};

// Update
exports.updateCard = (req, res) => {
  res.json({ message: 'Usa GraphQL para actualizar: POST /graphql' });
};

// Delete
exports.deleteCard = (req, res) => {
  res.json({ message: 'Usa GraphQL para eliminar: POST /graphql' });
};
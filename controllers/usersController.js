/**
 * Obtiene y responde con el listado de usuarios.
 * @param {object} req - Solicitud HTTP (Request).
 * @param {object} res - Respuesta HTTP (Response).
 * @returns {void}
 */
exports.listUsers = (req, res) => {
  res.send('Listado de usuarios');
};

/**
 * Crea un nuevo usuario con los datos proporcionados en el body de la petición.
 * @param {object} req - Solicitud HTTP, incluye datos del usuario en req.body.
 * @param {object} res - Respuesta HTTP.
 * @returns {void}
 */
exports.createUser = (req, res) => {
  res.send('Usuario creado');
};

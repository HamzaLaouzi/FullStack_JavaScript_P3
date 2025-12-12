// usuarios iniciales -----------------------------------------------------------------------------------------
const usuarios = [
  {
    id: '1',
    name: 'Edu',
    email: 'edu@mail.com',
    password: '1234',
    createdAt: new Date('2024-01-01')
  },
  {
    id: '2',
    name: 'Jose',
    email: 'jose@mail.com',
    password: '1234',
    createdAt: new Date('2024-01-02')
  }
];

// voluntariados iniciales -------------------------------------------------------------------------------------
const voluntariados = [
  {
    id: '1',
    date: '01/10/2025',
    title: 'Limpiar casa',
    description: 'Ayuda limpiando una casa.',
    autor: 'Edu',
    email: 'edu@mail.com',
    volunType: 'Petición',
    createdAt: new Date('2024-01-10')
  },
  {
    id: '2',
    date: '02/10/2025',
    title: 'Compra',
    description: 'Ayudar a hacer la compra a una persona mayor.',
    autor: 'Jose',
    email: 'jose@mail.com',
    volunType: 'Oferta',
    createdAt: new Date('2024-01-11')
  },
  {
    id: '3',
    date: '02/10/2025',
    title: 'Desatasco',
    description: 'Ayudar a desatascar una tubería.',
    autor: 'Jose',
    email: 'jose@mail.com',
    volunType: 'Petición',
    createdAt: new Date('2024-01-12')
  }
];

// generación de ids para nuevos elementos ----------------------------------------------------------------
// a partir del timestamp ----------------------------------------------------
function generarId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// para encontrar el próximo id de manera secuencial -------------------------
function generarIdSecuencia(array) {
  const maxId = array.reduce((max, item) => {
    const idNum = parseInt(item.id);
  return idNum > max ? idNum : max;
  }, 0);
  return (maxId + 1).toString();
}

// exportación ---------------------------------------------------------------------------------------------
module.exports = {
  usuarios,
  voluntariados,
  generarId,
  generarIdSecuencia
};
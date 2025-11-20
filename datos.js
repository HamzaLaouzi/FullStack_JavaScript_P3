// Datos de usuarios en memoria
const usuarios = [
    {
        id: "1", // Añadimos IDs para identificar mejor
        name: 'Hamza',
        email: 'hamza@hamza.com',
        password: '123'
    },
    {
        id: "2",
        name: 'Carmen',
        email: 'carmen@carmen.com',
        password: '123'
    }
];

// Datos de voluntariados (anuncios) en memoria
const voluntariados = [
    {
        id: "1", // Añadimos IDs
        date: "01/10/2025",
        title: "Madrid",
        description: "Chico responsable se ofrece a llevar a nuestros mayores al hospital de fuenlabrada de L-V mañana",
        autor: 'Hamza',
        email: 'hamza@hamza.com',
        volunType: "Oferta"
    },
    {
        id: "2",
        date: "02/10/2025",
        title: "Valencia",
        description: "Chica responsable se ofrece a llevar a nuestros mayores al hospital de valencia de Lunes y miercoles mañana",
        autor: 'Carmen',
        email: 'carmen@carmen.com',
        volunType: "Oferta"
    },
    {
        id: "3",
        date: "02/10/2025",
        title: "Barcelona",
        description: "Se busca una chica responsable para llevar a nuestros mayores al hospital de barcelona los martes por la tarde",
        autor: 'Carmen',
        email: 'carmen@carmen.com',
        volunType: "Petición"
    }
];

module.exports = { usuarios, voluntariados };
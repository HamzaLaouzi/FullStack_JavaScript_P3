# 1. Usamos una imagen base ligera de Node.js
FROM node:18-alpine

# 2. Establecemos el directorio de trabajo dentro del contenedor
WORKDIR /app

# 3. Copiamos los archivos de dependencias primero (para aprovechar la caché de Docker)
COPY package*.json ./

# 4. Instalamos las dependencias
RUN npm install

# 5. Copiamos el resto del código de la aplicación
COPY . .

# 6. Exponemos el puerto 3000 (donde escucha tu servidor)
EXPOSE 3000

# 7. Comando para iniciar la aplicación
CMD ["node", "index.js"]
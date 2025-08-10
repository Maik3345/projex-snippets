const fs = require('fs');
const path = require('path');

// Carpeta a limpiar
const distFolder = path.join(__dirname, '..', 'dist');

console.log('Limpiando la carpeta dist...');

// Comprobar si la carpeta dist existe
if (fs.existsSync(distFolder)) {
  // Leer todos los archivos en la carpeta
  const files = fs.readdirSync(distFolder);
  
  // Eliminar cada archivo
  files.forEach(file => {
    const filePath = path.join(distFolder, file);
    if (fs.lstatSync(filePath).isFile()) {
      fs.unlinkSync(filePath);
      console.log(`Archivo eliminado: ${file}`);
    }
  });
  
  console.log('Carpeta dist limpiada correctamente.');
} else {
  // Crear la carpeta si no existe
  fs.mkdirSync(distFolder, { recursive: true });
  console.log('Carpeta dist creada.');
}

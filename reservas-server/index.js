// ✅ Importamos librerías
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

// ✅ Creamos la app
const app = express();
app.use(cors());
app.use(express.json());

// ✅ Conectamos o creamos la base de datos
const db = new sqlite3.Database('reservas.db', (err) => {
  if (err) {
    console.error('❌ Error al conectar con la base de datos:', err.message);
  } else {
    console.log('✅ Conectado a la base de datos reservas.db');
  }
});

// ✅ Creamos la tabla si no existe
db.run(`
  CREATE TABLE IF NOT EXISTS reservas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    evento TEXT,
    proveedor TEXT,
    fecha TEXT,
    email TEXT
  )
`);

// ✅ Ruta para obtener todas las reservas
app.get('/reservas', (req, res) => {
  db.all('SELECT * FROM reservas', [], (err, rows) => {
    if (err) {
      console.error('❌ Error al obtener reservas:', err.message);
      res.status(500).json({ error: 'Error al obtener reservas' });
    } else {
      res.json(rows);
    }
  });
});

// ✅ Ruta para guardar una nueva reserva
app.post('/reservas', (req, res) => {
  const { evento, proveedor, fecha, email } = req.body;

  if (!evento || !proveedor || !fecha || !email) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  db.run(
    'INSERT INTO reservas (evento, proveedor, fecha, email) VALUES (?, ?, ?, ?)',
    [evento, proveedor, fecha, email],
    function (err) {
      if (err) {
        console.error('❌ Error al guardar la reserva:', err.message);
        res.status(500).json({ error: 'Error al guardar la reserva' });
      } else {
        console.log('✅ Reserva guardada con éxito:', req.body);
        res.json({ message: 'Reserva guardada con éxito', id: this.lastID });
      }
    }
  );
});

// ✅ Servidor escuchando
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
});

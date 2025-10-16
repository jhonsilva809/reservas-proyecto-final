// ✅ BACKEND COMPLETO: CRUD + LOGIN + REGISTRO + ROLES + CORREO + SEGURIDAD
require('dotenv').config();
console.log('🧩 Código de admin cargado desde .env:', process.env.ADMIN_CODE);

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

const app = express();
app.use(cors());
app.use(express.json());

// 🔌 Conexión a la base de datos SQLite
const db = new sqlite3.Database(process.env.DB_PATH, (err) => {
  if (err) console.error('❌ Error al conectar a la base de datos:', err.message);
  else console.log(`✅ Conectado a la base de datos ${process.env.DB_PATH}`);
});

// 🧱 Crear tablas si no existen
db.run(`
  CREATE TABLE IF NOT EXISTS reservas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre_cliente TEXT,
    evento TEXT,
    proveedor TEXT,
    fecha TEXT,
    correo TEXT
  )
`);

db.run(`
  CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT,
    correo TEXT UNIQUE,
    password TEXT,
    rol TEXT DEFAULT 'usuario'
  )
`);

// ✉️ Configurar transporte de correo
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/* ──────────────────────────────
   🔹 CREATE - Crear nueva reserva
────────────────────────────────*/
app.post('/reservas', (req, res) => {
  const { nombre_cliente, evento, proveedor, fecha, correo } = req.body;

  if (!nombre_cliente || !evento || !proveedor || !fecha || !correo) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  db.run(
    'INSERT INTO reservas (nombre_cliente, evento, proveedor, fecha, correo) VALUES (?, ?, ?, ?, ?)',
    [nombre_cliente, evento, proveedor, fecha, correo],
    function (err) {
      if (err) {
        console.error('❌ Error al guardar reserva:', err.message);
        return res.status(500).json({ error: 'Error al guardar reserva' });
      }

      // 📧 Enviar correo de confirmación
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: correo,
        subject: '🎉 Confirmación de tu reserva',
        html: `
          <h2>¡Hola ${nombre_cliente}!</h2>
          <p>Tu reserva fue registrada con éxito:</p>
          <ul>
            <li><b>Evento:</b> ${evento}</li>
            <li><b>Proveedor:</b> ${proveedor}</li>
            <li><b>Fecha:</b> ${fecha}</li>
          </ul>
          <p>¡Gracias por confiar en nosotros!</p>
        `,
      };

      transporter.sendMail(mailOptions, (error) => {
        if (error) console.error('⚠️ Error al enviar correo:', error);
        else console.log('📩 Correo enviado a', correo);
      });

      res.json({ message: 'Reserva guardada con éxito', id: this.lastID });
    }
  );
});

/* ──────────────────────────────
   🔹 READ - Obtener todas las reservas
────────────────────────────────*/
app.get('/reservas', (req, res) => {
  db.all('SELECT * FROM reservas', [], (err, rows) => {
    if (err) {
      console.error('❌ Error al obtener reservas:', err.message);
      return res.status(500).json({ error: 'Error al obtener reservas' });
    }
    res.json(rows);
  });
});

/* ──────────────────────────────
   🔹 UPDATE - Actualizar una reserva por ID
────────────────────────────────*/
app.put('/reservas/:id', (req, res) => {
  const { id } = req.params;
  const { nombre_cliente, evento, proveedor, fecha, correo } = req.body;

  if (!nombre_cliente || !evento || !proveedor || !fecha || !correo) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  db.run(
    `UPDATE reservas 
     SET nombre_cliente = ?, evento = ?, proveedor = ?, fecha = ?, correo = ?
     WHERE id = ?`,
    [nombre_cliente, evento, proveedor, fecha, correo, id],
    function (err) {
      if (err) {
        console.error('❌ Error al actualizar reserva:', err.message);
        return res.status(500).json({ error: 'Error al actualizar reserva' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Reserva no encontrada' });
      }
      console.log(`✏️ Reserva actualizada (ID: ${id})`);
      res.json({ message: 'Reserva actualizada con éxito' });
    }
  );
});

/* ──────────────────────────────
   🔹 DELETE - Eliminar una reserva por ID
────────────────────────────────*/
app.delete('/reservas/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM reservas WHERE id = ?', [id], function (err) {
    if (err) {
      console.error('❌ Error al eliminar reserva:', err.message);
      return res.status(500).json({ error: 'Error al eliminar reserva' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Reserva no encontrada' });
    }
    console.log(`🗑️ Reserva eliminada (ID: ${id})`);
    res.json({ message: 'Reserva eliminada con éxito' });
  });
});

/* ──────────────────────────────
   🧍 Registrar usuario (con rol)
────────────────────────────────*/
app.post('/registrar', async (req, res) => {
  let { nombre, correo, password, rol, codigoAdmin } = req.body;
  correo = correo.trim().toLowerCase();

  if (!nombre || !correo || !password) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  // 🔒 Si intenta registrarse como admin, verificar código secreto
  if (rol === 'admin' && codigoAdmin !== process.env.ADMIN_CODE) {
    return res.status(403).json({ error: 'Código de administrador incorrecto' });
  }

  db.get('SELECT * FROM usuarios WHERE correo = ?', [correo], async (err, row) => {
    if (err) return res.status(500).json({ error: 'Error interno del servidor' });
    if (row) return res.status(400).json({ error: 'El correo ya está registrado' });

    const hashedPassword = await bcrypt.hash(password, 10);
    db.run(
      'INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)',
      [nombre, correo, hashedPassword, rol || 'usuario'],
      function (err) {
        if (err) {
          console.error('❌ Error al registrar usuario:', err.message);
          return res.status(500).json({ error: 'Error al registrar usuario' });
        }
        console.log(`✅ Usuario registrado: ${nombre} (${rol})`);
        res.json({ message: 'Usuario registrado con éxito', id: this.lastID });
      }
    );
  });
});

/* ──────────────────────────────
   🔐 Iniciar sesión (con roles)
────────────────────────────────*/
app.post('/login', (req, res) => {
  let { correo, password } = req.body;
  correo = correo.trim().toLowerCase();

  if (!correo || !password) {
    return res.status(400).json({ error: 'Correo y contraseña son obligatorios' });
  }

  db.get('SELECT * FROM usuarios WHERE correo = ?', [correo], async (err, row) => {
    if (err) return res.status(500).json({ error: 'Error al iniciar sesión' });
    if (!row) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const match = await bcrypt.compare(password, row.password);
    if (!match) return res.status(401).json({ error: 'Contraseña incorrecta' });

    console.log(`✅ Usuario autenticado: ${row.nombre} (${row.rol})`);
    res.json({ message: 'Inicio de sesión exitoso', usuario: row });
  });
});

// 🚀 Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Servidor corriendo en http://localhost:${PORT}`));

// ======================================================
//  BACKEND COMPLETO: CRUD + LOGIN + ROLES + EMAIL
//  + LOGS + MÉTRICAS + RATE LIMIT + BACKUPS + HEALTHCHECK
// ======================================================

require('dotenv').config();
console.log('🧩 Código de admin cargado desde .env:', process.env.ADMIN_CODE);

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');

// ====== Seguridad y monitoreo ======
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const client = require('prom-client');
const cron = require('node-cron');
const fs = require('fs');

// ======================================================
// 1. CONFIGURACIÓN DE EXPRESS
// ======================================================
const app = express();
app.use(cors());
app.use(express.json());

// ======================================================
// 2. LOGGING PROFESIONAL
// ======================================================
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new DailyRotateFile({
      filename: 'logs/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d'
    }),
    new winston.transports.Console()
  ]
});

// Logs HTTP
app.use(morgan('combined'));

// ======================================================
// 3. RATE LIMIT – Protección contra ataques
// ======================================================
const limiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 min
  max: 200,
  message: 'Demasiadas solicitudes, intenta luego.'
});
app.use(limiter);

// ======================================================
// 4. CONEXIÓN A BASE DE DATOS SQLITE
// ======================================================
const db = new sqlite3.Database(process.env.DB_PATH, (err) => {
  if (err) console.error('❌ Error al conectar a la base de datos:', err.message);
  else console.log(`✅ Conectado a la base de datos ${process.env.DB_PATH}`);
});

// ======================================================
// 5. CREACIÓN DE TABLAS
// ======================================================
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

// ======================================================
// 6. CRON JOB: BACKUP AUTOMÁTICO DIARIO
// ======================================================
if (!fs.existsSync('./backups')) fs.mkdirSync('./backups');

cron.schedule('0 2 * * *', () => {
  const fecha = new Date().toISOString().split('T')[0];
  const backupFile = `./backups/reservas_${fecha}.db`;

  fs.copyFile(process.env.DB_PATH, backupFile, (err) => {
    if (err) console.error('❌ Error creando backup:', err);
    else console.log('🗄️ Backup diario generado:', backupFile);
  });
});

// ======================================================
// 7. HEALTH CHECK + MÉTRICAS
// ======================================================
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

client.collectDefaultMetrics();
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.send(await client.register.metrics());
});

// ======================================================
// 8. CONFIGURACIÓN DE CORREO
// ======================================================
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  }
});

// ======================================================
// 9. API: CRUD COMPLETO DE RESERVAS
// ======================================================

// CREATE
app.post('/reservas', (req, res) => {
  const { nombre_cliente, evento, proveedor, fecha, correo } = req.body;

  if (!nombre_cliente || !evento || !proveedor || !fecha || !correo) {
    return res.status(400).json({ error: 'Todos los campos son obligatorios' });
  }

  db.run(
    `INSERT INTO reservas (nombre_cliente, evento, proveedor, fecha, correo)
     VALUES (?, ?, ?, ?, ?)`,
    [nombre_cliente, evento, proveedor, fecha, correo],
    function (err) {
      if (err) {
        console.error('❌ Error al guardar reserva:', err.message);
        return res.status(500).json({ error: 'Error al guardar reserva' });
      }

      // Enviar correo
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
        `,
      };

      transporter.sendMail(mailOptions, (error) => {
        if (error) console.error('⚠️ Error al enviar correo:', error);
      });

      res.json({ message: 'Reserva guardada con éxito', id: this.lastID });
    }
  );
});

// READ
app.get('/reservas', (req, res) => {
  db.all('SELECT * FROM reservas', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Error al obtener reservas' });
    res.json(rows);
  });
});

// UPDATE
app.put('/reservas/:id', (req, res) => {
  const { id } = req.params;
  const { nombre_cliente, evento, proveedor, fecha, correo } = req.body;

  db.run(
    `UPDATE reservas SET nombre_cliente=?, evento=?, proveedor=?, fecha=?, correo=? WHERE id=?`,
    [nombre_cliente, evento, proveedor, fecha, correo, id],
    function (err) {
      if (err) return res.status(500).json({ error: 'Error al actualizar reserva' });
      if (this.changes === 0) return res.status(404).json({ error: 'Reserva no encontrada' });
      res.json({ message: 'Reserva actualizada con éxito' });
    }
  );
});

// DELETE
app.delete('/reservas/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM reservas WHERE id=?', [id], function (err) {
    if (err) return res.status(500).json({ error: 'Error al eliminar reserva' });
    if (this.changes === 0) return res.status(404).json({ error: 'Reserva no encontrada' });
    res.json({ message: 'Reserva eliminada con éxito' });
  });
});

// ======================================================
// 10. AUTH: REGISTRO + LOGIN
// ======================================================

// REGISTRO
app.post('/registrar', async (req, res) => {
  let { nombre, correo, password, rol, codigoAdmin } = req.body;
  correo = correo.trim().toLowerCase();

  if (rol === 'admin' && codigoAdmin !== process.env.ADMIN_CODE) {
    return res.status(403).json({ error: 'Código de administrador incorrecto' });
  }

  db.get('SELECT * FROM usuarios WHERE correo=?', [correo], async (err, row) => {
    if (row) return res.status(400).json({ error: 'El correo ya está registrado' });

    const hashedPassword = await bcrypt.hash(password, 10);

    db.run(
      `INSERT INTO usuarios (nombre, correo, password, rol) VALUES (?, ?, ?, ?)`,
      [nombre, correo, hashedPassword, rol || 'usuario'],
      function (err) {
        if (err) return res.status(500).json({ error: 'Error al registrar usuario' });
        res.json({ message: 'Usuario registrado con éxito', id: this.lastID });
      }
    );
  });
});

// LOGIN
app.post('/login', (req, res) => {
  let { correo, password } = req.body;
  correo = correo.trim().toLowerCase();

  db.get('SELECT * FROM usuarios WHERE correo=?', [correo], async (err, row) => {
    if (!row) return res.status(401).json({ error: 'Credenciales incorrectas' });

    const match = await bcrypt.compare(password, row.password);
    if (!match) return res.status(401).json({ error: 'Contraseña incorrecta' });

    res.json({ message: 'Inicio de sesión exitoso', usuario: row });
  });
});

// ======================================================
// 11. MANEJO GLOBAL DE ERRORES
// ======================================================
app.use((err, req, res, next) => {
  console.error('🔥 Error interno:', err);
  res.status(500).json({ error: 'Error interno del servidor' });
});

// ======================================================
// 12. INICIO DEL SERVIDOR
// ======================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`✅ Servidor corriendo en http://localhost:${PORT}`)
);

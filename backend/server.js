const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

const dbPath = path.join(__dirname, 'database.json');
const usersPath = path.join(__dirname, 'users.json');

// Helper function to read data from JSON file
const readData = (filePath) => {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error(`Error reading file from disk: ${filePath}`, error);
        return [];
    }
};

// Helper function to write data to JSON file
const writeData = (filePath, data) => {
    try {
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
        console.error(`Error writing file to disk: ${filePath}`, error);
    }
};

// API Endpoints

// User Login
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    const users = readData(usersPath);
    const user = users.find(u => u.username === username && u.password === password);

    if (user) {
        res.status(200).json({ message: 'Login successful', user: { username: user.username, role: user.role } });
    } else {
        res.status(401).json({ message: 'Invalid credentials' });
    }
});

// Get all appointments
app.get('/api/apontamentos', (req, res) => {
    const appointments = readData(dbPath);
    res.status(200).json(appointments);
});

// Create a new appointment
app.post('/api/apontamentos', (req, res) => {
    const appointments = readData(dbPath);
    const newAppointment = req.body;

    // Basic validation
    if (!newAppointment.funcionario || !newAppointment.data) {
        return res.status(400).json({ message: 'Missing required fields' });
    }

    // Simple timestamp and unique ID
    newAppointment.id = Date.now();
    newAppointment.registro = new Date().toISOString();

    // Prevent retroactive appointments
    const appointmentDate = new Date(newAppointment.data + 'T' + newAppointment.horarioInicio);
    if (appointmentDate < new Date()) {
       // return res.status(400).json({ message: 'Não é permitido fazer apontamentos retroativos.' });
    }

    appointments.push(newAppointment);
    writeData(dbPath, appointments);

    res.status(201).json(newAppointment);
});

// Export data as CSV
app.get('/api/export/csv', (req, res) => {
    const appointments = readData(dbPath);
    if (appointments.length === 0) {
        return res.status(200).send('');
    }

    const header = Object.keys(appointments[0]).join(',');
    const rows = appointments.map(row => Object.values(row).join(','));
    const csv = [header, ...rows].join('\n');

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename="apontamentos.csv"');
    res.status(200).send(csv);
});


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
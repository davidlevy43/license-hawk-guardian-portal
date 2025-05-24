const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Get machine's IP addresses for logging
function getLocalIpAddresses() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  
  for (const interfaceName in interfaces) {
    const iface = interfaces[interfaceName];
    for (let i = 0; i < iface.length; i++) {
      const alias = iface[i];
      if (alias.family === 'IPv4' && !alias.internal) {
        addresses.push(alias.address);
      }
    }
  }
  
  return addresses;
}

// Check if dist directory exists before serving static files
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  console.log('Serving static files from dist directory');
  app.use(express.static(distPath));
} else {
  console.log('Warning: dist directory not found. Static files will not be served.');
  console.log('To serve the frontend, build the React app using "npm run build" or "yarn build"');
}

// Initialize PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: false // For local development
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to PostgreSQL database:', err.message);
    console.error('DATABASE_URL:', process.env.DATABASE_URL);
  } else {
    console.log('Connected to PostgreSQL database');
    release();
    initializeDatabase();
  }
});

// Initialize database tables
async function initializeDatabase() {
  try {
    // Check if tables exist and create them if they don't
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Users table initialized');
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS licenses (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        department VARCHAR(255) NOT NULL,
        supplier VARCHAR(255) NOT NULL,
        start_date DATE NOT NULL,
        renewal_date DATE NOT NULL,
        monthly_cost DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(100) NOT NULL,
        service_owner VARCHAR(255) NOT NULL,
        service_owner_email VARCHAR(255),
        status VARCHAR(50) NOT NULL,
        notes TEXT,
        credit_card_digits VARCHAR(4),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Licenses table initialized');
    
    // Check for admin users
    await checkAndCreateAdminUsers();
    
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

// Check if admin users exist, if not create them
async function checkAndCreateAdminUsers() {
  try {
    // Check for the default admin user
    await checkAndCreateSpecificAdmin('admin', 'admin@example.com', 'admin123');
    
    // Check for the additional admin user
    await checkAndCreateSpecificAdmin('david', 'david@rotem.com', 'admin123');
  } catch (error) {
    console.error('Error creating admin users:', error);
  }
}

// Helper function to check and create a specific admin user
async function checkAndCreateSpecificAdmin(username, email, password) {
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      // Create admin user
      await pool.query(
        'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4)',
        [username, email, password, 'admin']
      );
      console.log(`Admin user ${email} created`);
    } else {
      console.log(`User ${email} already exists`);
    }
  } catch (error) {
    console.error(`Error creating user ${email}:`, error.message);
  }
}

// Simple health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Server is running',
    time: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    hostname: os.hostname(),
    platform: os.platform(),
    nodeVersion: process.version
  });
});

// User API endpoints
app.get('/api/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, role, created_at FROM users');
    
    const formattedRows = result.rows.map(row => ({
      ...row,
      createdAt: row.created_at
    }));
    
    res.json(formattedRows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, email, role, created_at FROM users WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    const formattedUser = {
      ...result.rows[0],
      createdAt: result.rows[0].created_at
    };
    
    res.json(formattedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.post('/api/users', async (req, res) => {
  const { username, email, role, password = 'default123' } = req.body;
  
  console.log('Creating user with data:', { username, email, role, password: password ? '[PROVIDED]' : '[DEFAULT]' });
  
  if (!username || !email || !role) {
    console.log('Missing required fields:', { username: !!username, email: !!email, role: !!role });
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  
  try {
    // Check if user with this email already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      console.log('User already exists with email:', email);
      res.status(400).json({ error: 'Email already exists' });
      return;
    }
    
    console.log('Inserting new user into database...');
    const result = await pool.query(
      'INSERT INTO users (username, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, username, email, role, created_at',
      [username, email, password, role]
    );
    
    console.log('User created successfully:', result.rows[0]);
    
    const responseUser = {
      ...result.rows[0],
      createdAt: result.rows[0].created_at
    };
    
    res.status(201).json(responseUser);
  } catch (error) {
    console.error('Database error creating user:', error);
    if (error.code === '23505') { // Unique violation
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: 'Failed to create user', details: error.message });
    }
  }
});

app.patch('/api/users/:id', async (req, res) => {
  const allowedFields = ['username', 'email', 'role'];
  const updates = {};
  
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  });
  
  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: 'No valid fields to update' });
    return;
  }
  
  try {
    // Construct SQL query
    const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = [req.params.id, ...Object.values(updates)];
    
    const result = await pool.query(
      `UPDATE users SET ${setClause} WHERE id = $1 RETURNING id, username, email, role, created_at`,
      values
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    const formattedUser = {
      ...result.rows[0],
      createdAt: result.rows[0].created_at
    };
    
    res.json(formattedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);
    
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// License API endpoints
app.get('/api/licenses', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM licenses');
    
    const formattedRows = result.rows.map(row => ({
      ...row,
      startDate: row.start_date,
      renewalDate: row.renewal_date,
      monthlyCost: parseFloat(row.monthly_cost),
      serviceOwner: row.service_owner,
      serviceOwnerEmail: row.service_owner_email,
      creditCardDigits: row.credit_card_digits,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));
    
    res.json(formattedRows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch licenses' });
  }
});

app.get('/api/licenses/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM licenses WHERE id = $1', [req.params.id]);
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'License not found' });
      return;
    }
    
    const row = result.rows[0];
    const formattedLicense = {
      ...row,
      startDate: row.start_date,
      renewalDate: row.renewal_date,
      monthlyCost: parseFloat(row.monthly_cost),
      serviceOwner: row.service_owner,
      serviceOwnerEmail: row.service_owner_email,
      creditCardDigits: row.credit_card_digits,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
    
    res.json(formattedLicense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch license' });
  }
});

app.post('/api/licenses', async (req, res) => {
  const {
    name, type, department, supplier,
    startDate, renewalDate, monthlyCost,
    paymentMethod, serviceOwner, serviceOwnerEmail,
    status, notes, creditCardDigits
  } = req.body;
  
  if (!name || !type || !department || !supplier || !startDate || !renewalDate || 
      monthlyCost === undefined || !paymentMethod || !serviceOwner || !status) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  
  try {
    const result = await pool.query(
      `INSERT INTO licenses (
        name, type, department, supplier,
        start_date, renewal_date, monthly_cost,
        payment_method, service_owner, service_owner_email,
        status, notes, credit_card_digits
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
      RETURNING *`,
      [
        name, type, department, supplier,
        startDate, renewalDate, monthlyCost,
        paymentMethod, serviceOwner, serviceOwnerEmail || '',
        status, notes || '', creditCardDigits || null
      ]
    );
    
    const row = result.rows[0];
    const responseLicense = {
      ...row,
      startDate: row.start_date,
      renewalDate: row.renewal_date,
      monthlyCost: parseFloat(row.monthly_cost),
      serviceOwner: row.service_owner,
      serviceOwnerEmail: row.service_owner_email,
      creditCardDigits: row.credit_card_digits,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
    
    res.status(201).json(responseLicense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create license' });
  }
});

app.patch('/api/licenses/:id', async (req, res) => {
  const allowedFields = {
    'name': 'name',
    'type': 'type', 
    'department': 'department',
    'supplier': 'supplier',
    'startDate': 'start_date',
    'renewalDate': 'renewal_date',
    'monthlyCost': 'monthly_cost',
    'paymentMethod': 'payment_method',
    'serviceOwner': 'service_owner',
    'serviceOwnerEmail': 'service_owner_email',
    'status': 'status',
    'notes': 'notes',
    'creditCardDigits': 'credit_card_digits'
  };
  
  const updates = {};
  
  Object.entries(allowedFields).forEach(([clientField, dbField]) => {
    if (req.body[clientField] !== undefined) {
      updates[dbField] = req.body[clientField];
    }
  });
  
  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: 'No valid fields to update' });
    return;
  }
  
  updates.updated_at = new Date();
  
  try {
    const setClause = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ');
    const values = [req.params.id, ...Object.values(updates)];
    
    const result = await pool.query(
      `UPDATE licenses SET ${setClause} WHERE id = $1 RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      res.status(404).json({ error: 'License not found' });
      return;
    }
    
    const row = result.rows[0];
    const formattedLicense = {
      ...row,
      startDate: row.start_date,
      renewalDate: row.renewal_date,
      monthlyCost: parseFloat(row.monthly_cost),
      serviceOwner: row.service_owner,
      serviceOwnerEmail: row.service_owner_email,
      creditCardDigits: row.credit_card_digits,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
    
    res.json(formattedLicense);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update license' });
  }
});

app.delete('/api/licenses/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM licenses WHERE id = $1', [req.params.id]);
    
    if (result.rowCount === 0) {
      res.status(404).json({ error: 'License not found' });
      return;
    }
    
    res.status(204).end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete license' });
  }
});

// Only serve React frontend if dist directory exists
app.get('*', (req, res) => {
  if (fs.existsSync(distPath)) {
    res.sendFile(path.join(distPath, 'index.html'));
  } else {
    res.status(200).send(`
      <html>
        <head>
          <title>License Manager API Server</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; padding: 20px; max-width: 800px; margin: 0 auto; }
            code { background-color: #f4f4f4; padding: 2px 5px; border-radius: 3px; }
            .error { color: #d32f2f; }
            .success { color: #388e3c; }
          </style>
        </head>
        <body>
          <h1>License Manager API Server is running</h1>
          <p>The API server is running successfully, but the frontend files are not available.</p>
          <p>API endpoints are available at: <code>http://[your-server-ip]:${PORT}/api/</code></p>
          
          <h2>Quick Setup Instructions</h2>
          <ol>
            <li>Navigate to the project root directory (one level up from server)</li>
            <li>Run <code>npm install</code> to install dependencies</li>
            <li>Run <code>npm run build</code> to build the frontend</li>
            <li>Restart this server</li>
          </ol>
          
          <h2>Alternative Setup</h2>
          <p>For a one-click setup, run <code>setup-once-forever.bat</code> as Administrator.</p>
          
          <h2>Current Server Information</h2>
          <p>Server process ID: <code>${process.pid}</code></p>
          <p>Available IP addresses: <code>${getLocalIpAddresses().join(', ')}</code></p>
        </body>
      </html>
    `);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start the server - Listen on all network interfaces 
app.listen(PORT, '0.0.0.0', () => {
  const ipAddresses = getLocalIpAddresses();
  console.log(`=== License Manager Server Started ===`);
  console.log(`Server running on port ${PORT}`);
  console.log(`Server process ID: ${process.pid}`);
  console.log(`Database URL: ${process.env.DATABASE_URL}`);
  console.log(`\nAccess URLs:`);
  
  // Log localhost URL
  console.log(`- Local: http://localhost:${PORT}`);
  
  // Log all network URLs
  ipAddresses.forEach(ip => {
    console.log(`- Network: http://${ip}:${PORT}`);
  });
  
  console.log(`\nAPI endpoints available at:`);
  console.log(`- Local: http://localhost:${PORT}/api/`);
  ipAddresses.forEach(ip => {
    console.log(`- Network: http://${ip}:${PORT}/api/`);
  });
  
  console.log(`\n=== Server Ready ===`);
});

// Handle proper shutdown
process.on('SIGINT', () => {
  console.log('Closing database connection');
  pool.end();
  process.exit(0);
});

// Handle unexpected errors
process.on('uncaughtException', (err) => {
  console.error('Uncaught exception:', err);
  // Keep server running despite errors
});

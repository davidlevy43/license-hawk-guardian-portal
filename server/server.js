
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const { v4: uuidv4 } = require('uuid');
const path = require('path');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '../dist')));

// Initialize SQLite database
const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

// Initialize database tables
function initializeDatabase() {
  // Create Users table first and wait for completion
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL,
      createdAt TEXT NOT NULL
    )
  `, (err) => {
    if (err) {
      console.error('Error creating users table:', err.message);
      return;
    }
    
    console.log('Users table initialized');
    
    // Now create Licenses table and wait for completion
    db.run(`
      CREATE TABLE IF NOT EXISTS licenses (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        department TEXT NOT NULL,
        supplier TEXT NOT NULL,
        startDate TEXT NOT NULL,
        renewalDate TEXT NOT NULL,
        monthlyCost REAL NOT NULL,
        paymentMethod TEXT NOT NULL,
        serviceOwner TEXT NOT NULL,
        serviceOwnerEmail TEXT,
        status TEXT NOT NULL,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        creditCardDigits TEXT
      )
    `, (err) => {
      if (err) {
        console.error('Error creating licenses table:', err.message);
        return;
      }
      
      console.log('Licenses table initialized');
      
      // Once both tables are created, check for admin user
      checkAndCreateAdminUser();
    });
  });
}

// Check if admin user exists, if not create one
function checkAndCreateAdminUser() {
  db.get('SELECT * FROM users WHERE role = ?', ['admin'], (err, row) => {
    if (err) {
      console.error('Error checking for admin user:', err.message);
      return;
    }
    
    if (!row) {
      // Create default admin user
      const adminUser = {
        id: uuidv4(),
        username: 'admin',
        email: 'admin@example.com',
        password: 'admin123', // In production, this should be hashed!
        role: 'admin',
        createdAt: new Date().toISOString()
      };
      
      db.run(
        'INSERT INTO users (id, username, email, password, role, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
        [adminUser.id, adminUser.username, adminUser.email, adminUser.password, adminUser.role, adminUser.createdAt],
        (err) => {
          if (err) {
            console.error('Error creating admin user:', err.message);
          } else {
            console.log('Default admin user created');
          }
        }
      );
    } else {
      console.log('Admin user already exists');
    }
  });
}

// User API endpoints
app.get('/api/users', (req, res) => {
  db.all('SELECT id, username, email, role, createdAt FROM users', [], (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch users' });
      return;
    }
    
    // Format dates and parse JSON fields if needed
    const formattedRows = rows.map(row => ({
      ...row,
      createdAt: new Date(row.createdAt)
    }));
    
    res.json(formattedRows);
  });
});

app.get('/api/users/:id', (req, res) => {
  db.get('SELECT id, username, email, role, createdAt FROM users WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch user' });
      return;
    }
    
    if (!row) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    // Format dates and parse JSON fields
    const formattedUser = {
      ...row,
      createdAt: new Date(row.createdAt)
    };
    
    res.json(formattedUser);
  });
});

app.post('/api/users', (req, res) => {
  const { username, email, role, password = 'default123' } = req.body;
  
  if (!username || !email || !role) {
    res.status(400).json({ error: 'Missing required fields' });
    return;
  }
  
  const newUser = {
    id: uuidv4(),
    username,
    email,
    role,
    password,
    createdAt: new Date().toISOString()
  };
  
  db.run(
    'INSERT INTO users (id, username, email, role, password, createdAt) VALUES (?, ?, ?, ?, ?, ?)',
    [newUser.id, newUser.username, newUser.email, newUser.role, newUser.password, newUser.createdAt],
    function(err) {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create user' });
        return;
      }
      
      // Format createdAt back to Date for the response
      const responseUser = {
        ...newUser,
        createdAt: new Date(newUser.createdAt),
        password: undefined // Don't return the password
      };
      
      res.status(201).json(responseUser);
    }
  );
});

app.patch('/api/users/:id', (req, res) => {
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
  
  // Construct SQL query
  let query = 'UPDATE users SET ';
  const values = [];
  
  Object.entries(updates).forEach(([key, value], index, array) => {
    query += `${key} = ?${index < array.length - 1 ? ', ' : ''}`;
    values.push(value);
  });
  
  query += ' WHERE id = ?';
  values.push(req.params.id);
  
  db.run(query, values, function(err) {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update user' });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    // Get the updated user
    db.get('SELECT id, username, email, role, createdAt FROM users WHERE id = ?', [req.params.id], (err, row) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'User updated but failed to fetch updated data' });
        return;
      }
      
      // Format dates
      const formattedUser = {
        ...row,
        createdAt: new Date(row.createdAt)
      };
      
      res.json(formattedUser);
    });
  });
});

app.delete('/api/users/:id', (req, res) => {
  db.run('DELETE FROM users WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete user' });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    
    res.status(204).end();
  });
});

// License API endpoints
app.get('/api/licenses', (req, res) => {
  db.all('SELECT * FROM licenses', [], (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch licenses' });
      return;
    }
    
    // Format dates and parse JSON fields
    const formattedRows = rows.map(row => ({
      ...row,
      startDate: new Date(row.startDate),
      renewalDate: new Date(row.renewalDate),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    }));
    
    res.json(formattedRows);
  });
});

app.get('/api/licenses/:id', (req, res) => {
  db.get('SELECT * FROM licenses WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to fetch license' });
      return;
    }
    
    if (!row) {
      res.status(404).json({ error: 'License not found' });
      return;
    }
    
    // Format dates and parse JSON fields
    const formattedLicense = {
      ...row,
      startDate: new Date(row.startDate),
      renewalDate: new Date(row.renewalDate),
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt)
    };
    
    res.json(formattedLicense);
  });
});

app.post('/api/licenses', (req, res) => {
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
  
  const now = new Date().toISOString();
  
  const newLicense = {
    id: uuidv4(),
    name,
    type,
    department,
    supplier,
    startDate: new Date(startDate).toISOString(),
    renewalDate: new Date(renewalDate).toISOString(),
    monthlyCost,
    paymentMethod,
    serviceOwner,
    serviceOwnerEmail: serviceOwnerEmail || '',
    status,
    notes: notes || '',
    createdAt: now,
    updatedAt: now,
    creditCardDigits: creditCardDigits || null
  };
  
  db.run(
    `INSERT INTO licenses (
      id, name, type, department, supplier,
      startDate, renewalDate, monthlyCost,
      paymentMethod, serviceOwner, serviceOwnerEmail,
      status, notes, createdAt, updatedAt, creditCardDigits
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      newLicense.id, newLicense.name, newLicense.type, newLicense.department, newLicense.supplier,
      newLicense.startDate, newLicense.renewalDate, newLicense.monthlyCost,
      newLicense.paymentMethod, newLicense.serviceOwner, newLicense.serviceOwnerEmail,
      newLicense.status, newLicense.notes, newLicense.createdAt, newLicense.updatedAt, newLicense.creditCardDigits
    ],
    function(err) {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create license' });
        return;
      }
      
      // Format dates back to Date objects for the response
      const responseLicense = {
        ...newLicense,
        startDate: new Date(newLicense.startDate),
        renewalDate: new Date(newLicense.renewalDate),
        createdAt: new Date(newLicense.createdAt),
        updatedAt: new Date(newLicense.updatedAt)
      };
      
      res.status(201).json(responseLicense);
    }
  );
});

app.patch('/api/licenses/:id', (req, res) => {
  const allowedFields = [
    'name', 'type', 'department', 'supplier',
    'startDate', 'renewalDate', 'monthlyCost',
    'paymentMethod', 'serviceOwner', 'serviceOwnerEmail',
    'status', 'notes', 'creditCardDigits'
  ];
  
  const updates = {};
  
  allowedFields.forEach(field => {
    if (req.body[field] !== undefined) {
      // Format dates to ISO strings for storage
      if (field === 'startDate' || field === 'renewalDate') {
        updates[field] = new Date(req.body[field]).toISOString();
      } else {
        updates[field] = req.body[field];
      }
    }
  });
  
  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: 'No valid fields to update' });
    return;
  }
  
  updates.updatedAt = new Date().toISOString();
  
  // Construct SQL query
  let query = 'UPDATE licenses SET ';
  const values = [];
  
  Object.entries(updates).forEach(([key, value], index, array) => {
    query += `${key} = ?${index < array.length - 1 ? ', ' : ''}`;
    values.push(value);
  });
  
  query += ' WHERE id = ?';
  values.push(req.params.id);
  
  db.run(query, values, function(err) {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to update license' });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'License not found' });
      return;
    }
    
    // Get the updated license
    db.get('SELECT * FROM licenses WHERE id = ?', [req.params.id], (err, row) => {
      if (err) {
        console.error(err);
        res.status(500).json({ error: 'License updated but failed to fetch updated data' });
        return;
      }
      
      // Format dates
      const formattedLicense = {
        ...row,
        startDate: new Date(row.startDate),
        renewalDate: new Date(row.renewalDate),
        createdAt: new Date(row.createdAt),
        updatedAt: new Date(row.updatedAt)
      };
      
      res.json(formattedLicense);
    });
  });
});

app.delete('/api/licenses/:id', (req, res) => {
  db.run('DELETE FROM licenses WHERE id = ?', [req.params.id], function(err) {
    if (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete license' });
      return;
    }
    
    if (this.changes === 0) {
      res.status(404).json({ error: 'License not found' });
      return;
    }
    
    res.status(204).end();
  });
});

// Serve React frontend for any other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API endpoints available at http://localhost:${PORT}/api/`);
});

// Handle proper shutdown
process.on('SIGINT', () => {
  console.log('Closing database connection');
  db.close();
  process.exit(0);
});

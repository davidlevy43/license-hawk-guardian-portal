const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Try to load nodemailer, but don't fail if it's not available
let nodemailer = null;
try {
  nodemailer = require('nodemailer');
  console.log('✅ Nodemailer loaded successfully');
} catch (error) {
  console.warn('⚠️ Nodemailer not available - email functionality will be disabled');
  console.warn('To enable email features, install nodemailer: npm install nodemailer');
}

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    const allowedOrigins = [
      'http://localhost',
      'http://localhost:8080',
      'http://localhost:3000',
      'http://127.0.0.1',
      'http://127.0.0.1:8080',
      'http://127.0.0.1:3000',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    // Allow any localhost or 127.0.0.1 variations
    if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('lovableproject.com')) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Database connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://admin:admin123@localhost:5432/license_manager',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error acquiring client', err.stack);
  } else {
    console.log('Database connected successfully');
    release();
  }
});

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here-change-in-production';

// Database initialization
async function initializeDatabase() {
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create licenses table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS licenses (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        department VARCHAR(100),
        supplier VARCHAR(255),
        start_date DATE,
        renewal_date DATE,
        monthly_cost DECIMAL(10,2),
        payment_method VARCHAR(100),
        service_owner VARCHAR(255),
        service_owner_email VARCHAR(255),
        status VARCHAR(50) NOT NULL,
        notes TEXT,
        credit_card_digits VARCHAR(4),
        cost_type VARCHAR(50) DEFAULT 'monthly',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create default admin user
    const adminExists = await pool.query('SELECT id FROM users WHERE email = $1', ['admin@example.com']);
    if (adminExists.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.query(
        'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4)',
        ['admin@example.com', hashedPassword, 'Admin User', 'admin']
      );
      console.log('Default admin user created');
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
  }
}

// Initialize database on startup
initializeDatabase();

// Email sending service - only if nodemailer is available
const createTransporter = (config) => {
  if (!nodemailer) {
    throw new Error('Nodemailer is not available. Please install it to use email features.');
  }
  return nodemailer.createTransporter({
    host: config.smtpServer,
    port: config.smtpPort,
    secure: config.smtpPort === 465, // true for 465, false for other ports
    auth: {
      user: config.username,
      pass: config.password,
    },
  });
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'License Manager API'
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'License Manager API'
  });
});

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password, name) VALUES ($1, $2, $3) RETURNING id, email, name, role',
      [email, hashedPassword, name]
    );

    const user = result.rows[0];
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify token endpoint
app.get('/api/auth/verify', authenticateToken, (req, res) => {
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role
    }
  });
});

// Email notification endpoints - with nodemailer availability check
app.post('/api/email/test', authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (!nodemailer) {
      return res.status(503).json({ 
        error: 'Email service is not available. Nodemailer package is not installed.' 
      });
    }

    const { smtpServer, smtpPort, username, password, senderEmail } = req.body;
    
    if (!smtpServer || !smtpPort || !username || !password || !senderEmail) {
      return res.status(400).json({ error: 'All email settings are required' });
    }

    const testTransporter = createTransporter({
      smtpServer,
      smtpPort: parseInt(smtpPort),
      username,
      password
    });

    // Verify connection only
    await testTransporter.verify();
    
    res.json({ success: true, message: 'SMTP connection verified successfully!' });
  } catch (error) {
    console.error('Email test error:', error);
    res.status(500).json({ error: 'Failed to verify SMTP connection: ' + error.message });
  }
});

app.post('/api/email/send-test', authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (!nodemailer) {
      return res.status(503).json({ 
        error: 'Email service is not available. Nodemailer package is not installed.' 
      });
    }

    const { emailSettings, testEmailAddress } = req.body;
    
    if (!emailSettings.smtpServer || !testEmailAddress) {
      return res.status(400).json({ error: 'Email settings and test email address are required' });
    }

    const testTransporter = createTransporter(emailSettings);

    // Send actual test email
    const testEmailContent = {
      from: `"${emailSettings.senderName}" <${emailSettings.senderEmail}>`,
      to: testEmailAddress,
      subject: 'License Manager - Test Email ✅',
      text: `שלום!

זהו מייל בדיקה מ-License Manager.

הגדרות SMTP שלך עובדות בהצלחה! 🎉

פרטי השליחה:
- שרת SMTP: ${emailSettings.smtpServer}
- פורט: ${emailSettings.smtpPort}
- שולח: ${emailSettings.senderName} <${emailSettings.senderEmail}>
- תאריך שליחה: ${new Date().toLocaleString('he-IL')}

המערכת מוכנה לשליחת התראות אוטומטיות על רישיונות שפגים.

בברכה,
License Manager System`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h1 style="color: #22c55e; text-align: center; margin-bottom: 20px;">
              ✅ License Manager - Test Email
            </h1>
            
            <div style="background-color: #f0f9ff; padding: 20px; border-radius: 8px; border-left: 4px solid #22c55e; margin: 20px 0;">
              <h2 style="color: #0f172a; margin-top: 0;">שלום!</h2>
              <p style="color: #334155; line-height: 1.6;">
                זהו מייל בדיקה מ-License Manager.<br>
                <strong>הגדרות SMTP שלך עובדות בהצלחה! 🎉</strong>
              </p>
            </div>

            <div style="background-color: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #475569; margin-top: 0;">פרטי השליחה:</h3>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: bold;">שרת SMTP:</td>
                  <td style="padding: 8px 0; color: #334155;">${emailSettings.smtpServer}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: bold;">פורט:</td>
                  <td style="padding: 8px 0; color: #334155;">${emailSettings.smtpPort}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: bold;">שולח:</td>
                  <td style="padding: 8px 0; color: #334155;">${emailSettings.senderName} &lt;${emailSettings.senderEmail}&gt;</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; color: #64748b; font-weight: bold;">תאריך שליחה:</td>
                  <td style="padding: 8px 0; color: #334155;">${new Date().toLocaleString('he-IL')}</td>
                </tr>
              </table>
            </div>

            <div style="background-color: #ecfdf5; padding: 15px; border-radius: 8px; border: 1px solid #bbf7d0;">
              <p style="color: #166534; margin: 0; text-align: center;">
                <strong>המערכת מוכנה לשליחת התראות אוטומטיות על רישיונות שפגים</strong>
              </p>
            </div>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
            
            <p style="color: #64748b; font-size: 14px; text-align: center; margin: 0;">
              בברכה,<br>
              <strong>License Manager System</strong>
            </p>
          </div>
        </div>
      `
    };

    await testTransporter.sendMail(testEmailContent);

    console.log(`📧 Test email sent successfully to ${testEmailAddress}`);
    res.json({ 
      success: true, 
      message: `Test email sent successfully to ${testEmailAddress}!` 
    });
    
  } catch (error) {
    console.error('Test email sending error:', error);
    res.status(500).json({ error: 'Failed to send test email: ' + error.message });
  }
});

app.post('/api/email/send-notification', authenticateToken, async (req, res) => {
  try {
    if (!nodemailer) {
      return res.status(503).json({ 
        error: 'Email service is not available. Nodemailer package is not installed.' 
      });
    }

    const { emailSettings, license, templateType, template } = req.body;
    
    if (!emailSettings.smtpServer || !license.serviceOwnerEmail) {
      return res.status(400).json({ error: 'Email settings and service owner email are required' });
    }

    const mailTransporter = createTransporter(emailSettings);

    // Replace placeholders in template
    const processedTemplate = template
      .replace(/{LICENSE_NAME}/g, license.name)
      .replace(/{EXPIRY_DATE}/g, new Date(license.renewalDate).toLocaleDateString())
      .replace(/{DEPARTMENT}/g, license.department || 'N/A')
      .replace(/{SUPPLIER}/g, license.supplier || 'N/A')
      .replace(/{COST}/g, license.monthlyCost ? `$${license.monthlyCost}` : 'N/A')
      .replace(/{SERVICE_OWNER}/g, license.serviceOwner || 'N/A')
      .replace(/{CARD_LAST_4}/g, license.creditCardDigits || 'N/A');

    // Determine subject based on template type
    let subject;
    switch (templateType) {
      case 'thirtyDays':
        subject = `License Renewal Notice - ${license.name} (30 days)`;
        break;
      case 'sevenDays':
        subject = `License Renewal Reminder - ${license.name} (7 days)`;
        break;
      case 'oneDay':
        subject = `URGENT: License Expires Tomorrow - ${license.name}`;
        break;
      default:
        subject = `License Renewal Notice - ${license.name}`;
    }

    // Send email
    await mailTransporter.sendMail({
      from: `"${emailSettings.senderName}" <${emailSettings.senderEmail}>`,
      to: license.serviceOwnerEmail,
      subject: subject,
      text: processedTemplate,
      html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">${subject}</h2>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          ${processedTemplate.replace(/\n/g, '<br>')}
        </div>
        <hr style="margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">
          This is an automated message from License Manager.<br>
          License ID: ${license.id}
        </p>
      </div>`
    });

    console.log(`📧 Email sent successfully to ${license.serviceOwnerEmail} for license ${license.name}`);
    res.json({ success: true, message: 'Email sent successfully' });
    
  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ error: 'Failed to send email: ' + error.message });
  }
});

// License routes
app.get('/api/licenses', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT * FROM licenses 
      ORDER BY created_at DESC
    `);
    
    const licenses = result.rows.map(row => ({
      id: row.id,
      name: row.name,
      type: row.type,
      department: row.department,
      supplier: row.supplier,
      startDate: row.start_date,
      renewalDate: row.renewal_date,
      monthlyCost: parseFloat(row.monthly_cost),
      costType: row.cost_type,
      serviceOwner: row.service_owner,
      serviceOwnerEmail: row.service_owner_email,
      paymentMethod: row.payment_method,
      creditCardDigits: row.credit_card_digits,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    }));

    res.json(licenses);
  } catch (error) {
    console.error('Error fetching licenses:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/licenses/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM licenses WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'License not found' });
    }

    const row = result.rows[0];
    const license = {
      id: row.id,
      name: row.name,
      type: row.type,
      department: row.department,
      supplier: row.supplier,
      startDate: row.start_date,
      renewalDate: row.renewal_date,
      monthlyCost: parseFloat(row.monthly_cost),
      costType: row.cost_type,
      serviceOwner: row.service_owner,
      serviceOwnerEmail: row.service_owner_email,
      paymentMethod: row.payment_method,
      creditCardDigits: row.credit_card_digits,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    res.json(license);
  } catch (error) {
    console.error('Error fetching license:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/licenses', authenticateToken, async (req, res) => {
  try {
    const {
      name, type, department, supplier,
      startDate, renewalDate, monthlyCost,
      costType, paymentMethod, serviceOwner, serviceOwnerEmail,
      status, notes, creditCardDigits
    } = req.body;
    
    if (!name || !type || !status) {
      return res.status(400).json({ error: 'Name, type, and status are required' });
    }

    const result = await pool.query(
      `INSERT INTO licenses (
        name, type, department, supplier,
        start_date, renewal_date, monthly_cost, cost_type,
        payment_method, service_owner, service_owner_email,
        status, notes, credit_card_digits
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14) 
      RETURNING *`,
      [
        name, type, department, supplier,
        startDate, renewalDate, monthlyCost, costType || 'monthly',
        paymentMethod, serviceOwner, serviceOwnerEmail || '',
        status, notes || '', creditCardDigits || null
      ]
    );

    const row = result.rows[0];
    const license = {
      id: row.id,
      name: row.name,
      type: row.type,
      department: row.department,
      supplier: row.supplier,
      startDate: row.start_date,
      renewalDate: row.renewal_date,
      monthlyCost: parseFloat(row.monthly_cost),
      costType: row.cost_type,
      serviceOwner: row.service_owner,
      serviceOwnerEmail: row.service_owner_email,
      paymentMethod: row.payment_method,
      creditCardDigits: row.credit_card_digits,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    res.status(201).json(license);
  } catch (error) {
    console.error('Error creating license:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/licenses/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Field mapping from frontend to database
    const fieldMap = {
      'name': 'name',
      'type': 'type',
      'department': 'department',
      'supplier': 'supplier',
      'startDate': 'start_date',
      'renewalDate': 'renewal_date',
      'monthlyCost': 'monthly_cost',
      'costType': 'cost_type',
      'paymentMethod': 'payment_method',
      'serviceOwner': 'service_owner',
      'serviceOwnerEmail': 'service_owner_email',
      'status': 'status',
      'notes': 'notes',
      'creditCardDigits': 'credit_card_digits'
    };

    const updateFields = [];
    const values = [];
    let valueIndex = 1;

    // Build dynamic update query
    Object.keys(req.body).forEach(key => {
      if (fieldMap[key] && req.body[key] !== undefined) {
        updateFields.push(`${fieldMap[key]} = $${valueIndex}`);
        values.push(req.body[key]);
        valueIndex++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    // Add updated_at field
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    
    // Add id for WHERE clause
    values.push(id);

    const query = `
      UPDATE licenses 
      SET ${updateFields.join(', ')}
      WHERE id = $${valueIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'License not found' });
    }

    const row = result.rows[0];
    const license = {
      id: row.id,
      name: row.name,
      type: row.type,
      department: row.department,
      supplier: row.supplier,
      startDate: row.start_date,
      renewalDate: row.renewal_date,
      monthlyCost: parseFloat(row.monthly_cost),
      costType: row.cost_type,
      serviceOwner: row.service_owner,
      serviceOwnerEmail: row.service_owner_email,
      paymentMethod: row.payment_method,
      creditCardDigits: row.credit_card_digits,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };

    res.json(license);
  } catch (error) {
    console.error('Error updating license:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/licenses/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM licenses WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'License not found' });
    }

    res.json({ message: 'License deleted successfully' });
  } catch (error) {
    console.error('Error deleting license:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User management routes (admin only)
app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, email, name, role, created_at FROM users ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { email, password, name, role } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (email, password, name, role) VALUES ($1, $2, $3, $4) RETURNING id, email, name, role, created_at',
      [email, hashedPassword, name, role || 'user']
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { email, name, role, password } = req.body;

    let query = 'UPDATE users SET email = $1, name = $2, role = $3, updated_at = CURRENT_TIMESTAMP';
    let values = [email, name, role];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += ', password = $4';
      values.push(hashedPassword);
    }

    query += ' WHERE id = $' + (values.length + 1) + ' RETURNING id, email, name, role, created_at';
    values.push(id);

    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.delete('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent deletion of the admin user
    if (req.user.id == id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Settings endpoints
app.get('/api/settings', authenticateToken, requireAdmin, (req, res) => {
  res.json({
    serverUrl: process.env.SERVER_URL || 'http://localhost:3001',
    emailNotifications: process.env.EMAIL_NOTIFICATIONS === 'true',
    smtpServer: process.env.SMTP_SERVER || '',
    smtpPort: process.env.SMTP_PORT || 587,
    smtpUser: process.env.SMTP_USER || '',
    notificationDays: parseInt(process.env.NOTIFICATION_DAYS) || 30
  });
});

app.put('/api/settings', authenticateToken, requireAdmin, (req, res) => {
  // In a real implementation, you'd save these to a database or environment file
  res.json({ message: 'Settings updated successfully' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`License Manager API Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Keep server running despite errors
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Keep server running despite errors
});

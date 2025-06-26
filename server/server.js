const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');
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

// CORS configuration - allow both localhost with and without port
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:3000', 
    'http://localhost',
    'https://id-preview--e155f7e0-87f5-4108-9bae-d777af39bbd9.lovable.app'
  ],
  credentials: true
}));

app.use(express.json());

// Database configuration
const pool = new Pool({
  user: process.env.DB_USER || 'admin',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'license_manager',
  password: process.env.DB_PASSWORD || 'admin123',
  port: process.env.DB_PORT || 5432,
});

// JWT Secret - use environment variable in production
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Health check endpoints - both /health and /api/health for compatibility
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'License Manager API', timestamp: new Date().toISOString() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', service: 'License Manager API', timestamp: new Date().toISOString() });
});

// Public setup endpoint - check if users exist and create default admin if needed
app.get('/api/setup/check', async (req, res) => {
  try {
    console.log('🔧 [SETUP] Checking if any users exist...');
    
    const result = await pool.query('SELECT COUNT(*) as count FROM users');
    const userCount = parseInt(result.rows[0].count);
    
    console.log('🔧 [SETUP] Found', userCount, 'users');
    
    if (userCount === 0) {
      console.log('🔧 [SETUP] No users found, creating default admin...');
      
      // Create default admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const adminResult = await pool.query(
        'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
        ['admin', 'admin@example.com', hashedPassword, 'admin']
      );
      
      console.log('🔧 [SETUP] Default admin user created successfully');
      
      res.json({ 
        setupRequired: true, 
        adminCreated: true,
        userCount: 1,
        defaultCredentials: {
          email: 'admin@example.com',
          password: 'admin123'
        }
      });
    } else {
      // Check if admin@example.com exists
      console.log('🔧 [SETUP] Checking if admin@example.com exists...');
      const adminCheck = await pool.query('SELECT id, name, email, role FROM users WHERE email = $1', ['admin@example.com']);
      
      if (adminCheck.rows.length === 0) {
        console.log('🔧 [SETUP] admin@example.com not found, creating it...');
        
        // Create the admin@example.com user
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const adminResult = await pool.query(
          'INSERT INTO users (name, email, password, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role',
          ['admin', 'admin@example.com', hashedPassword, 'admin']
        );
        
        console.log('🔧 [SETUP] admin@example.com user created successfully');
        
        res.json({ 
          setupRequired: false, 
          adminCreated: true,
          userCount: userCount + 1,
          message: 'Default admin user created'
        });
      } else {
        console.log('🔧 [SETUP] admin@example.com already exists:', adminCheck.rows[0]);
        
        // Reset the admin password to ensure it's correct
        console.log('🔧 [SETUP] Resetting admin@example.com password to ensure it works...');
        const hashedPassword = await bcrypt.hash('admin123', 10);
        await pool.query(
          'UPDATE users SET password = $1 WHERE email = $2',
          [hashedPassword, 'admin@example.com']
        );
        console.log('🔧 [SETUP] admin@example.com password reset successfully');
        
        res.json({ 
          setupRequired: false, 
          adminCreated: false,
          userCount: userCount,
          adminExists: true,
          adminUser: adminCheck.rows[0],
          passwordReset: true
        });
      }
    }
  } catch (error) {
    console.error('🔧 [SETUP] Error in setup check:', error);
    res.status(500).json({ error: 'Setup check failed: ' + error.message });
  }
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  console.log('🔐 [AUTH] Middleware called');
  console.log('🔐 [AUTH] Auth header:', authHeader ? 'Bearer ' + authHeader.split(' ')[1].substring(0, 20) + '...' : 'No header');
  console.log('🔐 [AUTH] Token extracted:', token ? token.substring(0, 20) + '...' : 'No token');

  if (!token) {
    console.log('🔐 [AUTH] No token provided');
    return res.status(401).json({ error: 'Access token required' });
  }

  // Verify JWT token
  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      console.error('🔐 [AUTH] Token verification failed:', err.message);
      console.error('🔐 [AUTH] Token that failed:', token.substring(0, 50) + '...');
      console.error('🔐 [AUTH] JWT_SECRET being used:', JWT_SECRET.substring(0, 10) + '...');
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    
    console.log('🔐 [AUTH] Token decoded successfully:', { 
      id: decoded.id, 
      email: decoded.email, 
      role: decoded.role 
    });
    
    // Check if user still exists in database
    try {
      const userCheck = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [decoded.id]);
      if (userCheck.rows.length === 0) {
        console.error('🔐 [AUTH] User from token no longer exists in database:', decoded.id);
        return res.status(403).json({ error: 'User no longer exists' });
      }
      
      // Update req.user with current database info
      req.user = {
        id: userCheck.rows[0].id,
        email: userCheck.rows[0].email,
        role: userCheck.rows[0].role,
        name: userCheck.rows[0].name
      };
      console.log('🔐 [AUTH] User authenticated successfully:', req.user.email);
      next();
    } catch (dbError) {
      console.error('🔐 [AUTH] Database error during auth:', dbError);
      return res.status(500).json({ error: 'Authentication database error' });
    }
  });
};

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

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

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { usernameOrEmail, email, password } = req.body;
    
    // Support both the new format (usernameOrEmail) and legacy format (email)
    const loginIdentifier = usernameOrEmail || email;

    if (!loginIdentifier || !password) {
      console.log('🔐 [SERVER] Missing credentials in request');
      return res.status(400).json({ error: 'Username/email and password are required' });
    }

    console.log('🔐 [SERVER] Login attempt for:', loginIdentifier);

    // Check if input is email (contains @) or username
    const isEmail = loginIdentifier.includes('@');
    let query, queryParams;
    
    if (isEmail) {
      console.log('🔐 [SERVER] Searching by email');
      query = 'SELECT * FROM users WHERE email = $1';
      queryParams = [loginIdentifier];
    } else {
      console.log('🔐 [SERVER] Searching by username (name field)');
      // For username, we need to check the name field since that's what we store
      query = 'SELECT * FROM users WHERE name = $1';
      queryParams = [loginIdentifier];
    }

    console.log('🔐 [SERVER] Executing query:', query, 'with params:', queryParams);
    
    const result = await pool.query(query, queryParams);
    console.log('🔐 [SERVER] Query returned', result.rows.length, 'rows');
    
    const user = result.rows[0];

    if (!user) {
      console.log('🔐 [SERVER] No user found with identifier:', loginIdentifier);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('🔐 [SERVER] User found:', { 
      id: user.id, 
      name: user.name, 
      email: user.email,
      role: user.role,
      hasPassword: !!user.password,
      passwordLength: user.password ? user.password.length : 0
    });

    // Check if password exists in database
    if (!user.password) {
      console.error('🔐 [SERVER] User has no password hash in database');
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('🔐 [SERVER] Comparing password...');
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    console.log('🔐 [SERVER] Password comparison result:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('🔐 [SERVER] Invalid password for user:', user.email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token - ensure user ID is converted to string for consistency
    const tokenPayload = { 
      id: user.id.toString(), 
      email: user.email, 
      role: user.role 
    };
    
    console.log('🔐 [SERVER] Creating JWT token with payload:', tokenPayload);
    console.log('🔐 [SERVER] Using JWT_SECRET:', JWT_SECRET.substring(0, 10) + '...');
    
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });
    
    console.log('🔐 [SERVER] JWT token created successfully');
    console.log('🔐 [SERVER] Token (first 50 chars):', token.substring(0, 50) + '...');

    console.log('🔐 [SERVER] Login successful for user:', user.email, 'with ID:', user.id);

    res.json({
      token,
      user: {
        id: user.id.toString(), // Ensure ID is string for consistency
        email: user.email,
        name: user.name,
        role: user.role,
        username: user.name, // Add username field for compatibility
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('🔐 [SERVER] Login error:', error);
    res.status(500).json({ error: 'Internal server error: ' + error.message });
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
    
    if (!emailSettings.smtpServer || testEmailAddress) {
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
    
    if (!emailSettings.smtpServer || license.serviceOwnerEmail) {
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
    console.log('🔐 [SERVER] Fetching all users for admin:', req.user.email);
    const result = await pool.query('SELECT id, name as username, email, role, created_at as "createdAt" FROM users ORDER BY created_at DESC');
    console.log('🔐 [SERVER] Found', result.rows.length, 'users');
    res.json(result.rows);
  } catch (error) {
    console.error('🔐 [SERVER] Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.get('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('🔐 [SERVER] Fetching user by ID:', id, 'for user:', req.user.email);
    
    const result = await pool.query('SELECT id, name as username, email, role, created_at as "createdAt" FROM users WHERE id = $1', [id]);
    
    if (result.rows.length === 0) {
      console.log('🔐 [SERVER] User not found with ID:', id);
      return res.status(404).json({ error: 'User not found' });
    }

    const user = result.rows[0];
    console.log('🔐 [SERVER] User found:', { id: user.id, username: user.username, email: user.email });
    
    res.json({
      id: user.id.toString(),
      username: user.username,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt
    });
  } catch (error) {
    console.error('🔐 [SERVER] Error fetching user:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

app.post('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, email, role, password } = req.body;
    
    console.log('🔐 [SERVER] Creating new user request received:', { username, email, role, hasPassword: !!password });
    
    if (!username || !email || !password) {
      console.log('🔐 [SERVER] Missing required fields:', { username: !!username, email: !!email, password: !!password });
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    console.log('🔐 [SERVER] Checking if user already exists...');
    
    // Check if user already exists by email or username
    const existingUserCheck = await pool.query(
      'SELECT id, email, name FROM users WHERE email = $1 OR name = $2', 
      [email, username]
    );
    
    if (existingUserCheck.rows.length > 0) {
      const existing = existingUserCheck.rows[0];
      console.log('🔐 [SERVER] User already exists:', { id: existing.id, email: existing.email, name: existing.name });
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    console.log('🔐 [SERVER] User does not exist, proceeding with creation...');
    console.log('🔐 [SERVER] Hashing password...');
    
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('🔐 [SERVER] Password hashed successfully');
    
    console.log('🔐 [SERVER] Inserting user into database...');
    console.log('🔐 [SERVER] Mapping username to name field:', username);
    
    // Map username to name field for database insertion
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name as username, email, role, created_at as "createdAt"`,
      [username, email, hashedPassword, role || 'user']
    );
    
    if (result.rows.length === 0) {
      console.error('🔐 [SERVER] No rows returned from insert query');
      return res.status(500).json({ error: 'Failed to create user - no data returned' });
    }
    
    const newUser = result.rows[0];
    console.log('🔐 [SERVER] User created successfully:', { 
      id: newUser.id, 
      username: newUser.username, 
      email: newUser.email, 
      role: newUser.role 
    });
    
    // Return the created user with consistent format
    res.status(201).json({
      id: newUser.id.toString(),
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.createdAt
    });
    
  } catch (error) {
    console.error('🔐 [SERVER] Error creating user:', error);
    console.error('🔐 [SERVER] Error details:', {
      name: error.name,
      message: error.message,
      code: error.code,
      detail: error.detail,
      stack: error.stack
    });
    
    if (error.code === '23505') { // PostgreSQL unique violation
      console.log('🔐 [SERVER] Unique constraint violation detected');
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    
    res.status(500).json({ error: 'Failed to create user: ' + error.message });
  }
});

app.put('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { username, email, role, password } = req.body;
    
    // Map username to name field for database update
    let query = 'UPDATE users SET name = $1, email = $2, role = $3';
    let params = [username, email, role || 'user'];
    
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query += ', password = $4';
      params.push(hashedPassword);
    }
    
    query += ' WHERE id = $' + (params.length + 1) + ' RETURNING id, name as username, email, role, created_at as "createdAt"';
    params.push(id);
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating user:', error);
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Username or email already exists' });
    }
    res.status(500).json({ error: 'Failed to update user' });
  }
});

app.delete('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Prevent deleting self
    if (id === req.user.id.toString()) {
      return res.status(403).json({ error: 'Cannot delete your own account' });
    }
    
    const result = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
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

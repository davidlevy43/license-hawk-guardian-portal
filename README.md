
# License Manager

A comprehensive web application for managing software licenses, subscriptions, and renewals with automated notifications and cost tracking.

## Features

- **License Management**: Track software licenses, subscriptions, and their details
- **Cost Tracking**: Monitor monthly/yearly costs and payment methods
- **Renewal Notifications**: Automated email alerts for upcoming renewals
- **User Management**: Role-based access control (Admin/User)
- **Dashboard Analytics**: Visual insights into license usage and costs
- **Export Capabilities**: Export license data to Excel/CSV
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Technologies Used

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **shadcn/ui** component library
- **React Router** for navigation
- **React Query** for data fetching
- **React Hook Form** for form management

### Backend
- **Node.js** with Express
- **PostgreSQL** database
- **JWT** authentication
- **bcrypt** for password hashing
- **CORS** and **Helmet** for security

## Quick Start with Docker

The easiest way to run the application is using Docker Compose:

### Prerequisites
- Docker Desktop installed

### Installation
1. Clone the repository
2. Run the application:
   ```bash
   # Windows
   start-local.bat
   
   # Linux/Mac
   docker-compose up --build
   ```

3. Access the application:
   - Frontend: http://localhost
   - API: http://localhost:3001

### Default Login
- Email: `admin@example.com`
- Password: `admin123`

## Manual Installation

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 12+

### Setup
1. Clone the repository
2. Install frontend dependencies:
   ```bash
   npm install
   ```

3. Install backend dependencies:
   ```bash
   cd server
   npm install
   ```

4. Configure database:
   - Create PostgreSQL database: `license_manager`
   - Update connection settings in `server/.env` (copy from `server/.env.example`)

5. Build and run:
   ```bash
   # Build frontend
   npm run build
   
   # Start server
   cd server
   npm start
   ```

## Windows Service Installation

For production deployment on Windows, use the automated setup:

```bash
cd server
setup-once-forever.bat
```

This will:
- Install Node.js if needed
- Set up Windows Service
- Configure Windows Firewall
- Create desktop shortcuts
- Start the service automatically

## Project Structure

```
├── src/                    # Frontend source code
│   ├── components/         # React components
│   ├── pages/             # Page components
│   ├── services/          # API services
│   ├── context/           # React contexts
│   └── types/             # TypeScript types
├── server/                # Backend source code
│   ├── server.js          # Main server file
│   └── *.bat             # Windows deployment scripts
├── public/                # Static assets
└── docker-compose.yml     # Docker configuration
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/verify` - Verify token

### Licenses
- `GET /api/licenses` - Get all licenses
- `POST /api/licenses` - Create license
- `PUT /api/licenses/:id` - Update license
- `DELETE /api/licenses/:id` - Delete license

### Users (Admin only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Environment Variables

Create a `.env` file in the `server` directory:

```env
PORT=3001
DATABASE_URL=postgresql://admin:admin123@localhost:5432/license_manager
JWT_SECRET=your-secret-key-here
NODE_ENV=production
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

## Development

### Frontend Development
```bash
npm run dev
```

### Backend Development
```bash
cd server
npm run dev
```

## Deployment Options

1. **Docker**: Use `docker-compose.yml` for containerized deployment
2. **Windows Service**: Use `setup-once-forever.bat` for Windows servers
3. **Manual**: Build and deploy using Node.js and PostgreSQL
4. **Cloud**: Deploy to services like Heroku, DigitalOcean, or AWS

## License Data Model

```typescript
interface License {
  id: number;
  name: string;
  type: string;
  department?: string;
  supplier?: string;
  startDate?: string;
  renewalDate?: string;
  monthlyCost?: number;
  costType: 'monthly' | 'yearly';
  serviceOwner?: string;
  serviceOwnerEmail?: string;
  paymentMethod?: string;
  creditCardDigits?: string;
}
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and questions:
- Check the console logs in `server/service-error.log`
- Review the database connection settings
- Ensure all required services are running

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- CORS protection
- Rate limiting
- Input validation
- SQL injection prevention

---

**License Manager** - Streamline your license management process with automated tracking and notifications.


# License Manager - Local Docker Setup

## Overview
This setup provides a complete local license management system using Docker, with no internet connection required.

## Prerequisites
- Docker Desktop installed and running
- 8GB RAM minimum
- 2GB free disk space

## Quick Start

1. **Clone or extract the project files**
2. **Run the setup script:**
   ```bash
   start-local.bat
   ```

3. **Access the application:**
   - Web Interface: http://localhost
   - API: http://localhost:3001/api

4. **Default Login:**
   - Email: admin@example.com
   - Password: admin123

## Manual Setup

If you prefer manual setup:

```bash
# Build and start all services
docker-compose up --build -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Services

### Web Server (Port 80)
- Nginx serving the React frontend
- Automatic API proxy to backend

### API Server (Port 3001)
- Node.js Express server
- RESTful API endpoints
- JWT authentication

### Database (Port 5432)
- PostgreSQL 15
- Persistent data storage
- Automatic schema initialization

## Data Persistence

All data is stored in Docker volumes and persists between restarts:
- License data
- User accounts
- Configuration settings

## Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting
- CORS protection
- Security headers

## Backup and Restore

### Create Backup
```bash
docker exec license-manager-db pg_dump -U admin license_manager > backup.sql
```

### Restore Backup
```bash
docker exec -i license-manager-db psql -U admin license_manager < backup.sql
```

## Troubleshooting

### Service Won't Start
```bash
# Check Docker status
docker ps

# View detailed logs
docker-compose logs api
docker-compose logs postgres
```

### Database Connection Issues
```bash
# Restart database
docker-compose restart postgres

# Check database logs
docker-compose logs postgres
```

### Port Conflicts
If ports are in use, edit docker-compose.yml:
```yaml
ports:
  - "8080:80"    # Change web port
  - "3002:3001"  # Change API port
```

## Development

### Access Database
```bash
docker exec -it license-manager-db psql -U admin license_manager
```

### Update Code
After code changes:
```bash
docker-compose down
docker-compose up --build -d
```

## Production Deployment

For production deployment:
1. Change default passwords in docker-compose.yml
2. Update JWT_SECRET in server/.env
3. Configure proper SSL certificates
4. Set up regular backups
5. Configure monitoring

## Support

For issues or questions, check the logs:
```bash
docker-compose logs -f
```

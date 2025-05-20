
# License Manager Backend Server

This is the backend server for the License Manager application. It uses Express.js and SQLite to provide REST APIs for managing licenses and users.

## Setup

1. Install dependencies:
   ```
   cd server
   npm install
   ```

2. Start the server:
   ```
   npm start
   ```

The server will run on port 3001 by default, you can change this by setting the PORT environment variable.

## API Endpoints

### Users API:
- GET /api/users - Get all users
- GET /api/users/:id - Get a specific user by ID
- POST /api/users - Create a new user
- PATCH /api/users/:id - Update a user
- DELETE /api/users/:id - Delete a user

### Licenses API:
- GET /api/licenses - Get all licenses
- GET /api/licenses/:id - Get a specific license by ID
- POST /api/licenses - Create a new license
- PATCH /api/licenses/:id - Update a license
- DELETE /api/licenses/:id - Delete a license

## Database

The application uses SQLite database stored in `database.sqlite` file.

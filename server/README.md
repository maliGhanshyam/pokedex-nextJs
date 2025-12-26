# Pokedex Backend Server

Production-ready NestJS backend for the Pokedex application.

## Features

- **Authentication**: JWT-based authentication with access and refresh tokens
- **Pokémon Data Management**: PostgreSQL database with TypeORM
- **Cron Jobs**: Automatic daily sync of Pokémon data from PokéAPI
- **Favorites**: User-specific favorite Pokémon management
- **Analytics**: Analytics endpoints for statistics
- **Admin APIs**: Manual sync triggers and cron status monitoring

## Tech Stack

- NestJS (latest)
- TypeORM
- PostgreSQL
- JWT Authentication
- bcrypt for password hashing
- @nestjs/schedule for cron jobs
- @nestjs/axios for HTTP requests

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the server root directory (see `.env.example` for reference):
```env
PORT=3001
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=pokedex

JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_ACCESS_TOKEN_EXPIRATION=15m
JWT_REFRESH_TOKEN_EXPIRATION=7d

POKEAPI_BASE_URL=https://pokeapi.co/api/v2

CORS_ORIGIN=http://localhost:3000
```

3. Create the PostgreSQL database:
```bash
createdb pokedex
```

4. Seed the database with a dummy user:
```bash
npm run seed
```
This creates a user with:
- Email: `demo@example.com`
- Password: `password123`

5. Start the application:
```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## Database Schema

### Users
- `id` (UUID, Primary Key)
- `email` (String, Unique)
- `password` (String, Hashed)
- `refreshToken` (String, Nullable, Hashed)
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

### Pokemon
- `id` (Integer, Primary Key)
- `name` (String, Unique)
- `height` (Integer)
- `weight` (Integer)
- `stats` (JSONB)
- `types` (JSONB)
- `sprite` (String)
- `sprites` (JSONB)
- `abilities` (JSONB)
- `species` (JSONB)
- `createdAt` (Timestamp)
- `updatedAt` (Timestamp)

### FavoritePokemon
- `id` (UUID, Primary Key)
- `userId` (UUID, Foreign Key)
- `pokemonId` (Integer, Foreign Key)
- `createdAt` (Timestamp)
- Unique constraint on (userId, pokemonId)

## API Endpoints

### Authentication
- `POST /auth/signup` - Register a new user
- `POST /auth/login` - Login and get tokens
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout (requires authentication)

### Pokémon
- `GET /pokemon` - Get paginated list of Pokémon
  - Query params: `limit` (default: 20), `offset` (default: 0)
- `GET /pokemon/:name` - Get Pokémon details by name
- `GET /pokemon/types` - Get all available Pokémon types

### Favorites (Protected)
- `GET /favorites` - Get user's favorite Pokémon
- `POST /favorites/:pokemonId` - Add Pokémon to favorites
- `DELETE /favorites/:pokemonId` - Remove Pokémon from favorites

### Analytics (Protected)
- `GET /analytics` - Get analytics statistics

### Admin (Protected)
- `POST /admin/sync-pokemon` - Manually trigger Pokémon sync
- `GET /admin/cron-status` - Get cron job status

## Cron Jobs

The application includes a scheduled cron job that runs daily at 2 AM to sync Pokémon data from PokéAPI. The job:
- Fetches Pokémon list using pagination
- Fetches detailed data for each Pokémon
- Upserts data into PostgreSQL
- Handles errors gracefully
- Logs execution status

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | 3001 |
| `NODE_ENV` | Environment (development/production) | development |
| `DB_HOST` | PostgreSQL host | localhost |
| `DB_PORT` | PostgreSQL port | 5432 |
| `DB_USERNAME` | Database username | postgres |
| `DB_PASSWORD` | Database password | postgres |
| `DB_DATABASE` | Database name | pokedex |
| `JWT_SECRET` | JWT secret key | - |
| `JWT_ACCESS_TOKEN_EXPIRATION` | Access token expiration | 15m |
| `JWT_REFRESH_TOKEN_EXPIRATION` | Refresh token expiration | 7d |
| `POKEAPI_BASE_URL` | PokéAPI base URL | https://pokeapi.co/api/v2 |
| `CORS_ORIGIN` | CORS allowed origin | http://localhost:3000 |

## Development

```bash
# Run in development mode
npm run start:dev

# Build for production
npm run build

# Run tests
npm run test

# Run e2e tests
npm run test:e2e

# Lint code
npm run lint

# Format code
npm run format
```

## Production Considerations

1. **Environment Variables**: Always use environment variables for sensitive data
2. **JWT Secret**: Use a strong, randomly generated secret key
3. **Database**: Use connection pooling in production
4. **CORS**: Configure CORS appropriately for your frontend domain
5. **Logging**: Implement proper logging strategy
6. **Error Handling**: Add comprehensive error handling and monitoring
7. **Rate Limiting**: Consider adding rate limiting for public endpoints
8. **Migration**: Use TypeORM migrations instead of synchronize in production

## Notes

- The backend is the single source of truth for Pokémon data
- The frontend should call this backend instead of PokéAPI directly
- All protected routes require a valid JWT access token
- Refresh tokens are stored hashed in the database for security
- The sync job is idempotent and handles duplicates gracefully


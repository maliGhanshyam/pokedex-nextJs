# Pokedex Application

A full-stack Pokémon application with Next.js frontend and NestJS backend.

## Project Structure

```
.
├── client/          # Next.js frontend application
└── server/          # NestJS backend application
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. Install root dependencies:
```bash
npm install
```

2. Install all dependencies (root, client, and server):
```bash
npm run install:all
```

3. Set up the database:
   - Create a PostgreSQL database named `pokedex`
   - Configure database credentials in `server/.env` (copy from `server/env.example`)

4. Configure environment variables:
   - Backend: Copy `server/env.example` to `server/.env` and update values

### Development

Run both frontend and backend together:

```bash
npm run dev
```

This will start:
- **Frontend**: [http://localhost:3000](http://localhost:3000)
- **Backend**: [http://localhost:3001](http://localhost:3001)

### Running Individually

To run only the frontend:
```bash
cd client
npm run dev
```

To run only the backend:
```bash
cd server
npm run start:dev
```

### Build

Build both applications:
```bash
npm run build
```

## Documentation

- Frontend documentation: See `client/` folder
- Backend documentation: See `server/README.md`

## Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [NestJS Documentation](https://docs.nestjs.com)

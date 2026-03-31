# Bolão Pro Server

NestJS backend for the Bolão Pro social sports betting platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

3. Update `.env` with your database URL and JWT secret:
```
DATABASE_URL=postgresql://user:password@localhost:5432/bolao_pro
JWT_SECRET=your-secure-secret-key
JWT_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION_DAYS=7
PORT=3001
FRONTEND_URL=http://localhost:3000
```

4. Run Prisma migrations:
```bash
npx prisma migrate dev
```

5. (Optional) Seed database with sample data:
```bash
npx prisma db seed
```

## Development

Start development server with hot reload:
```bash
npm run start:dev
```

Server will be available at `http://localhost:3001`
Swagger API docs at `http://localhost:3001/api/docs`

## Production

Build:
```bash
npm run build
```

Start:
```bash
npm run start:prod
```

## Testing

Run tests:
```bash
npm test
```

Watch mode:
```bash
npm run test:watch
```

Coverage:
```bash
npm run test:cov
```

## API Documentation

Full API documentation is available at `/api/docs` when server is running.

## Architecture

```
src/
├── common/              # Shared utilities, guards, interceptors
│   ├── decorators/
│   ├── guards/
│   ├── interceptors/
│   ├── filters/
│   ├── dto/
│   └── interfaces/
├── modules/             # Feature modules
│   ├── auth/           # Authentication & authorization
│   ├── users/          # User profiles
│   ├── pools/          # Pool management
│   ├── predictions/    # User predictions
│   ├── rankings/       # Ranking calculations
│   ├── sports/         # Teams, championships, matches
│   ├── payments/       # Payment processing
│   ├── notifications/  # User notifications
│   ├── audit/          # Audit logging
│   └── prisma/         # Database client
├── app.module.ts       # Root module
└── main.ts            # Application entry point
```

## Key Features

- **Authentication**: JWT-based auth with refresh tokens
- **Pools**: Create and manage social betting pools
- **Predictions**: Real-time prediction submission with match lock validation
- **Rankings**: Automated scoring and ranking calculations
- **Payments**: MVP payment flow simulation (easily integrated with real providers)
- **Notifications**: User notification system
- **Audit Logging**: Complete action audit trail
- **Admin Panel**: Team, championship, and match management

## Database

Uses PostgreSQL with Prisma ORM. Schema is defined in `prisma/schema.prisma`.

Key entities:
- Users
- Pools & PoolMembers
- Matches & Predictions
- Payments
- Notifications
- AuditLogs

## Security

- Password hashing with bcrypt
- JWT tokens with configurable expiration
- Refresh token rotation
- Role-based access control (RBAC)
- CORS configuration
- Helmet for HTTP headers protection
- Input validation with class-validator
- Request throttling

# Bolão Pro Server - Complete Setup Guide

## Prerequisites

- Node.js 18+ 
- PostgreSQL 14+
- npm or yarn

## Installation Steps

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment Variables

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` with your configuration:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/bolao_pro
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-change-in-production
JWT_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION_DAYS=7
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

### 3. Database Setup

Initialize the database with Prisma:

```bash
# Create migrations (for first time setup)
npx prisma migrate dev --name init

# Or, if using existing schema
npx prisma migrate deploy
```

### 4. (Optional) Seed Test Data

```bash
npx prisma db seed
```

This creates:
- Admin user: admin@bolao.pro / Admin@1234
- Test user: test@example.com / Test@1234
- Sample teams: Brazil, Argentina, France
- Sample championship: Copa America 2026
- Sample matches for testing

### 5. Start Development Server

```bash
npm run start:dev
```

Server will be available at: http://localhost:3001
API Docs: http://localhost:3001/api/docs

## Testing

### Run Unit Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage
```bash
npm run test:cov
```

## Production Deployment

### Build
```bash
npm run build
```

### Start Production Server
```bash
npm run start:prod
```

## Database Management

### View Database
```bash
npx prisma studio
```

Opens interactive UI to view and edit database at http://localhost:5555

### Reset Database (WARNING: Destructive)
```bash
npx prisma migrate reset
```

### Create New Migration
```bash
npx prisma migrate dev --name descriptive_name
```

## API Endpoints Overview

All endpoints are prefixed with `/api/v1`

### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh access token
- `POST /auth/logout` - Logout user
- `POST /auth/verify-email` - Verify email
- `POST /auth/forgot-password` - Request password reset
- `POST /auth/reset-password` - Reset password

### Users
- `GET /users/me` - Get current user profile
- `PATCH /users/me` - Update profile
- `GET /users/me/stats` - Get user statistics

### Pools
- `POST /pools` - Create pool
- `GET /pools` - List user's pools
- `GET /pools/:id` - Get pool details
- `PATCH /pools/:id` - Update pool
- `DELETE /pools/:id` - Delete pool
- `POST /pools/:id/join` - Join pool
- `POST /pools/:id/leave` - Leave pool
- `GET /pools/:id/members` - List pool members
- `PATCH /pools/:id/members/:memberId` - Update member status
- `GET /pools/invite/:code` - Get pool info by invite code (public)

### Predictions
- `GET /pools/:poolId/predictions` - Get my predictions
- `GET /pools/:poolId/predictions/round/:roundId` - Get predictions by round
- `PUT /pools/:poolId/predictions/batch` - Save predictions in batch
- `GET /pools/:poolId/predictions/all` - Get all pool predictions

### Rankings
- `GET /pools/:poolId/ranking` - Get pool ranking

### Sports (Admin Only)
- `POST /admin/teams` - Create team
- `GET /admin/teams` - List teams
- `GET /admin/teams/:id` - Get team
- `PATCH /admin/teams/:id` - Update team
- `DELETE /admin/teams/:id` - Delete team

- `POST /admin/championships` - Create championship
- `GET /admin/championships` - List championships
- `GET /admin/championships/:id` - Get championship
- `PATCH /admin/championships/:id` - Update championship
- `DELETE /admin/championships/:id` - Delete championship

- `POST /admin/matches` - Create match
- `GET /admin/matches` - List matches
- `GET /admin/matches/:id` - Get match
- `PATCH /admin/matches/:id/result` - Register match result

### Payments
- `GET /pools/:poolId/payment` - Get payment status
- `POST /pools/:poolId/payment/generate` - Generate payment link
- `POST /pools/:poolId/payment/webhook/:provider` - Payment webhook

### Notifications
- `GET /notifications` - List my notifications
- `GET /notifications/unread-count` - Get unread count
- `PATCH /notifications/:id/read` - Mark as read
- `POST /notifications/read-all` - Mark all as read
- `DELETE /notifications/:id` - Delete notification

### Audit (Admin Only)
- `GET /admin/audit-logs` - Get audit logs

## Scoring System

The scoring engine calculates points based on:

1. **Exact Score Match**: 10 points
2. **Correct Winner + Goal Difference**: 7 points
3. **Correct Winner + Winning Team Goals**: 5 points
4. **Correct Winner**: 3 points
5. **Correct Draw (not exact)**: 2 points
6. **Knockout Bonus**: +5 points (if knockout winner predicted correctly)
7. **Miss**: 0 points

## Tiebreaker Rules

When users have the same total score:
1. Most correct results (exact scores)
2. Most correct winners
3. Most predictions made

## Architecture

```
server/
├── src/
│   ├── common/              # Shared utilities
│   │   ├── decorators/     # @CurrentUser, @Roles
│   │   ├── guards/         # JwtAuthGuard, RolesGuard
│   │   ├── interceptors/   # Transform, Audit
│   │   ├── filters/        # Exception handling
│   │   └── dto/            # Pagination, responses
│   ├── modules/            # Feature modules
│   │   ├── auth/          # Authentication
│   │   ├── users/         # Profiles
│   │   ├── pools/         # Pool management
│   │   ├── predictions/   # Predictions
│   │   ├── rankings/      # Scoring & ranking
│   │   ├── sports/        # Teams, championships, matches
│   │   ├── payments/      # Payments
│   │   ├── notifications/ # Notifications
│   │   ├── audit/         # Audit logging
│   │   └── prisma/        # Database
│   ├── app.module.ts      # Root module
│   └── main.ts            # Entry point
├── prisma/
│   ├── schema.prisma      # Database schema
│   └── seed.ts            # Test data seed
├── package.json           # Dependencies
├── tsconfig.json          # TypeScript config
└── README.md              # Documentation
```

## Common Issues

### Database Connection Error
- Check DATABASE_URL is correct
- Ensure PostgreSQL is running
- Verify database exists

### JWT Token Errors
- Ensure JWT_SECRET is set in .env
- Token might be expired (check JWT_EXPIRATION)
- Use /auth/refresh to get new access token

### Port Already in Use
```bash
# Find and kill process on port 3001
lsof -i :3001
kill -9 <PID>
```

### Module Not Found Errors
- Run `npm install` again
- Delete `node_modules` and `dist`
- Clear TypeScript cache: `rm -rf dist/`

## Development Workflow

1. Make changes to TypeScript files
2. `npm run start:dev` automatically recompiles
3. Test with Swagger UI at `/api/docs`
4. Create Prisma migration for schema changes: `npx prisma migrate dev --name describe_change`
5. Run tests: `npm test`

## Performance Tips

- Use pagination for large datasets (limit 1-100)
- Indexes are created on frequently queried fields
- Consider caching for rankings (updates only on match result)
- Profile slow queries with `EXPLAIN` in PostgreSQL

## Security Checklist

- Change JWT_SECRET in production
- Use strong database password
- Enable HTTPS in production
- Rotate refresh tokens
- Implement rate limiting (already in place with throttler)
- Use environment variables for all secrets
- Validate all user inputs (already done with class-validator)
- Sanitize error messages

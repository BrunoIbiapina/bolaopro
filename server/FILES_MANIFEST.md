# Bolão Pro Server - Complete Files Manifest

## Project Root Configuration

```
server/
├── package.json                     # NPM dependencies and scripts
├── tsconfig.json                    # TypeScript configuration
├── nest-cli.json                    # NestJS CLI configuration
├── .env.example                     # Environment variables template
├── .gitignore                       # Git ignore patterns
├── README.md                        # Quick start guide
├── SETUP.md                         # Complete setup instructions
├── ARCHITECTURE.md                  # Architecture documentation
└── FILES_MANIFEST.md                # This file
```

## Source Code Structure

### Main Application Entry

```
src/
├── main.ts                          # Application bootstrap
├── app.module.ts                    # Root module with all imports
```

### Common Utilities (`src/common/`)

#### Decorators
```
common/decorators/
├── current-user.decorator.ts        # @CurrentUser() - Extract JWT user
└── roles.decorator.ts               # @Roles() - Mark required roles
```

#### Guards
```
common/guards/
├── jwt-auth.guard.ts                # JWT validation guard
└── roles.guard.ts                   # Role-based access control
```

#### Interceptors
```
common/interceptors/
├── transform.interceptor.ts         # Wrap responses in standard format
└── audit.interceptor.ts             # Automatic audit logging
```

#### Filters
```
common/filters/
└── http-exception.filter.ts         # Structured error responses
```

#### DTOs (Data Transfer Objects)
```
common/dto/
├── pagination.dto.ts                # Pagination query params
└── paginated-response.dto.ts        # Pagination response format
```

#### Interfaces
```
common/interfaces/
└── jwt-payload.interface.ts         # JWT token payload type
```

### Auth Module (`src/modules/auth/`)

```
auth/
├── auth.module.ts                   # Module definition
├── auth.controller.ts               # Endpoints: register, login, refresh, logout, etc.
├── auth.service.ts                  # Authentication logic
├── strategies/
│   └── jwt.strategy.ts              # Passport JWT strategy
└── dto/
    ├── register.dto.ts              # Registration input validation
    ├── login.dto.ts                 # Login input validation
    ├── refresh-token.dto.ts         # Token refresh input
    ├── verify-email.dto.ts          # Email verification
    ├── forgot-password.dto.ts       # Password reset request
    └── reset-password.dto.ts        # Password reset completion
```

Features:
- User registration with email verification
- Login with JWT + refresh tokens
- Password reset flow
- Bcrypt hashing
- Token rotation

### Users Module (`src/modules/users/`)

```
users/
├── users.module.ts                  # Module definition
├── users.controller.ts              # Endpoints: profile, stats
├── users.service.ts                 # User operations
└── dto/
    └── update-profile.dto.ts        # Profile update validation
```

Endpoints:
- GET /users/me - Current user
- PATCH /users/me - Update profile
- GET /users/me/stats - User statistics

### Prisma Module (`src/modules/prisma/`)

```
prisma/
├── prisma.module.ts                 # Global module definition
└── prisma.service.ts                # PrismaClient wrapper
```

Database client initialization and lifecycle management.

### Pools Module (`src/modules/pools/`)

```
pools/
├── pools.module.ts                  # Module definition
├── pools.controller.ts              # Pool CRUD + member management
├── pools.service.ts                 # Pool business logic
└── dto/
    ├── create-pool.dto.ts           # Pool creation validation
    ├── update-pool.dto.ts           # Pool update validation
    └── join-pool.dto.ts             # Join pool validation
```

Features:
- Create pools with organizer
- Generate 8-char invite codes
- Join/leave pools
- Member status management
- Entry fee configuration
- Max participants limit

### Predictions Module (`src/modules/predictions/`)

```
predictions/
├── predictions.module.ts            # Module definition
├── predictions.controller.ts        # Prediction endpoints
├── predictions.service.ts           # Prediction logic
└── dto/
    └── save-predictions.dto.ts      # Batch prediction validation
```

Features:
- Submit predictions in batch
- Match lock validation (15 min before)
- Home/away score prediction
- Knockout winner selection
- Retrieve predictions by pool/round

### Rankings Module (`src/modules/rankings/`)

```
rankings/
├── rankings.module.ts               # Module definition
├── rankings.controller.ts           # Ranking endpoint
├── rankings.service.ts              # Ranking calculation
├── scoring.engine.ts                # Scoring algorithm
└── tiebreaker.engine.ts             # Tiebreaker logic
```

Scoring:
- 10 pts: Exact score
- 7 pts: Winner + goal difference
- 5 pts: Winner + winning goals
- 3 pts: Winner only
- 2 pts: Draw (not exact)
- +5 pts: Knockout bonus

### Sports Module (`src/modules/sports/`)

```
sports/
├── sports.module.ts                 # Module definition
├── teams.controller.ts              # Team CRUD (admin)
├── teams.service.ts                 # Team operations
├── championships.controller.ts      # Championship CRUD (admin)
├── championships.service.ts         # Championship operations
├── matches.controller.ts            # Match CRUD + results (admin)
├── matches.service.ts               # Match operations
└── dto/
    ├── create-team.dto.ts           # Team creation
    ├── update-team.dto.ts           # Team update
    ├── create-championship.dto.ts   # Championship creation
    ├── update-championship.dto.ts   # Championship update
    ├── create-match.dto.ts          # Match creation
    └── register-match-result.dto.ts # Match result registration
```

Features:
- Team management
- Championship scheduling
- Match scheduling with rounds
- Match result registration
- Automatic ranking recalculation

### Payments Module (`src/modules/payments/`)

```
payments/
├── payments.module.ts               # Module definition
├── payments.controller.ts           # Payment endpoints
├── payments.service.ts              # Payment logic
└── dto/
    └── create-payment.dto.ts        # Payment creation
```

Features:
- MVP simulated payment flow
- Payment status tracking
- Webhook handler
- Member confirmation on payment
- Free pool support

### Notifications Module (`src/modules/notifications/`)

```
notifications/
├── notifications.module.ts          # Module definition
├── notifications.controller.ts      # Notification endpoints
└── notifications.service.ts         # Notification logic
```

Features:
- Create notifications
- List with read/unread filter
- Mark as read (single/all)
- Delete notifications
- Unread count

### Audit Module (`src/modules/audit/`)

```
audit/
├── audit.module.ts                  # Global module definition
├── audit.controller.ts              # Audit log queries (admin)
└── audit.service.ts                 # Audit logging
```

Features:
- Automatic action logging
- User IP and agent tracking
- Filterable queries
- Admin-only access

## Database Schema

```
prisma/
├── schema.prisma                    # Complete database schema
└── seed.ts                          # Test data seeding
```

Schema includes:
- User (with roles, tokens, verification)
- RefreshToken
- Championship
- Team
- Match (with results)
- Pool (with members)
- Prediction
- Payment
- Notification
- AuditLog

All with proper relationships, indexes, and enums.

## File Statistics

```
Total TypeScript Files: 75+
Total Lines of Code: ~4,500+

Breakdown:
- Controllers: 12 files
- Services: 12 files
- DTOs: 25+ files
- Modules: 11 files
- Guards/Decorators: 4 files
- Interceptors/Filters: 3 files
- Strategies: 1 file
- Engines: 2 files
- Configuration: 5 files
```

## Key Files to Review

1. **Start Here**
   - `/server/README.md` - Quick start
   - `/server/SETUP.md` - Installation guide

2. **Architecture**
   - `/server/ARCHITECTURE.md` - System design
   - `/src/app.module.ts` - Module composition

3. **Authentication**
   - `/src/modules/auth/auth.service.ts` - Auth logic
   - `/src/modules/auth/strategies/jwt.strategy.ts` - JWT validation

4. **Core Logic**
   - `/src/modules/pools/pools.service.ts` - Pool management
   - `/src/modules/predictions/predictions.service.ts` - Predictions
   - `/src/modules/rankings/scoring.engine.ts` - Scoring algorithm

5. **Database**
   - `/prisma/schema.prisma` - Data model
   - `/prisma/seed.ts` - Test data

## Environment Setup

Create `.env` from `.env.example`:

```bash
DATABASE_URL=postgresql://...
JWT_SECRET=min-32-chars-secure-key
JWT_EXPIRATION=15m
REFRESH_TOKEN_EXPIRATION_DAYS=7
PORT=3001
FRONTEND_URL=http://localhost:3000
NODE_ENV=development
```

## Running the Application

```bash
# Install
npm install

# Database
npx prisma migrate dev

# Seed (optional)
npx prisma db seed

# Development
npm run start:dev

# Production
npm run build
npm run start:prod

# Testing
npm test
```

## API Documentation

Swagger UI available at: `http://localhost:3001/api/docs`

All endpoints documented with:
- Operation descriptions
- Request/response schemas
- Authorization requirements
- Example values

## Integration Points

Ready to integrate:
- Payment providers (Stripe, MercadoPago)
- Email services (SendGrid, AWS SES)
- SMS services (Twilio)
- Analytics (Segment, Mixpanel)
- Real-time (Socket.io, WebSocket)
- Cloud storage (AWS S3, GCP Storage)

All modules are designed for easy provider swapping via dependency injection.

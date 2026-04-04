# Bolão Pro Backend Architecture

## Overview

Production-ready NestJS backend for a social sports betting platform. Implements complete pool management, real-time predictions, automated scoring, and payment processing.

## Technology Stack

- **Framework**: NestJS 10.3
- **Language**: TypeScript 5.3
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT + Refresh Tokens
- **Validation**: class-validator & class-transformer
- **Security**: Helmet, bcrypt, CORS
- **Rate Limiting**: @nestjs/throttler
- **API Documentation**: Swagger/OpenAPI

## Core Modules

### 1. Auth Module (`/modules/auth`)
Handles user authentication and authorization.

**Endpoints**:
- Register with email verification
- Login with JWT tokens
- Token refresh mechanism
- Password reset flow
- Email verification

**Features**:
- Bcrypt password hashing
- JWT access tokens (15m default)
- Refresh token rotation (7 days default)
- Email verification tokens
- Password reset with expiration

### 2. Users Module (`/modules/users`)
User profile and statistics management.

**Endpoints**:
- Get current user profile
- Update user profile
- Get user statistics

**Features**:
- User avatars and bio
- Participation statistics
- Pool and prediction counts

### 3. Pools Module (`/modules/pools`)
Core pool management functionality.

**Features**:
- Pool creation with organizer
- Invite code generation (nanoid)
- Join pools via invite code
- Pool members management
- Entry fee configuration
- Maximum participants limit
- Custom pool rules

**Endpoints**:
- CRUD operations for pools
- Member management
- Invite code handling
- Pool listing (organized + participating)

### 4. Predictions Module (`/modules/predictions`)
User prediction submission and retrieval.

**Features**:
- Batch prediction submission
- Match lock validation (15 minutes before scheduled time)
- Score prediction: home and away scores
- Knockout winner prediction
- Prediction history

**Endpoints**:
- Submit predictions
- Retrieve predictions by pool/round
- List all pool predictions

### 5. Rankings Module (`/modules/rankings`)
Scoring and ranking calculation.

**Scoring Engine** (`scoring.engine.ts`):
- 10 pts: Exact score match
- 7 pts: Correct winner + same goal difference
- 5 pts: Correct winner + same winning team goals
- 3 pts: Correct winner only
- 2 pts: Correct draw (not exact)
- +5 pts: Knockout winner bonus
- 0 pts: Miss

**Tiebreaker Engine** (`tiebreaker.engine.ts`):
1. Total score (descending)
2. Correct exact results count
3. Correct winners count
4. Total predictions made

**Features**:
- Automatic recalculation on match results
- Per-pool rankings
- Complete prediction statistics

### 6. Sports Module (`/modules/sports`)
Sports data management.

**Sub-modules**:
- **Teams**: CRUD for teams with logos
- **Championships**: Tournament/league management
- **Matches**: Match scheduling and result registration

**Features**:
- Team management with country info
- Championship scheduling
- Match scheduling with rounds
- Match result registration (triggers ranking recalculation)
- Automatic timezone handling

**Admin Only Endpoints**:
- All CRUD operations require ADMIN role

### 7. Payments Module (`/modules/payments`)
Payment processing for pool entry fees.

**Features**:
- Free pool support
- Payment status tracking
- MVP: Simulated payment flow
- Webhook handler for payment confirmation
- Member status update on payment

**Endpoints**:
- Check payment status
- Generate payment link
- Handle payment webhooks

**MVP Implementation**:
- Generates mock payment links
- Simulates payment flow
- Ready for real provider integration (Stripe, MercadoPago, etc.)

### 8. Notifications Module (`/modules/notifications`)
User notification system.

**Features**:
- Pool-related notifications
- Read/unread tracking
- Bulk marking as read
- Notification deletion
- Unread count

**Endpoints**:
- List notifications
- Mark as read (single/all)
- Delete notifications
- Unread count

### 9. Audit Module (`/modules/audit`)
Complete audit logging for compliance.

**Features**:
- Action logging (POST, PUT, PATCH, DELETE)
- Entity type and ID tracking
- User identification
- IP address recording
- User agent recording
- Old/new data tracking (optional)

**Endpoints**:
- Query audit logs with filters
- Filter by action, entity type, user, date range
- Admin only access

## Common Components

### Decorators (`/common/decorators`)
- `@CurrentUser()`: Extract user from JWT
- `@Roles(...roles)`: Role-based authorization

### Guards (`/common/guards`)
- `JwtAuthGuard`: JWT validation
- `RolesGuard`: Role-based access control

### Interceptors (`/common/interceptors`)
- `TransformInterceptor`: Wrap responses in consistent format
- `AuditInterceptor`: Log actions automatically

### DTOs (`/common/dto`)
- `PaginationDto`: Standardized pagination
- `PaginatedResponseDto`: Pagination metadata

### Filters (`/common/filters`)
- `HttpExceptionFilter`: Structured error responses

## Database Schema

### Users
- Unique email with password hash
- Roles (USER, ADMIN)
- Email verification support
- Password reset tokens

### Pools
- Organizer relationship
- Championship reference
- Invite codes (unique, 8 chars)
- Entry fees and participant limits
- Member relationships

### Predictions
- Unique per (user, match, pool)
- Score predictions (home/away)
- Knockout winner selection
- Automatic lock validation

### Matches
- Championship and team relationships
- Scheduled time (with lock validation)
- Match results (home/away scores)
- Round identification

### Payments
- Pool and user relationships
- Status tracking (PENDING, PAID, FAILED, REFUNDED)
- Transaction ID for webhooks
- Paid timestamp

### Notifications
- User and pool relationships
- Type classification
- Read tracking
- Deletion support

### AuditLogs
- Complete action trail
- User IP and user agent
- Old/new data in JSON
- Entity tracking

## API Response Format

All endpoints return:

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": { /* response data */ },
  "timestamp": "2026-03-30T10:00:00.000Z"
}
```

Pagination responses include metadata:

```json
{
  "data": [ /* items */ ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## Error Handling

Consistent error format:

```json
{
  "statusCode": 400,
  "message": "Invalid credentials",
  "timestamp": "2026-03-30T10:00:00.000Z"
}
```

Validation errors include details:

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [ /* validation messages */ ],
  "timestamp": "2026-03-30T10:00:00.000Z"
}
```

## Security Features

1. **Authentication**
   - JWT-based with configurable expiration
   - Refresh token rotation
   - Secure password hashing (bcrypt 10 rounds)

2. **Authorization**
   - Role-based access control (RBAC)
   - Fine-grained permissions per endpoint
   - Guard composition

3. **Input Validation**
   - class-validator decorators
   - Type transformation
   - Whitelist/forbid unknown properties

4. **HTTP Security**
   - Helmet headers
   - CORS configuration
   - Rate limiting (100 requests/60s per IP)

5. **Audit Trail**
   - Complete action logging
   - User identification
   - IP tracking

## Performance Optimizations

1. **Database**
   - Strategic indexes on frequently queried fields
   - Optimized queries with select fields
   - Relationships loaded efficiently

2. **Caching Opportunities** (Future)
   - Cache championship/team data
   - Cache pool rankings (update only on result change)
   - Redis integration ready

3. **Pagination**
   - 20 items default, max 100
   - Offset-based pagination
   - Total count in metadata

## Testing Strategy

- Unit tests for services
- Integration tests for controllers
- Test database seeding
- Mock authentication
- Coverage reporting

## Deployment Considerations

1. **Environment Variables**
   - Database URL
   - JWT secret (32+ chars)
   - Frontend URL for CORS

2. **Database**
   - Run migrations: `npx prisma migrate deploy`
   - Use proper connection pooling
   - Enable SSL in production

3. **Server**
   - Use process manager (pm2)
   - Enable HTTPS
   - Set NODE_ENV=production
   - Configure CORS for production domain

4. **Monitoring**
   - Log aggregation
   - Error tracking
   - Performance monitoring
   - Audit log review

## Integration Points

Ready for integration with:

- **Authentication**: OAuth2, SAML
- **Payments**: Stripe, MercadoPago, PayPal
- **Email**: SendGrid, Mailgun, AWS SES
- **SMS**: Twilio
- **Analytics**: Segment, Mixpanel
- **Chat**: Real-time notifications (Socket.io, WebSocket)

## Future Enhancements

1. WebSocket support for real-time rankings
2. Email notifications
3. SMS notifications
4. Advanced analytics
5. Social features (friends, invitations)
6. Mobile push notifications
7. Advanced payment provider integrations
8. Automated scheduled matches
9. League/tournament modes
10. Live score updates integration

// ============================================================================
// ENUMS - Shared between frontend and backend
// ============================================================================

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  ORGANIZER = 'ORGANIZER',
  PARTICIPANT = 'PARTICIPANT',
  FINANCE = 'FINANCE',
}

export enum UserStatus {
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DELETED = 'DELETED',
}

export enum PoolStatus {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
  FINISHED_NO_WINNER = 'FINISHED_NO_WINNER',
  CANCELLED = 'CANCELLED',
}

export enum PoolMemberStatus {
  INVITED = 'INVITED',
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  REMOVED = 'REMOVED',
  ELIMINATED = 'ELIMINATED',
}

export enum MatchStatus {
  SCHEDULED = 'SCHEDULED',
  LIVE = 'LIVE',
  HALF_TIME = 'HALF_TIME',
  FINISHED = 'FINISHED',
  POSTPONED = 'POSTPONED',
  CANCELLED = 'CANCELLED',
  WALKOVER = 'WALKOVER',
}

export enum PredictionStatus {
  OPEN = 'OPEN',
  LOCKED = 'LOCKED',
  SCORED = 'SCORED',
  INVALIDATED = 'INVALIDATED',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  PAID = 'PAID',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
  CHARGEDBACK = 'CHARGEDBACK',
}

export enum PaymentMethod {
  PIX = 'PIX',
  CREDIT_CARD = 'CREDIT_CARD',
  BOLETO = 'BOLETO',
}

export enum RefundStatus {
  PENDING = 'PENDING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum NotificationType {
  POOL_INVITE = 'POOL_INVITE',
  PAYMENT_PENDING = 'PAYMENT_PENDING',
  PAYMENT_CONFIRMED = 'PAYMENT_CONFIRMED',
  PREDICTION_CONFIRMED = 'PREDICTION_CONFIRMED',
  PREDICTION_DEADLINE = 'PREDICTION_DEADLINE',
  MATCH_RESULT = 'MATCH_RESULT',
  YOU_WON = 'YOU_WON',
  YOU_LOST = 'YOU_LOST',
  RANKING_UPDATED = 'RANKING_UPDATED',
  CHAMPION_DECLARED = 'CHAMPION_DECLARED',
  REFUND_AVAILABLE = 'REFUND_AVAILABLE',
  POOL_CANCELLED = 'POOL_CANCELLED',
  ORGANIZER_MESSAGE = 'ORGANIZER_MESSAGE',
}

export enum ChampionshipType {
  LEAGUE = 'LEAGUE',
  CUP = 'CUP',
  MIXED = 'MIXED',
}

export enum ChampionshipStatus {
  PLANNED = 'PLANNED',
  IN_PROGRESS = 'IN_PROGRESS',
  FINISHED = 'FINISHED',
  CANCELLED = 'CANCELLED',
}

export enum AuditAction {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
  PAYMENT_REFUNDED = 'PAYMENT_REFUNDED',
  PAYMENT_CHARGEDBACK = 'PAYMENT_CHARGEDBACK',
  PREDICTION_LOCKED = 'PREDICTION_LOCKED',
  RESULT_REGISTERED = 'RESULT_REGISTERED',
  RANKING_RECALCULATED = 'RANKING_RECALCULATED',
  CHAMPION_DECLARED = 'CHAMPION_DECLARED',
  POOL_CANCELLED = 'POOL_CANCELLED',
  MEMBER_REMOVED = 'MEMBER_REMOVED',
  SETTINGS_CHANGED = 'SETTINGS_CHANGED',
}

// ============================================================================
// RESPONSE TYPES
// ============================================================================

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
}

// ============================================================================
// USER DTOs
// ============================================================================

export interface UserDTO {
  id: string;
  email: string;
  emailVerified: boolean;
  status: UserStatus;
  role: UserRole;
  profile?: ProfileDTO;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProfileDTO {
  id: string;
  userId: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  birthDate?: Date;
  pixKey?: string;
  pixKeyType?: string;
  cpf?: string;
  timezone: string;
  darkMode: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  fullName: string;
  phone?: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  phone?: string;
  avatarUrl?: string;
  birthDate?: Date;
  pixKey?: string;
  pixKeyType?: string;
  cpf?: string;
  timezone?: string;
  darkMode?: boolean;
}

// ============================================================================
// POOL DTOs
// ============================================================================

export interface PoolDTO {
  id: string;
  name: string;
  description?: string;
  organizerId: string;
  championshipId: string;
  status: PoolStatus;
  entryFee: number;
  maxParticipants?: number;
  inviteCode: string;
  registrationDeadline?: Date;
  platformFeePercent: number;
  totalPrize: number;
  createdAt: Date;
  updatedAt: Date;
  finishedAt?: Date;
  cancelledAt?: Date;
}

export interface CreatePoolRequest {
  name: string;
  description?: string;
  championshipId: string;
  entryFee: number;
  maxParticipants?: number;
  registrationDeadline?: Date;
  platformFeePercent?: number;
}

export interface UpdatePoolRequest {
  name?: string;
  description?: string;
  entryFee?: number;
  maxParticipants?: number;
  registrationDeadline?: Date;
  platformFeePercent?: number;
}

export interface PoolRulesDTO {
  id: string;
  poolId: string;
  exactScorePoints: number;
  correctWinnerDiffPoints: number;
  correctWinnerGoalsPoints: number;
  correctWinnerPoints: number;
  correctDrawPoints: number;
  knockoutBonusPoints: number;
  lockMinutesBefore: number;
  allowPredictionEdit: boolean;
  requirePayment: boolean;
  walkoverPolicy: string;
  postponedPolicy: string;
  tiebreakerOrder: string[];
  championCriteria: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PayoutRuleDTO {
  id: string;
  poolId: string;
  position: number;
  percentage: number;
  createdAt: Date;
}

export interface PoolMemberDTO {
  id: string;
  poolId: string;
  userId: string;
  status: PoolMemberStatus;
  joinedAt?: Date;
  user?: UserDTO;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// CHAMPIONSHIP & MATCH DTOs
// ============================================================================

export interface ChampionshipDTO {
  id: string;
  name: string;
  season: string;
  country?: string;
  type: ChampionshipType;
  status: ChampionshipStatus;
  startDate?: Date;
  endDate?: Date;
  logoUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RoundDTO {
  id: string;
  championshipId: string;
  number: number;
  name: string;
  startDate?: Date;
  endDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface TeamDTO {
  id: string;
  name: string;
  shortName: string;
  logoUrl?: string;
  country: string;
  state?: string;
  city?: string;
  stadium?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MatchDTO {
  id: string;
  roundId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeTeam?: TeamDTO;
  awayTeam?: TeamDTO;
  scheduledAt: Date;
  stadium?: string;
  status: MatchStatus;
  homeScore?: number;
  awayScore?: number;
  homeScoreExtraTime?: number;
  awayScoreExtraTime?: number;
  homePenalties?: number;
  awayPenalties?: number;
  winnerId?: string;
  isKnockout: boolean;
  startedAt?: Date;
  finishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// PREDICTION & SCORING DTOs
// ============================================================================

export interface PredictionDTO {
  id: string;
  poolMemberId: string;
  matchId: string;
  userId: string;
  homeScore: number;
  awayScore: number;
  knockoutWinnerId?: string;
  status: PredictionStatus;
  pointsEarned?: number;
  scoringDetail?: string;
  lockedAt?: Date;
  scoredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePredictionRequest {
  matchId: string;
  homeScore: number;
  awayScore: number;
  knockoutWinnerId?: string;
}

export interface UpdatePredictionRequest {
  homeScore: number;
  awayScore: number;
  knockoutWinnerId?: string;
}

export interface StandingDTO {
  id: string;
  poolId: string;
  poolMemberId: string;
  position: number;
  previousPosition?: number;
  totalPoints: number;
  exactScores: number;
  correctWinners: number;
  correctDraws: number;
  totalErrors: number;
  totalPredictions: number;
  isChampion: boolean;
  prizeAmount?: number;
  lastCalculatedAt: Date;
  user?: UserDTO;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// PAYMENT DTOs
// ============================================================================

export interface PaymentDTO {
  id: string;
  poolMemberId: string;
  userId: string;
  amount: number;
  method?: PaymentMethod;
  status: PaymentStatus;
  providerName: string;
  providerPaymentId?: string;
  paymentLink?: string;
  paymentLinkExpiry?: Date;
  qrCode?: string;
  qrCodeBase64?: string;
  paidAt?: Date;
  expiredAt?: Date;
  cancelledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePaymentRequest {
  poolMemberId: string;
  amount: number;
  method: PaymentMethod;
}

export interface RefundDTO {
  id: string;
  paymentId: string;
  amount: number;
  reason: string;
  status: RefundStatus;
  providerRefundId?: string;
  processedAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// NOTIFICATION DTOs
// ============================================================================

export interface NotificationDTO {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  readAt?: Date;
  sentEmailAt?: Date;
  createdAt: Date;
}

// ============================================================================
// AUDIT DTOs
// ============================================================================

export interface AuditLogDTO {
  id: string;
  userId?: string;
  action: AuditAction;
  entityType: string;
  entityId: string;
  oldData?: Record<string, any>;
  newData?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

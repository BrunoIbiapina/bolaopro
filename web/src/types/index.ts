// User & Auth
export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  pixKey?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Profile {
  id: string;
  userId: string;
  phone?: string;
  avatarUrl?: string;
  pixKey?: string;
  darkMode: boolean;
  updatedAt: string;
}

export enum UserRole {
  USER = 'USER',
  ADMIN = 'ADMIN',
}

// Authentication
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
}

// Pool
export interface Pool {
  id: string;
  name: string;
  description?: string;
  organizerId: string;
  organizer: User;
  championship: Championship;
  championshipId: string;
  entryFee: number;
  maxParticipants: number;
  cotasPerParticipant?: number;
  inviteCode: string;
  status: PoolStatus;
  rules?: string;
  createdAt: string;
  updatedAt: string;
  memberCount?: number;
  nextMatch?: Match;
  position?: number;
  totalParticipants?: number;
}

export interface PoolMember {
  id: string;
  poolId: string;
  userId: string;
  user: User;
  joinedAt: string;
  points: number;
  status: string;
  numCotas?: number;
  paymentStatus: PaymentStatus;
}

export enum PoolStatus {
  OPEN = 'OPEN',
  CLOSED = 'CLOSED',
  RUNNING = 'RUNNING',
  FINISHED = 'FINISHED',
}

// Championship, Team & Match
export interface Championship {
  id: string;
  name: string;
  abbreviation: string;
  country?: string;
  logoUrl?: string;
  startDate: string;
  endDate?: string;
  status: ChampionshipStatus;
  createdAt: string;
}

export enum ChampionshipStatus {
  UPCOMING = 'UPCOMING',
  RUNNING = 'RUNNING',
  FINISHED = 'FINISHED',
}

export interface Team {
  id: string;
  name: string;
  abbreviation: string;
  logoUrl?: string;
  country?: string;
  createdAt: string;
}

export interface Match {
  id: string;
  championshipId: string;
  homeTeamId: string;
  homeTeam: Team;
  awayTeamId: string;
  awayTeam: Team;
  roundNumber: number;
  scheduledAt: string;
  status: MatchStatus;
  homeTeamScore?: number;
  awayTeamScore?: number;
  homeScoreResult?: number | null;
  awayScoreResult?: number | null;
  roundId?: string;
  createdAt: string;
  updatedAt: string;
}

export enum MatchStatus {
  SCHEDULED = 'SCHEDULED',
  LIVE = 'LIVE',
  FINISHED = 'FINISHED',
  CANCELLED = 'CANCELLED',
}

// Prediction
export interface Prediction {
  id: string;
  poolId: string;
  userId: string;
  user?: User;
  matchId: string;
  match?: Match;
  homeTeamPrediction: number;
  awayTeamPrediction: number;
  points?: number;
  status: PredictionStatus;
  createdAt: string;
  updatedAt: string;
}

export enum PredictionStatus {
  PENDING = 'PENDING',
  LOCKED = 'LOCKED',
  FINISHED = 'FINISHED',
  MISSED = 'MISSED',
}

// Standing
export interface Standing {
  position: number;
  userId: string;
  user: User;
  poolId: string;
  points: number;
  matchesPlayed: number;
  matchesCorrect: number;
  accuracy: number;
  trend?: 'up' | 'down' | 'stable';
}

// Payment
export interface Payment {
  id: string;
  poolId: string;
  userId: string;
  user?: User;
  amount: number;
  status: PaymentStatus;
  method?: PaymentMethod;
  pixKey?: string;
  transactionId?: string;
  createdAt: string;
  updatedAt: string;
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

export enum PaymentMethod {
  PIX = 'PIX',
  CREDIT_CARD = 'CREDIT_CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

// Notification
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
}

export enum NotificationType {
  POOL_CREATED = 'POOL_CREATED',
  POOL_JOINED = 'POOL_JOINED',
  USER_JOINED = 'USER_JOINED',
  MATCH_STARTED = 'MATCH_STARTED',
  MATCH_FINISHED = 'MATCH_FINISHED',
  RESULTS_AVAILABLE = 'RESULTS_AVAILABLE',
  PAYMENT_REQUIRED = 'PAYMENT_REQUIRED',
  ROUND_STARTED = 'ROUND_STARTED',
  PREDICTION_LOCKED = 'PREDICTION_LOCKED',
  POOL_FINISHED = 'POOL_FINISHED',
  SYSTEM = 'SYSTEM',
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// API Response
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

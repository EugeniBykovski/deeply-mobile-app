/**
 * API response types — typed against deeply-backend DTOs.
 * Keep in sync with the backend response shapes.
 */

// ─── Auth ─────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface AppleLoginPayload {
  token: string;
}

export interface RefreshPayload {
  refreshToken: string;
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email?: string | null;
  appleSub: string;
}

// ─── Culture ──────────────────────────────────────────────────────────────────

export interface CultureSection {
  key: string;
  title: string;
  description: string;
}

export interface CultureArticleListItem {
  id: string;
  slug: string;
  section: string;
  title: string;
  description?: string | null;
  coverImageUrl?: string | null;
  readTimeMinutes?: number | null;
  publishedAt?: string | null;
  lang: string;
}

export interface CultureArticle extends CultureArticleListItem {
  subtitle?: string | null;
  contentMarkdown: string;
}

export interface CultureArticlesResponse {
  items: CultureArticleListItem[];
  nextPageOutput?: string | null;
}

// ─── Training ─────────────────────────────────────────────────────────────────

export type TrainingPhase = 'INHALE' | 'HOLD' | 'EXHALE' | 'REST';
export type TrainingKind = 'PRESET' | 'PRIVATE';

export interface TrainingStep {
  phase: TrainingPhase;
  durationSeconds: number;
}

export interface TrainBlock {
  key: string;
  slug: string;
  title: string;
  description: string;
  totalTrainings: number;
  freeTrainings: number;
  premiumTrainings: number;
}

export type TrainingRunStatus = 'completed' | 'in_progress' | null;

export interface TrainingListItem {
  id: string;
  slug: string;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  isPremium: boolean;
  isLocked: boolean;
  estimatedMinutes?: number | null;
  intensityLevel?: number | null;
  /** null when user is not authenticated or has no runs for this training */
  lastRunStatus: TrainingRunStatus;
  lang: string;
}

export interface TrainingDetail {
  id: string;
  slug?: string | null;
  kind: TrainingKind;
  programKey?: string | null;
  programSlug?: string | null;
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  isPremium: boolean;
  isLocked: boolean;
  estimatedMinutes?: number | null;
  intensityLevel?: number | null;
  name?: string | null;
  pointCount?: number | null;
  repeats?: number | null;
  saveResults?: boolean | null;
  saveCO2?: boolean | null;
  onlyClock?: boolean | null;
  steps: TrainingStep[];
  lang: string;
}

export interface CreatePrivateTrainingPayload {
  name: string;
  pointCount?: number;
  repeats?: number;
  saveResults?: boolean;
  saveCO2?: boolean;
  onlyClock?: boolean;
  steps: Omit<TrainingStep, never>[];
}

export interface CreateTrainingRunPayload {
  templateId: string;
  completed?: boolean;
  totalSeconds?: number;
  metrics?: Record<string, unknown>;
}

// ─── Results ─────────────────────────────────────────────────────────────────

export interface ResultsProgramProgress {
  key: string;
  slug: string;
  title: string;
  description: string;
  completedMain: number;
  mainTotal: number;
  completedTotal: number;
  total: number;
}

export interface ResultsPrivateItem {
  id: string;
  name: string;
  runsCount: number;
  lastRunAt?: string | null;
  bestTotalSeconds?: number | null;
}

export interface ResultsAchievement {
  type: string;
  scopeKey: string;
  unlockedAt: string;
  payload?: Record<string, unknown> | null;
}

export interface ResultsRunItem {
  id: string;
  startedAt: string;
  finishedAt?: string | null;
  totalSeconds?: number | null;
  completed: boolean;
  metrics?: Record<string, unknown> | null;
}

export interface ResultsSummary {
  programs: ResultsProgramProgress[];
  privateTrainings: ResultsPrivateItem[];
  achievements: ResultsAchievement[];
  overall: {
    totalRuns: number;
    currentStreakDays: number;
  };
}

// ─── Dive ─────────────────────────────────────────────────────────────────────

export interface DiveProfilePoint {
  sortOrder: number;
  timeSeconds: number;
  depthMeters: number;
}

export interface DiveTemplateItem {
  id: string;
  slug: string;
  difficulty: string;
  maxDepthMeters: number;
  targetHoldSeconds?: number | null;
  isPremium: boolean;
  isLocked: boolean;
  title: string;
  subtitle?: string | null;
  description?: string | null;
  lang: string;
}

export interface DiveTemplate extends DiveTemplateItem {
  profilePoints: DiveProfilePoint[];
}

export interface DiveListResponse {
  items: DiveTemplateItem[];
}

export interface CreateDiveRunPayload {
  templateId: string;
  holdSeconds: number;
  completed?: boolean;
  metrics?: Record<string, unknown>;
}

export interface DiveRunResponse {
  id: string;
  startedAt: string;
  holdSeconds: number;
  maxDepthMeters: number;
  completed: boolean;
}

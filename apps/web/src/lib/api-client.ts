import {
  UserProfile,
  CommitmentDto,
  MandateDto,
  TransactionDto,
  TransactionImportDto,
  DetectionCandidateDto,
  RadarItemDto,
  FinancialSummaryDto,
  CategoryBreakdownDto,
  NotificationDto,
  ReminderDto,
  CsvPreviewResult,
  ImportCommitResult,
} from '@subguard/types';
import {
  RegisterInput,
  LoginInput,
  UpdateProfileInput,
  CreateCommitmentInput,
  UpdateCommitmentInput,
  CreateMandateInput,
  UpdateMandateInput,
  CommitImportInput,
  ConfirmCandidateInput,
  CreateReminderInput,
} from '@subguard/validation';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/v1';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;

  const res = await fetch(url, {
    ...options,
    credentials: 'include', // Ensures subguard_session cookie is sent
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const errorMsg =
      data.message && Array.isArray(data.message)
        ? data.message.join(', ')
        : data.message || 'An error occurred while processing your request';
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (body: RegisterInput) =>
    request<{ user: UserProfile }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  login: (body: LoginInput) =>
    request<{ user: UserProfile }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  logout: () =>
    request<{ success: boolean }>('/auth/logout', { method: 'POST' }),

  getSession: () => request<{ user: UserProfile }>('/auth/session'),

  // User & Settings
  getProfile: () => request<UserProfile>('/user/profile'),

  updateProfile: (body: UpdateProfileInput) =>
    request<UserProfile>('/user/profile', {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  exportData: () => request<Record<string, unknown>>('/user/export'),

  deleteAccount: () =>
    request<{ success: boolean; message: string }>('/user/account', {
      method: 'DELETE',
    }),

  // Commitments
  getCommitments: (params?: {
    status?: string;
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append('status', params.status);
    if (params?.category) query.append('category', params.category);
    if (params?.search) query.append('search', params.search);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    return request<{
      items: CommitmentDto[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/commitments?${query.toString()}`);
  },

  getCommitment: (id: string) => request<CommitmentDto>(`/commitments/${id}`),

  createCommitment: (body: CreateCommitmentInput) =>
    request<CommitmentDto>('/commitments', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateCommitment: (id: string, body: UpdateCommitmentInput) =>
    request<CommitmentDto>(`/commitments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  deleteCommitment: (id: string) =>
    request<{ success: boolean }>(`/commitments/${id}`, { method: 'DELETE' }),

  // Mandates
  getMandates: () => request<MandateDto[]>('/mandates'),

  createMandate: (body: CreateMandateInput) =>
    request<MandateDto>('/mandates', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  updateMandate: (id: string, body: UpdateMandateInput) =>
    request<MandateDto>(`/mandates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  deleteMandate: (id: string) =>
    request<{ success: boolean }>(`/mandates/${id}`, { method: 'DELETE' }),

  // Imports
  previewImport: (rawCsvText: string) =>
    request<CsvPreviewResult>('/imports/preview', {
      method: 'POST',
      body: JSON.stringify({ rawCsvText }),
    }),

  commitImport: (body: CommitImportInput) =>
    request<ImportCommitResult>('/imports/commit', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  getImports: () => request<TransactionImportDto[]>('/imports'),

  rollbackImport: (id: string) =>
    request<{ success: boolean; message: string }>(`/imports/${id}`, {
      method: 'DELETE',
    }),

  // Transactions
  getTransactions: (params?: {
    direction?: string;
    search?: string;
    startDate?: string;
    endDate?: string;
    importId?: string;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.direction) query.append('direction', params.direction);
    if (params?.search) query.append('search', params.search);
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.importId) query.append('importId', params.importId);
    if (params?.page) query.append('page', String(params.page));
    if (params?.limit) query.append('limit', String(params.limit));
    return request<{
      items: TransactionDto[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/transactions?${query.toString()}`);
  },

  toggleExcludeTransaction: (id: string) =>
    request<{ id: string; isExcludedFromDetection: boolean }>(
      `/transactions/${id}/exclude`,
      { method: 'PATCH' }
    ),

  // Recurrence Detection
  runDetection: () =>
    request<{
      scannedTransactions: number;
      candidatesFound: number;
      candidates: DetectionCandidateDto[];
    }>('/detection/run', { method: 'POST' }),

  getCandidates: () => request<DetectionCandidateDto[]>('/detection/candidates'),

  confirmCandidate: (id: string, body: ConfirmCandidateInput) =>
    request<CommitmentDto>(`/detection/candidates/${id}/confirm`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  dismissCandidate: (id: string) =>
    request<{ success: boolean }>(`/detection/candidates/${id}/dismiss`, {
      method: 'POST',
    }),

  // Radar & Forecasts
  getRadarForecast: (days?: number) =>
    request<RadarItemDto[]>(`/radar/forecast?days=${days || 30}`),

  // Insights
  getSummary: () => request<FinancialSummaryDto>('/insights/summary'),

  getCategories: () => request<CategoryBreakdownDto[]>('/insights/categories'),

  getReconciliation: () =>
    request<
      Array<{
        commitmentId: string;
        name: string;
        merchant: string;
        expectedAmountMinor: number;
        lastDebitedAmountMinor: number | null;
        differenceMinor: number;
        hasPriceDiscrepancy: boolean;
        lastDebitedDate: string | null;
      }>
    >('/insights/reconciliation'),

  // Notifications & Reminders
  getNotifications: () => request<NotificationDto[]>('/notifications'),

  markNotificationRead: (id: string) =>
    request<{ count: number }>(`/notifications/${id}/read`, { method: 'PATCH' }),

  markAllNotificationsRead: () =>
    request<{ count: number }>('/notifications/read-all', { method: 'POST' }),

  getReminders: () => request<ReminderDto[]>('/reminders'),

  createReminder: (body: CreateReminderInput) =>
    request<ReminderDto>('/reminders', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  deleteReminder: (id: string) =>
    request<{ success: boolean }>(`/reminders/${id}`, { method: 'DELETE' }),

  triggerProcessNotifications: () =>
    request<{ processedReminders: number; generatedNotifications: number }>(
      '/notifications/process',
      { method: 'POST' }
    ),
};

import { del, get, patch, post } from './http';
import type {
  AnalyticsOverview,
  AppNotification,
  AuthResult,
  BalancesResponse,
  Budget,
  BudgetPeriod,
  Cashflow,
  Category,
  Emi,
  EmiSummary,
  Expense,
  ExpenseSummary,
  Friend,
  FriendsResponse,
  Goal,
  Group,
  GroupExpense,
  GroupMember,
  Income,
  IncomeSummary,
  Investment,
  OtpRequestResult,
  Paginated,
  PaidByInput,
  PaymentMethod,
  PortfolioSummary,
  Settlement,
  SettlementIntent,
  SplitInput,
  SplitStrategy,
  Tokens,
  User,
} from './types';

// ── Auth ───────────────────────────────────────────────────────────────────
export const authApi = {
  requestOtp: (body: { dialCode?: string; phoneNumber: string }) =>
    post<OtpRequestResult>('/auth/otp/request', body),
  register: (body: {
    dialCode?: string;
    phoneNumber: string;
    firstName: string;
    lastName: string;
    email?: string;
    defaultCurrency?: string;
    otp: string;
  }) => post<AuthResult>('/auth/register', body),
  login: (body: { dialCode?: string; phoneNumber: string; otp: string }) =>
    post<AuthResult>('/auth/login', body),
  refresh: (refreshToken: string) => post<Tokens>('/auth/refresh', { refreshToken }),
  logout: () => post<{ revoked: boolean }>('/auth/logout'),
};

// ── Users ──────────────────────────────────────────────────────────────────
export const usersApi = {
  me: () => get<User>('/users/me'),
  updateMe: (body: Partial<Pick<User, 'firstName' | 'lastName' | 'email' | 'avatarUrl' | 'defaultCurrency' | 'upiId'>>) =>
    patch<User>('/users/me', body),
};

// ── Categories ─────────────────────────────────────────────────────────────
export const categoriesApi = {
  list: (type?: 'expense' | 'income', search?: string) =>
    get<Category[]>('/categories', { type, search }),
};

// ── Expenses ───────────────────────────────────────────────────────────────
export interface ExpenseFilters {
  page?: number;
  limit?: number;
  category?: string;
  paymentMethod?: PaymentMethod;
  source?: string;
  from?: string;
  to?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}
export interface CreateExpenseBody {
  amount: number;
  category: string;
  currency?: string;
  description?: string;
  merchant?: string;
  paymentMethod?: PaymentMethod;
  spentAt?: string;
  notes?: string;
  tags?: string[];
}
export const expensesApi = {
  list: (filters?: ExpenseFilters) => get<Paginated<Expense>>('/expenses', filters as Record<string, unknown>),
  summary: (range?: { from?: string; to?: string }) =>
    get<ExpenseSummary>('/expenses/summary', range),
  get: (id: string) => get<Expense>(`/expenses/${id}`),
  create: (body: CreateExpenseBody) => post<Expense>('/expenses', body),
  update: (id: string, body: Partial<CreateExpenseBody>) => patch<Expense>(`/expenses/${id}`, body),
  remove: (id: string) => del<{ deleted: boolean }>(`/expenses/${id}`),
};

// ── Income ─────────────────────────────────────────────────────────────────
export interface CreateIncomeBody {
  amount: number;
  category: string;
  source?: string;
  currency?: string;
  description?: string;
  receivedVia?: PaymentMethod;
  receivedAt?: string;
  notes?: string;
  tags?: string[];
  isRecurring?: boolean;
}
export const incomeApi = {
  list: (filters?: Record<string, unknown>) => get<Paginated<Income>>('/income', filters),
  summary: (range?: { from?: string; to?: string }) => get<IncomeSummary>('/income/summary', range),
  get: (id: string) => get<Income>(`/income/${id}`),
  create: (body: CreateIncomeBody) => post<Income>('/income', body),
  update: (id: string, body: Partial<CreateIncomeBody>) => patch<Income>(`/income/${id}`, body),
  remove: (id: string) => del<{ deleted: boolean }>(`/income/${id}`),
};

// ── Groups ─────────────────────────────────────────────────────────────────
export interface MemberInput {
  userId?: string;
  phoneNumber?: string;
  dialCode?: string;
  displayName?: string;
  role?: 'admin' | 'member';
}
export const groupsApi = {
  list: (page = 1, limit = 50) => get<Paginated<Group>>('/groups', { page, limit }),
  get: (id: string) => get<Group>(`/groups/${id}`),
  create: (body: { name: string; description?: string; currency?: string; members?: MemberInput[] }) =>
    post<Group>('/groups', body),
  update: (id: string, body: { name?: string; description?: string }) => patch<Group>(`/groups/${id}`, body),
  remove: (id: string) => del<{ deleted: boolean }>(`/groups/${id}`),
  addMember: (id: string, body: MemberInput) => post<GroupMember>(`/groups/${id}/members`, body),
  updateMember: (id: string, memberId: string, role: 'admin' | 'member') =>
    patch<GroupMember>(`/groups/${id}/members/${memberId}`, { role }),
  removeMember: (id: string, memberId: string) => del<{ removed: boolean }>(`/groups/${id}/members/${memberId}`),
};

// ── Splits (group expenses + balances + settlements) ───────────────────────
export interface CreateSplitBody {
  description: string;
  amount: number;
  currency?: string;
  category?: string;
  spentAt?: string;
  notes?: string;
  paidBy: PaidByInput[];
  splitStrategy: SplitStrategy;
  splits: SplitInput[];
}
export const splitsApi = {
  listExpenses: (groupId: string, page = 1, limit = 30) =>
    get<Paginated<GroupExpense>>(`/groups/${groupId}/expenses`, { page, limit }),
  getExpense: (groupId: string, expenseId: string) =>
    get<GroupExpense>(`/groups/${groupId}/expenses/${expenseId}`),
  createExpense: (groupId: string, body: CreateSplitBody) =>
    post<GroupExpense>(`/groups/${groupId}/expenses`, body),
  deleteExpense: (groupId: string, expenseId: string) =>
    del<{ deleted: boolean }>(`/groups/${groupId}/expenses/${expenseId}`),
  balances: (groupId: string) => get<BalancesResponse>(`/groups/${groupId}/balances`),
  settlementIntent: (groupId: string, body: { toMemberId: string; amount: number; note?: string }) =>
    post<SettlementIntent>(`/groups/${groupId}/settlements/intent`, body),
  recordSettlement: (
    groupId: string,
    body: { fromMemberId?: string; toMemberId: string; amount: number; method?: PaymentMethod; note?: string },
  ) => post<Settlement>(`/groups/${groupId}/settlements`, body),
  listSettlements: (groupId: string, page = 1, limit = 20) =>
    get<Paginated<Settlement>>(`/groups/${groupId}/settlements`, { page, limit }),
};

// ── Friends (1-on-1 splits) ────────────────────────────────────────────────
export const friendsApi = {
  list: () => get<FriendsResponse>('/friends'),
  get: (friendshipId: string) => get<Friend>(`/friends/${friendshipId}`),
  add: (body: MemberInput) => post<Friend>('/friends', body),
  listExpenses: (friendshipId: string, page = 1, limit = 30) =>
    get<Paginated<GroupExpense>>(`/friends/${friendshipId}/expenses`, { page, limit }),
  createExpense: (friendshipId: string, body: CreateSplitBody) =>
    post<GroupExpense>(`/friends/${friendshipId}/expenses`, body),
  settlementIntent: (friendshipId: string, body: { toMemberId: string; amount: number; note?: string }) =>
    post<SettlementIntent>(`/friends/${friendshipId}/settlements/intent`, body),
  recordSettlement: (
    friendshipId: string,
    body: { fromMemberId?: string; toMemberId: string; amount: number; method?: PaymentMethod; note?: string },
  ) => post<Settlement>(`/friends/${friendshipId}/settlements`, body),
};

// ── Budgets ────────────────────────────────────────────────────────────────
export interface CreateBudgetBody {
  name?: string;
  category?: string;
  amount: number;
  currency?: string;
  period: BudgetPeriod;
  startDate?: string;
  endDate?: string;
  alertThresholdPct?: number;
  isActive?: boolean;
}
export const budgetsApi = {
  list: (page = 1, limit = 50) => get<Paginated<Budget>>('/budgets', { page, limit }),
  get: (id: string) => get<Budget>(`/budgets/${id}`),
  create: (body: CreateBudgetBody) => post<Budget>('/budgets', body),
  update: (id: string, body: Partial<CreateBudgetBody>) => patch<Budget>(`/budgets/${id}`, body),
  remove: (id: string) => del<{ deleted: boolean }>(`/budgets/${id}`),
};

// ── EMIs ───────────────────────────────────────────────────────────────────
export interface CreateEmiBody {
  name: string;
  type: string;
  amount: number;
  frequency: string;
  startDate: string;
  currency?: string;
  category?: string;
  paymentMethod?: PaymentMethod;
  interestRatePct?: number;
  principal?: number;
  tenureCount?: number;
  autoDebit?: boolean;
  notes?: string;
}
export const emisApi = {
  list: (page = 1, limit = 50) => get<Paginated<Emi>>('/emis', { page, limit }),
  summary: () => get<EmiSummary>('/emis/summary'),
  get: (id: string) => get<Emi>(`/emis/${id}`),
  create: (body: CreateEmiBody) => post<Emi>('/emis', body),
  update: (id: string, body: Partial<CreateEmiBody>) => patch<Emi>(`/emis/${id}`, body),
  remove: (id: string) => del<{ deleted: boolean }>(`/emis/${id}`),
};

// ── Goals ──────────────────────────────────────────────────────────────────
export interface CreateGoalBody {
  name: string;
  targetAmount: number;
  currentAmount?: number;
  currency?: string;
  targetDate?: string;
  icon?: string;
  color?: string;
  notes?: string;
}
export const goalsApi = {
  list: (page = 1, limit = 50) => get<Paginated<Goal>>('/goals', { page, limit }),
  get: (id: string) => get<Goal>(`/goals/${id}`),
  create: (body: CreateGoalBody) => post<Goal>('/goals', body),
  contribute: (id: string, body: { amount: number; note?: string; contributedAt?: string }) =>
    post<Goal>(`/goals/${id}/contribute`, body),
  update: (id: string, body: Partial<CreateGoalBody>) => patch<Goal>(`/goals/${id}`, body),
  remove: (id: string) => del<{ deleted: boolean }>(`/goals/${id}`),
};

// ── Investments ────────────────────────────────────────────────────────────
export interface CreateInvestmentBody {
  name: string;
  type: string;
  investedAmount: number;
  currentValue?: number;
  currency?: string;
  quantity?: number;
  platform?: string;
  notes?: string;
}
export const investmentsApi = {
  list: (page = 1, limit = 50) => get<Paginated<Investment>>('/investments', { page, limit }),
  summary: () => get<PortfolioSummary>('/investments/summary'),
  get: (id: string) => get<Investment>(`/investments/${id}`),
  create: (body: CreateInvestmentBody) => post<Investment>('/investments', body),
  update: (id: string, body: Partial<CreateInvestmentBody>) => patch<Investment>(`/investments/${id}`, body),
  remove: (id: string) => del<{ deleted: boolean }>(`/investments/${id}`),
};

// ── Analytics ──────────────────────────────────────────────────────────────
export const analyticsApi = {
  overview: () => get<AnalyticsOverview>('/analytics/overview'),
  cashflow: (months = 6) => get<Cashflow>('/analytics/cashflow', { months }),
};

// ── Notifications (activity inbox) ──────────────────────────────────────────
export const notificationsApi = {
  list: (page = 1, limit = 20, unreadOnly?: boolean) =>
    get<Paginated<AppNotification>>('/notifications', { page, limit, unreadOnly }),
  unreadCount: () => get<{ count: number }>('/notifications/unread-count'),
  markRead: (id: string) => patch<AppNotification>(`/notifications/${id}/read`, {}),
  markAllRead: () => post<{ updated: number }>('/notifications/read-all'),
  dispute: (id: string) => post<AppNotification>(`/notifications/${id}/dispute`),
};

/** Domain types mirroring the Spendes backend contract (see FRONTEND_PLAN.md). */

// ── Enums ──────────────────────────────────────────────────────────────────
export type PaymentMethod = 'cash' | 'card' | 'upi' | 'bank_transfer' | 'wallet' | 'other';
export type SplitStrategy = 'equal' | 'exact' | 'percentage' | 'shares';
export type GroupRole = 'admin' | 'member';
export type GroupMemberStatus = 'active' | 'invited' | 'removed';
export type GroupKind = 'standard' | 'direct';
export type ExpenseSource = 'personal' | 'group_share';
export type BudgetPeriod = 'weekly' | 'monthly' | 'yearly' | 'custom';
export type BudgetStatus = 'ok' | 'warning' | 'exceeded';
export type EmiType = 'loan' | 'subscription' | 'rent' | 'insurance' | 'other';
export type EmiFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly';
export type InvestmentType =
  | 'mutual_fund'
  | 'stock'
  | 'fd'
  | 'gold'
  | 'crypto'
  | 'bond'
  | 'real_estate'
  | 'other';
export type CategoryType = 'expense' | 'income';
export type PlanType = 'free' | 'pro';

// ── Pagination ─────────────────────────────────────────────────────────────
export interface PageMeta {
  page: number;
  limit: number;
  totalItems: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
}
export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}

// ── Auth / Users ───────────────────────────────────────────────────────────
export interface Tokens {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
}
/** Per-category push opt-outs. Gates device push only; the in-app inbox always records activity. */
export interface NotificationPreferences {
  reminders: boolean;
  splits: boolean;
  budgets: boolean;
  summary: boolean;
}
export interface User {
  id: string;
  dialCode: string;
  phoneNumber: string;
  phoneE164: string;
  email?: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatarUrl?: string;
  roles: string[];
  plan: PlanType;
  upiId?: string;
  notificationPreferences: NotificationPreferences;
  defaultCurrency: string;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}
export interface AuthResult {
  user: User;
  tokens: Tokens;
}
export interface OtpRequestResult {
  isRegistered: boolean;
  expiresInSeconds: number;
  mocked: boolean;
}

// ── Categories ─────────────────────────────────────────────────────────────
export interface Category {
  id: string;
  name: string;
  slug: string;
  type: CategoryType;
  icon: string;
  color: string;
  iconUrl?: string;
  description?: string;
  isSystem: boolean;
  isActive: boolean;
  sortOrder: number;
}

// ── Expenses / Income ──────────────────────────────────────────────────────
export interface Expense {
  id: string;
  amount: number;
  category: string;
  currency: string;
  description?: string;
  merchant?: string;
  paymentMethod: PaymentMethod;
  spentAt: string;
  notes?: string;
  tags?: string[];
  source: ExpenseSource;
  groupId?: string;
  groupExpenseId?: string;
  createdAt: string;
  updatedAt: string;
}
export interface CategoryBreakdown {
  category: string;
  totalAmount: number;
  count?: number;
}
export interface ExpenseSummary {
  totalAmount: number;
  /** Actual cash paid out of pocket (personal + your payer share of splits). */
  cashOutflow?: number;
  count: number;
  byCategory: CategoryBreakdown[];
  byPaymentMethod: { paymentMethod: string; totalAmount: number; count?: number }[];
}
export interface Income {
  id: string;
  amount: number;
  category: string;
  source?: string;
  currency: string;
  description?: string;
  receivedVia: PaymentMethod;
  receivedAt: string;
  notes?: string;
  tags?: string[];
  isRecurring?: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface IncomeSummary {
  totalAmount: number;
  count: number;
  byCategory: CategoryBreakdown[];
  bySource: { source: string; totalAmount: number; count?: number }[];
}

// ── Groups / Splits ────────────────────────────────────────────────────────
export interface GroupMember {
  id: string;
  userId?: string;
  displayName: string;
  role: GroupRole;
  status: GroupMemberStatus;
  dialCode?: string;
  phoneNumber?: string;
  isYou: boolean;
  isRegistered: boolean;
  joinedAt?: string;
}
export interface Group {
  id: string;
  name: string;
  description?: string;
  avatarUrl?: string;
  currency: string;
  kind: GroupKind;
  createdBy: string;
  members: GroupMember[];
  memberCount: number;
  myRole?: GroupRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface SplitInput {
  memberId: string;
  exactAmount?: number;
  percentage?: number;
  shares?: number;
}
export interface PaidByInput {
  memberId: string;
  amount: number;
}
export interface GroupExpenseSplit {
  memberId: string;
  displayName?: string;
  amount: number;
}
export interface GroupExpense {
  id: string;
  description: string;
  amount: number;
  currency: string;
  category?: string;
  spentAt: string;
  notes?: string;
  splitStrategy: SplitStrategy;
  paidBy: { memberId: string; displayName?: string; amount: number }[];
  splits: GroupExpenseSplit[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
export interface MemberBalance {
  memberId: string;
  displayName: string;
  net: number;
}
export interface SuggestedTransfer {
  fromMemberId: string;
  fromName: string;
  toMemberId: string;
  toName: string;
  amount: number;
}
export interface BalancesResponse {
  groupId: string;
  currency: string;
  balances: MemberBalance[];
  suggestedTransfers: SuggestedTransfer[];
  myMemberId?: string;
  myNet?: number;
}
export interface Settlement {
  id: string;
  fromMemberId: string;
  toMemberId: string;
  amount: number;
  currency: string;
  method: PaymentMethod;
  note?: string;
  settledAt: string;
}
export interface SettlementIntent {
  provider: string;
  uri: string;
  payeeName: string;
  payeeVpa: string;
  amount: number;
  currency: string;
  note?: string;
  /** Transaction reference to pass back when recording the settlement (idempotency). */
  reference: string;
}

// ── Friends ────────────────────────────────────────────────────────────────
export interface Friend {
  friendshipId: string;
  myMemberId: string;
  friendMemberId: string;
  displayName: string;
  userId?: string;
  avatarUrl?: string;
  isRegistered: boolean;
  dialCode?: string;
  phoneNumber?: string;
  currency: string;
  net: number;
  /** Your answer to "they added you" — `pending` means it's still unanswered. */
  consent: MemberConsent;
  /** Their side of the same question. */
  theirConsent: MemberConsent;
  addedByMe: boolean;
  /** They added you and you haven't answered yet. */
  needsMyReview: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface FriendsResponse {
  friends: Friend[];
  totalYouAreOwed: number;
  totalYouOwe: number;
  net: number;
}

// ── Budgets ────────────────────────────────────────────────────────────────
export interface Budget {
  id: string;
  name?: string;
  category?: string;
  amount: number;
  currency: string;
  period: BudgetPeriod;
  startDate?: string;
  endDate?: string;
  alertThresholdPct?: number;
  isActive: boolean;
  periodStart: string;
  periodEnd: string;
  spent: number;
  remaining: number;
  percentUsed: number;
  status: BudgetStatus;
}

// ── EMIs ───────────────────────────────────────────────────────────────────
export interface Emi {
  id: string;
  name: string;
  type: EmiType;
  amount: number;
  frequency: EmiFrequency;
  startDate: string;
  currency: string;
  category?: string;
  paymentMethod?: PaymentMethod;
  interestRatePct?: number;
  principal?: number;
  tenureCount?: number;
  autoDebit?: boolean;
  isActive: boolean;
  notes?: string;
  nextDueDate?: string;
  installmentsPaid: number;
  installmentsRemaining?: number;
  remainingAmount?: number;
  endDate?: string;
  isCompleted: boolean;
  monthlyEquivalent: number;
  dueThisMonth: boolean;
}
export interface EmiSummary {
  activeCount: number;
  totalMonthlyCommitment: number;
  totalOutstanding: number;
  dueThisMonth: { count: number; total: number };
  byType: { type: EmiType; total: number; count: number }[];
}

// ── Goals ──────────────────────────────────────────────────────────────────
export interface GoalContribution {
  id: string;
  amount: number;
  note?: string;
  contributedAt: string;
}
export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  targetDate?: string;
  icon?: string;
  color?: string;
  notes?: string;
  progressPct: number;
  remainingAmount: number;
  isAchieved: boolean;
  daysRemaining?: number;
  monthsRemaining?: number;
  requiredMonthlySaving?: number;
  contributions: GoalContribution[];
  isActive: boolean;
}

// ── Investments ────────────────────────────────────────────────────────────
export type SipFrequency = 'weekly' | 'monthly' | 'quarterly' | 'yearly';

/** Live, derived view of a holding's recurring contribution plan (SIP). */
export interface InvestmentSip {
  amount: number;
  frequency: SipFrequency;
  startDate: string;
  isActive: boolean;
  /** Per-installment amount normalized to a monthly figure. */
  monthlyEquivalent: number;
  /** Next scheduled debit date (omitted when paused). */
  nextContributionDate?: string;
  /** How many installments should have been made by now. */
  expectedInstallments: number;
  /** How many contributions have actually been recorded. */
  recordedInstallments: number;
  /** `max(0, expected − recorded)` — installments you may be behind on. */
  installmentsBehind: number;
}
export interface Investment {
  id: string;
  name: string;
  type: InvestmentType;
  investedAmount: number;
  currentValue: number;
  currency: string;
  quantity?: number;
  platform?: string;
  notes?: string;
  sip?: InvestmentSip;
  isActive: boolean;
  gainLoss: number;
  gainLossPct: number;
}
export interface PortfolioSummary {
  holdingsCount: number;
  totalInvested: number;
  totalCurrentValue: number;
  totalGainLoss: number;
  gainLossPct: number;
  /** Combined monthly-equivalent of every active SIP — a recurring savings outflow. */
  totalMonthlySip: number;
  allocation: { type: InvestmentType; currentValue: number; investedAmount: number; percent: number }[];
}

// ── Analytics ──────────────────────────────────────────────────────────────
export interface AnalyticsOverview {
  period: { from: string; to: string };
  income: number;
  expense: number;
  /** Actual cash that left your pocket this period (personal + your payer share of splits). */
  cashOutflow: number;
  net: number;
  savingsRate: number;
  topCategories: { category: string; totalAmount: number }[];
  commitments: { totalMonthlyCommitment: number; dueThisMonthCount: number; dueThisMonthTotal: number };
  portfolio: { totalInvested: number; totalCurrentValue: number; totalGainLoss: number; gainLossPct: number };
  netWorth: { assets: number; liabilities: number; net: number };
}
export interface CashflowPoint {
  year: number;
  month: number;
  label: string;
  income: number;
  expense: number;
  net: number;
}
export interface Cashflow {
  months: number;
  from: string;
  to: string;
  series: CashflowPoint[];
  totalIncome: number;
  totalExpense: number;
  net: number;
}

// ── Notifications ──────────────────────────────────────────────────────────
export type NotificationType =
  | 'friend_added'
  | 'split_added'
  | 'settlement_recorded'
  | 'split_disputed'
  | 'membership_inherited'
  | 'connection_confirmed'
  | 'connection_declined';

/** Why someone flagged a split/connection. `dont_know_them` also declines the connection. */
export type DisputeReason =
  | 'not_mine'
  | 'wrong_amount'
  | 'already_paid'
  | 'dont_know_them'
  | 'other';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  actorName?: string;
  groupId?: string;
  groupExpenseId?: string;
  settlementId?: string;
  /** When true, the linked group is a 1-on-1 friendship (link to /friends). */
  isDirect?: boolean;
  amount?: number;
  currency?: string;
  isRead: boolean;
  isConfirmed: boolean;
  isDisputed: boolean;
  disputeReason?: DisputeReason;
  disputeNote?: string;
  /** This item still asks something of you — drives the "Review" cue in the inbox. */
  needsReview: boolean;
  /** Whether you can still answer "looks right". */
  canConfirm: boolean;
  /** Whether you can still flag this as wrong. */
  canDispute: boolean;
  createdAt: string;
}

/** Your own answer to "someone added you here" — never a gate, just a state. */
export type MemberConsent = 'confirmed' | 'pending' | 'declined';

/** Everything the review screen shows about one notification (`GET /notifications/:id`). */
export interface NotificationDetail extends AppNotification {
  actor?: {
    userId?: string;
    name: string;
    avatarUrl?: string;
    dialCode?: string;
    phoneNumber?: string;
    isRegistered: boolean;
  };
  connection?: {
    id: string;
    isDirect: boolean;
    name: string;
    consent: MemberConsent;
    /** True when someone else created this connection — i.e. it arrived unasked-for. */
    addedByThem: boolean;
    memberCount: number;
    myMemberId?: string;
    otherMemberId?: string;
    createdAt: string;
  };
  expense?: {
    id: string;
    description: string;
    /** The whole bill. */
    amount: number;
    currency: string;
    /** Your slice of it — the number you're actually being asked about. */
    myShare: number;
    paidByName: string;
    splitStrategy: SplitStrategy;
    splitCount: number;
    category?: string;
    notes?: string;
    spentAt: string;
  };
  balance?: {
    /** Positive = you're owed; negative = you owe. */
    myNet: number;
    currency: string;
  };
  /** Decided server-side, so a button is never offered when it would fail. */
  actions: {
    canConfirm: boolean;
    canDispute: boolean;
    canPay: boolean;
    canMarkPaid: boolean;
    payAmount: number;
    payeeMemberId?: string;
    payerMemberId?: string;
    payBlockedReason?: string;
  };
}

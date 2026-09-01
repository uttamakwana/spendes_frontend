/** Query-key factory — one entry per resource so invalidation stays precise. */
export const qk = {
  me: ['me'] as const,
  categories: (type?: string) => ['categories', type ?? 'all'] as const,

  expenses: (filters?: object) => ['expenses', filters ?? {}] as const,
  expensesAll: ['expenses'] as const,
  expenseSummary: (range?: object) => ['expenses', 'summary', range ?? {}] as const,
  expense: (id: string) => ['expenses', id] as const,

  income: (filters?: object) => ['income', filters ?? {}] as const,
  incomeAll: ['income'] as const,
  incomeSummary: (range?: object) => ['income', 'summary', range ?? {}] as const,

  groups: ['groups'] as const,
  group: (id: string) => ['groups', id] as const,
  groupExpenses: (id: string) => ['groups', id, 'expenses'] as const,
  groupBalances: (id: string) => ['groups', id, 'balances'] as const,
  groupSettlements: (id: string) => ['groups', id, 'settlements'] as const,

  friends: ['friends'] as const,
  balances: ['balances'] as const,
  friend: (id: string) => ['friends', id] as const,
  friendExpenses: (id: string) => ['friends', id, 'expenses'] as const,

  budgets: ['budgets'] as const,
  budget: (id: string) => ['budgets', id] as const,

  emis: ['emis'] as const,
  emiSummary: ['emis', 'summary'] as const,
  emi: (id: string) => ['emis', id] as const,

  goals: ['goals'] as const,
  goal: (id: string) => ['goals', id] as const,

  investments: ['investments'] as const,
  portfolio: ['investments', 'summary'] as const,
  investment: (id: string) => ['investments', id] as const,

  analyticsOverview: ['analytics', 'overview'] as const,
  cashflow: (months: number) => ['analytics', 'cashflow', months] as const,

  notifications: (filters?: object) => ['notifications', filters ?? {}] as const,
  notification: (id: string) => ['notifications', 'detail', id] as const,
  notificationsAll: ['notifications'] as const,
  notificationsUnread: ['notifications', 'unread-count'] as const,
};

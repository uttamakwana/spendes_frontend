import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';

import {
  analyticsApi,
  budgetsApi,
  categoriesApi,
  CreateBudgetBody,
  CreateEmiBody,
  CreateExpenseBody,
  CreateGoalBody,
  CreateIncomeBody,
  CreateInvestmentBody,
  CreateSplitBody,
  emisApi,
  expensesApi,
  ExpenseFilters,
  friendsApi,
  goalsApi,
  groupsApi,
  incomeApi,
  investmentsApi,
  MemberInput,
  notificationsApi,
  qk,
  splitsApi,
} from '@/api';
import {
  invalidateAfterFriendMutation,
  invalidateAfterGroupMutation,
  invalidateAfterTransaction,
} from '@/data/invalidate';
import { useWriteMutation } from './useWriteMutation';

// ── Reference / dashboard ───────────────────────────────────────────────────
export const useCategories = (type?: 'expense' | 'income') =>
  useQuery({ queryKey: qk.categories(type), queryFn: () => categoriesApi.list(type), staleTime: 10 * 60_000 });

export const useOverview = () =>
  useQuery({ queryKey: qk.analyticsOverview, queryFn: analyticsApi.overview });

// ── Notifications (activity inbox) ───────────────────────────────────────────
export const useNotifications = (unreadOnly?: boolean) =>
  useInfiniteQuery({
    queryKey: qk.notifications({ unreadOnly: unreadOnly ?? false }),
    queryFn: ({ pageParam = 1 }) => notificationsApi.list(pageParam, 20, unreadOnly),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.hasNextPage ? last.meta.page + 1 : undefined),
  });

/** Unread badge count. Polls periodically so the bell reflects items others send you. */
export const useUnreadCount = () =>
  useQuery({
    queryKey: qk.notificationsUnread,
    queryFn: notificationsApi.unreadCount,
    refetchInterval: 45_000,
    refetchOnWindowFocus: true,
  });

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.notificationsAll });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.notificationsAll });
    },
  });
}

export function useDisputeNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.dispute(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.notificationsAll });
    },
  });
}

export const useCashflow = (months = 6) =>
  useQuery({ queryKey: qk.cashflow(months), queryFn: () => analyticsApi.cashflow(months) });

// ── Expenses ────────────────────────────────────────────────────────────────
export const useExpenses = (filters?: ExpenseFilters) =>
  useInfiniteQuery({
    queryKey: qk.expenses(filters),
    queryFn: ({ pageParam = 1 }) => expensesApi.list({ ...filters, page: pageParam, limit: filters?.limit ?? 20 }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.hasNextPage ? last.meta.page + 1 : undefined),
  });

export const useRecentExpenses = (limit = 5) =>
  useQuery({
    queryKey: qk.expenses({ recent: limit }),
    queryFn: () => expensesApi.list({ limit, sortBy: 'spentAt', sortOrder: 'desc' }),
  });

export const useExpense = (id: string) =>
  useQuery({ queryKey: qk.expense(id), queryFn: () => expensesApi.get(id), enabled: !!id });

export const useExpenseSummary = (range?: { from?: string; to?: string }) =>
  useQuery({ queryKey: qk.expenseSummary(range), queryFn: () => expensesApi.summary(range) });

export function useCreateExpense() {
  return useWriteMutation({
    mutationFn: (body: CreateExpenseBody) => expensesApi.create(body),
    onSuccess: invalidateAfterTransaction,
  });
}

export function useDeleteExpense() {
  return useWriteMutation({
    mutationFn: (id: string) => expensesApi.remove(id),
    onSuccess: invalidateAfterTransaction,
  });
}

export function useCreateIncome() {
  return useWriteMutation({
    mutationFn: (body: CreateIncomeBody) => incomeApi.create(body),
    onSuccess: invalidateAfterTransaction,
  });
}

export function useUpdateExpense(id: string) {
  const qc = useQueryClient();
  return useWriteMutation({
    mutationFn: (body: Partial<CreateExpenseBody>) => expensesApi.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.expense(id) });
      invalidateAfterTransaction();
    },
  });
}

export const useIncomeList = (filters?: Record<string, unknown>) =>
  useInfiniteQuery({
    queryKey: qk.income(filters),
    queryFn: ({ pageParam = 1 }) => incomeApi.list({ ...filters, page: pageParam, limit: 20 }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.hasNextPage ? last.meta.page + 1 : undefined),
  });

export const useIncome = (id: string) =>
  useQuery({ queryKey: ['income', id], queryFn: () => incomeApi.get(id), enabled: !!id });

export function useUpdateIncome(id: string) {
  const qc = useQueryClient();
  return useWriteMutation({
    mutationFn: (body: Partial<CreateIncomeBody>) => incomeApi.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['income', id] });
      invalidateAfterTransaction();
    },
  });
}

export function useDeleteIncome() {
  return useWriteMutation({
    mutationFn: (id: string) => incomeApi.remove(id),
    onSuccess: invalidateAfterTransaction,
  });
}

// ── Plan modules ────────────────────────────────────────────────────────────
export const useBudgets = () => useQuery({ queryKey: qk.budgets, queryFn: () => budgetsApi.list() });
export const useBudget = (id: string) =>
  useQuery({ queryKey: qk.budget(id), queryFn: () => budgetsApi.get(id), enabled: !!id });

export const useEmis = () => useQuery({ queryKey: qk.emis, queryFn: () => emisApi.list() });
export const useEmiSummary = () => useQuery({ queryKey: qk.emiSummary, queryFn: () => emisApi.summary() });
export const useEmi = (id: string) =>
  useQuery({ queryKey: qk.emi(id), queryFn: () => emisApi.get(id), enabled: !!id });

export const useGoals = () => useQuery({ queryKey: qk.goals, queryFn: () => goalsApi.list() });
export const useGoal = (id: string) =>
  useQuery({ queryKey: qk.goal(id), queryFn: () => goalsApi.get(id), enabled: !!id });

export function useContributeGoal(id: string) {
  const qc = useQueryClient();
  return useWriteMutation({
    mutationFn: (body: { amount: number; note?: string }) => goalsApi.contribute(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.goals });
      qc.invalidateQueries({ queryKey: qk.goal(id) });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

export const useInvestments = () => useQuery({ queryKey: qk.investments, queryFn: () => investmentsApi.list() });
export const usePortfolio = () => useQuery({ queryKey: qk.portfolio, queryFn: () => investmentsApi.summary() });
export const useInvestment = (id: string) =>
  useQuery({ queryKey: qk.investment(id), queryFn: () => investmentsApi.get(id), enabled: !!id });

// ── Social ──────────────────────────────────────────────────────────────────
export const useGroups = () => useQuery({ queryKey: qk.groups, queryFn: () => groupsApi.list() });
export const useGroup = (id: string) =>
  useQuery({ queryKey: qk.group(id), queryFn: () => groupsApi.get(id), enabled: !!id });
export const useFriends = () => useQuery({ queryKey: qk.friends, queryFn: () => friendsApi.list() });
export const useFriend = (id: string) =>
  useQuery({ queryKey: qk.friend(id), queryFn: () => friendsApi.get(id), enabled: !!id });

export const useGroupBalances = (id: string) =>
  useQuery({ queryKey: qk.groupBalances(id), queryFn: () => splitsApi.balances(id), enabled: !!id });
export const useGroupExpenses = (id: string) =>
  useQuery({ queryKey: qk.groupExpenses(id), queryFn: () => splitsApi.listExpenses(id), enabled: !!id });
export const useFriendExpenses = (id: string) =>
  useQuery({ queryKey: qk.friendExpenses(id), queryFn: () => friendsApi.listExpenses(id), enabled: !!id });

// ── Plan create/update mutations ────────────────────────────────────────────
export function useCreateBudget() {
  const qc = useQueryClient();
  return useWriteMutation({
    mutationFn: (b: CreateBudgetBody) => budgetsApi.create(b),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.budgets }),
  });
}
export function useUpdateBudget(id: string) {
  const qc = useQueryClient();
  return useWriteMutation({
    mutationFn: (b: Partial<CreateBudgetBody>) => budgetsApi.update(id, b),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.budgets });
      qc.invalidateQueries({ queryKey: qk.budget(id) });
    },
  });
}
export function useDeleteBudget() {
  const qc = useQueryClient();
  return useWriteMutation({
    mutationFn: (id: string) => budgetsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.budgets }),
  });
}
export function useCreateEmi() {
  const qc = useQueryClient();
  return useWriteMutation({
    mutationFn: (b: CreateEmiBody) => emisApi.create(b),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.emis });
      qc.invalidateQueries({ queryKey: qk.emiSummary });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
export function useUpdateEmi(id: string) {
  const qc = useQueryClient();
  return useWriteMutation({
    mutationFn: (b: Partial<CreateEmiBody>) => emisApi.update(id, b),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.emis });
      qc.invalidateQueries({ queryKey: qk.emiSummary });
      qc.invalidateQueries({ queryKey: qk.emi(id) });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
export function useDeleteEmi() {
  const qc = useQueryClient();
  return useWriteMutation({
    mutationFn: (id: string) => emisApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.emis });
      qc.invalidateQueries({ queryKey: qk.emiSummary });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
export function useCreateGoal() {
  const qc = useQueryClient();
  return useWriteMutation({
    mutationFn: (b: CreateGoalBody) => goalsApi.create(b),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.goals }),
  });
}
export function useCreateInvestment() {
  const qc = useQueryClient();
  return useWriteMutation({
    mutationFn: (b: CreateInvestmentBody) => investmentsApi.create(b),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.investments });
      qc.invalidateQueries({ queryKey: qk.portfolio });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
export function useUpdateInvestmentValue(id: string) {
  const qc = useQueryClient();
  return useWriteMutation({
    mutationFn: (currentValue: number) => investmentsApi.update(id, { currentValue }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.investments });
      qc.invalidateQueries({ queryKey: qk.portfolio });
      qc.invalidateQueries({ queryKey: qk.investment(id) });
    },
  });
}
export function useUpdateInvestment(id: string) {
  const qc = useQueryClient();
  return useWriteMutation({
    mutationFn: (b: Partial<CreateInvestmentBody>) => investmentsApi.update(id, b),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.investments });
      qc.invalidateQueries({ queryKey: qk.portfolio });
      qc.invalidateQueries({ queryKey: qk.investment(id) });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
export function useContributeInvestment(id: string) {
  const qc = useQueryClient();
  return useWriteMutation({
    mutationFn: (body: { amount: number; note?: string; currentValue?: number }) =>
      investmentsApi.contribute(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.investments });
      qc.invalidateQueries({ queryKey: qk.portfolio });
      qc.invalidateQueries({ queryKey: qk.investment(id) });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}
export function useDeleteInvestment() {
  const qc = useQueryClient();
  return useWriteMutation({
    mutationFn: (id: string) => investmentsApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.investments });
      qc.invalidateQueries({ queryKey: qk.portfolio });
      qc.invalidateQueries({ queryKey: ['analytics'] });
    },
  });
}

// ── Social mutations ────────────────────────────────────────────────────────
export function useCreateGroup() {
  const qc = useQueryClient();
  return useWriteMutation({
    mutationFn: (b: { name: string; description?: string; members?: MemberInput[] }) => groupsApi.create(b),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.groups }),
  });
}
export function useAddFriend() {
  const qc = useQueryClient();
  return useWriteMutation({
    mutationFn: (b: MemberInput) => friendsApi.add(b),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.friends }),
  });
}
export function useCreateGroupSplit(groupId: string) {
  return useWriteMutation({
    mutationFn: (b: CreateSplitBody) => splitsApi.createExpense(groupId, b),
    onSuccess: () => invalidateAfterGroupMutation(groupId),
  });
}
export function useCreateFriendSplit(friendshipId: string) {
  return useWriteMutation({
    mutationFn: (b: CreateSplitBody) => friendsApi.createExpense(friendshipId, b),
    onSuccess: () => invalidateAfterFriendMutation(friendshipId),
  });
}
type RecordSettlementBody = {
  fromMemberId?: string;
  toMemberId: string;
  amount: number;
  method?: 'upi' | 'cash';
  note?: string;
  /** UPI transaction reference from the intent — makes recording idempotent. */
  reference?: string;
};
export function useRecordGroupSettlement(groupId: string) {
  return useWriteMutation({
    mutationFn: (b: RecordSettlementBody) => splitsApi.recordSettlement(groupId, b),
    onSuccess: () => invalidateAfterGroupMutation(groupId),
  });
}
export function useRecordFriendSettlement(friendshipId: string) {
  return useWriteMutation({
    mutationFn: (b: RecordSettlementBody) => friendsApi.recordSettlement(friendshipId, b),
    onSuccess: () => invalidateAfterFriendMutation(friendshipId),
  });
}

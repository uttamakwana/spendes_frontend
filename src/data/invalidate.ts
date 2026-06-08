import { qk } from '@/api';
import { queryClient } from './queryClient';

/**
 * THE most important frontend rule (FRONTEND_PLAN §5): a split materializes the
 * payer's/members' share into their personal expenses. So a group/friend expense
 * or settlement mutation must invalidate personal-finance queries too — not just
 * the group's — because share rows appear/disappear in expenses, budgets, and
 * analytics.
 */
export function invalidatePersonalFinance() {
  queryClient.invalidateQueries({ queryKey: qk.expensesAll });
  queryClient.invalidateQueries({ queryKey: ['expenses', 'summary'] });
  queryClient.invalidateQueries({ queryKey: qk.budgets });
  queryClient.invalidateQueries({ queryKey: ['analytics'] });
}

/** After a group expense / settlement mutation. */
export function invalidateAfterGroupMutation(groupId: string) {
  queryClient.invalidateQueries({ queryKey: qk.groupExpenses(groupId) });
  queryClient.invalidateQueries({ queryKey: qk.groupBalances(groupId) });
  queryClient.invalidateQueries({ queryKey: qk.group(groupId) });
  queryClient.invalidateQueries({ queryKey: qk.groups });
  queryClient.invalidateQueries({ queryKey: qk.friends });
  invalidatePersonalFinance();
}

/** After a friend expense / settlement mutation. */
export function invalidateAfterFriendMutation(friendshipId: string) {
  queryClient.invalidateQueries({ queryKey: qk.friendExpenses(friendshipId) });
  queryClient.invalidateQueries({ queryKey: qk.friend(friendshipId) });
  queryClient.invalidateQueries({ queryKey: qk.friends });
  invalidatePersonalFinance();
}

/** After a plain personal expense/income create/update/delete. */
export function invalidateAfterTransaction() {
  queryClient.invalidateQueries({ queryKey: qk.expensesAll });
  queryClient.invalidateQueries({ queryKey: qk.incomeAll });
  queryClient.invalidateQueries({ queryKey: ['expenses', 'summary'] });
  queryClient.invalidateQueries({ queryKey: ['income', 'summary'] });
  queryClient.invalidateQueries({ queryKey: qk.budgets });
  queryClient.invalidateQueries({ queryKey: ['analytics'] });
}

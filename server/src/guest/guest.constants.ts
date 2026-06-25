export const GUEST_ACTION_LIMIT = 10;

export type GuestAction = 'battle' | 'favorite' | 'compare' | 'team_analyze';

export const GUEST_ACTION_LABELS: Record<GuestAction, string> = {
  battle: 'battles',
  favorite: 'favorites',
  compare: 'comparisons',
  team_analyze: 'team analyses',
};

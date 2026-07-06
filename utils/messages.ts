export type ContentMessage =
  | { type: 'toggle-headings'; enabled: boolean }
  | { type: 'toggle-css'; enabled: boolean }
  | { type: 'refresh' };

export type ContentResponse = { count: number };

// Response shapes of the participant API (packages/core/src/participant-api.ts).
export type BlockFulfilment = 'delivery' | 'pickup' | 'either' | 'none';
export type OrderFulfilment = 'delivery' | 'pickup';
export type OrderStatus = 'queued' | 'preparing' | 'ready' | 'delivered' | 'picked_up' | 'cancelled';

export interface Block {
  id: number;
  day: string;
  start: string;
  end: string;
  label: string;
  kind: 'session' | 'break' | 'meal' | 'other';
  fulfilment: BlockFulfilment;
  enabled: boolean;
}

export interface MenuOption {
  id: number;
  label: string;
  priceDeltaCents: number;
  available: boolean;
  isDefault: boolean;
}

export interface MenuGroup {
  id: number;
  name: string;
  selection: 'single' | 'multi';
  required: boolean;
  options: MenuOption[];
}

export interface MenuItem {
  id: number;
  name: string;
  description: string;
  emoji: string;
  priceCents: number;
  available: boolean;
  optionGroups: MenuGroup[];
}

export interface PublicSettings {
  baristaName: string;
  baristaLink: string | null;
  barLocationLabel: string;
  bannerText: string;
  paidMode: boolean;
  /** In paid mode, each account's free drinks per day. */
  freeDrinksPerDay: number;
}

export interface Schedule {
  blocks: Block[];
  current: Block | null;
  next: Block | null;
  nextBoundaryAt: string | null;
}

export interface Overview {
  version: number;
  environment: 'development' | 'preview' | 'production';
  timeTravel: boolean;
  now: string;
  nowLocal: { day: string; time: string };
  settings: PublicSettings;
  schedule: Schedule;
  menu: MenuItem[];
}

export interface RoundState {
  id: number;
  capacity: number;
  used: number;
  remaining: number;
  open: boolean;
  openedAt: string;
  autoCloseAt: string | null;
  closeReason: 'full' | 'manual' | 'schedule' | null;
}

export interface Order {
  id: number;
  dayCode: string;
  queue: 'round' | 'chairs';
  itemName: string;
  options: { group: string; label: string }[];
  note: string;
  priceCents: number;
  status: OrderStatus;
  fulfilment: OrderFulfilment;
  roomCode: string | null;
  cancelledBy: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
  /** While waiting: how many orders in the same queue Jad makes before this one. */
  ahead: number | null;
}

export interface Me {
  person: {
    kind: 'delegate' | 'chair';
    committee: { short: string; full: string } | null;
    role: string;
    room: { code: string; building: string; floor: number } | null;
  };
  orders: Order[];
  activeCount: number;
  activeLimit: number | null;
  dailyCount: number;
  dailyLimit: number | null;
  queue: { kind: 'round'; round: RoundState | null } | { kind: 'chairs'; paused: boolean };
  tabCents: number | null;
  /** Paid mode: free drinks left today (null when nothing is charged). */
  freeLeftToday: number | null;
}

export interface State extends Overview {
  unchanged: false;
  boundary: string;
  nextBoundaryAt: string | null;
  me: Me;
}

import { create } from "zustand";


interface BadgeState {
  lastVisited: Record<string, Record<string, number>>; // userId -> { routeName: timestamp }
  visitRoute: (userId: string, route: string) => void;
  getLastVisited: (userId: string, route: string) => number;
}

export const useBadgeStore = create<BadgeState>()((set, get) => ({
      lastVisited: {},
      visitRoute: (userId, route) => set((state) => {
        const userVisits = state.lastVisited[userId] || {};
        return {
          lastVisited: {
            ...state.lastVisited,
            [userId]: {
              ...userVisits,
              [route]: Date.now()
            }
          }
        };
      }),
      getLastVisited: (userId, route) => {
        return get().lastVisited[userId]?.[route] || 0;
      }
}));

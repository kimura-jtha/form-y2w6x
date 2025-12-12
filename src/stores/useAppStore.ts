import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

import type { Tournament } from '@/types';

interface AppState {
  // Theme
  colorScheme: 'light' | 'dark' | 'auto';
  setColorScheme: (scheme: 'light' | 'dark' | 'auto') => void;

  // Language
  language: string;
  setLanguage: (lang: string) => void;

  // Sidebar
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // Tournaments
  tournaments: Tournament[];
  setTournaments: (tournaments: Tournament[]) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        // Theme
        colorScheme: 'auto',
        setColorScheme: (colorScheme) => set({ colorScheme }),

        // Language
        language: 'en',
        setLanguage: (language) => set({ language }),

        // Sidebar
        sidebarCollapsed: false,
        toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
        setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),

        // Tournaments
        tournaments: [],
        setTournaments: (tournaments) => set({ tournaments }),
      }),
      {
        name: 'app-storage',
        partialize: (state) => ({
          colorScheme: state.colorScheme,
          language: state.language,
          sidebarCollapsed: state.sidebarCollapsed,
        }),
      },
    ),
  ),
);

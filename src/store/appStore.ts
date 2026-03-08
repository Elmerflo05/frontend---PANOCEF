import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { Notification } from '@/types';

interface AppState {
  // UI State
  theme: 'light' | 'dark';
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  
  // Portal State
  currentPortal: 'laboratory' | null;
  
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  
  // Loading states
  globalLoading: boolean;
  
  // Error handling
  globalError: string | null;
  
  // Modal states
  modals: Record<string, boolean>;
  
  // Search
  searchQuery: string;
  searchResults: any[];
  searchLoading: boolean;
}

interface AppActions {
  // Theme actions
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  
  // Sidebar actions
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  toggleSidebarCollapse: () => void;
  
  // Portal actions
  setCurrentPortal: (portal: 'laboratory' | null) => void;
  
  // Notification actions
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;
  
  // Loading actions
  setGlobalLoading: (loading: boolean) => void;
  
  // Error actions
  setGlobalError: (error: string | null) => void;
  clearGlobalError: () => void;
  
  // Modal actions
  openModal: (modalId: string) => void;
  closeModal: (modalId: string) => void;
  toggleModal: (modalId: string) => void;
  closeAllModals: () => void;
  
  // Search actions
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: any[]) => void;
  setSearchLoading: (loading: boolean) => void;
  clearSearch: () => void;
}

type AppStore = AppState & AppActions;

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // Initial state
      theme: 'light',
      sidebarOpen: true,
      sidebarCollapsed: false,
      currentPortal: null,
      notifications: [],
      unreadCount: 0,
      globalLoading: false,
      globalError: null,
      modals: {},
      searchQuery: '',
      searchResults: [],
      searchLoading: false,

      // Theme actions
      setTheme: (theme) => {
        set({ theme });
        // Apply theme to document
        document.documentElement.classList.toggle('dark', theme === 'dark');
      },

      toggleTheme: () => {
        const { theme } = get();
        const newTheme = theme === 'light' ? 'dark' : 'light';
        get().setTheme(newTheme);
      },

      // Sidebar actions
      setSidebarOpen: (open) => {
        set({ sidebarOpen: open });
      },

      toggleSidebar: () => {
        const { sidebarOpen } = get();
        set({ sidebarOpen: !sidebarOpen });
      },

      setSidebarCollapsed: (collapsed) => {
        set({ sidebarCollapsed: collapsed });
      },

      toggleSidebarCollapse: () => {
        const { sidebarCollapsed } = get();
        set({ sidebarCollapsed: !sidebarCollapsed });
      },

      // Portal actions
      setCurrentPortal: (portal) => {
        set({ currentPortal: portal });
      },

      // Notification actions
      addNotification: (notification) => {
        const { notifications } = get();
        const newNotifications = [notification, ...notifications];
        const unreadCount = newNotifications.filter(n => n.status === 'unread').length;
        
        set({
          notifications: newNotifications,
          unreadCount
        });
      },

      removeNotification: (id) => {
        const { notifications } = get();
        const newNotifications = notifications.filter(n => n.id !== id);
        const unreadCount = newNotifications.filter(n => n.status === 'unread').length;
        
        set({
          notifications: newNotifications,
          unreadCount
        });
      },

      markNotificationRead: (id) => {
        const { notifications } = get();
        const newNotifications = notifications.map(n => 
          n.id === id 
            ? { ...n, status: 'read' as const, readAt: new Date() }
            : n
        );
        const unreadCount = newNotifications.filter(n => n.status === 'unread').length;
        
        set({
          notifications: newNotifications,
          unreadCount
        });
      },

      markAllNotificationsRead: () => {
        const { notifications } = get();
        const now = new Date();
        const newNotifications = notifications.map(n => ({
          ...n,
          status: 'read' as const,
          readAt: n.readAt || now
        }));
        
        set({
          notifications: newNotifications,
          unreadCount: 0
        });
      },

      clearNotifications: () => {
        set({
          notifications: [],
          unreadCount: 0
        });
      },

      // Loading actions
      setGlobalLoading: (loading) => {
        set({ globalLoading: loading });
      },

      // Error actions
      setGlobalError: (error) => {
        set({ globalError: error });
      },

      clearGlobalError: () => {
        set({ globalError: null });
      },

      // Modal actions
      openModal: (modalId) => {
        const { modals } = get();
        set({
          modals: {
            ...modals,
            [modalId]: true
          }
        });
      },

      closeModal: (modalId) => {
        const { modals } = get();
        set({
          modals: {
            ...modals,
            [modalId]: false
          }
        });
      },

      toggleModal: (modalId) => {
        const { modals } = get();
        set({
          modals: {
            ...modals,
            [modalId]: !modals[modalId]
          }
        });
      },

      closeAllModals: () => {
        set({ modals: {} });
      },

      // Search actions
      setSearchQuery: (query) => {
        set({ searchQuery: query });
      },

      setSearchResults: (results) => {
        set({ searchResults: results });
      },

      setSearchLoading: (loading) => {
        set({ searchLoading: loading });
      },

      clearSearch: () => {
        set({
          searchQuery: '',
          searchResults: [],
          searchLoading: false
        });
      }
    }),
    {
      name: 'app-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        theme: state.theme,
        sidebarCollapsed: state.sidebarCollapsed,
        currentPortal: state.currentPortal
      })
    }
  )
);


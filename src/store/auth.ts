import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role_id: string;
  role_name: string;
  academy_id: string | null;
  academy_name: string | null;
}

interface AuthError {
  message: string;
  code?: string;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  academyId: string | null;
  academyName: string | null;
  hasHydrated: boolean;
}

interface AuthStore extends AuthState {
  // Actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: AuthError }>;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setUser: (user: User | null) => void;
  setHasHydrated: (hydrated: boolean) => void;
  initializeAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      academyId: null,
      academyName: null,
      hasHydrated: false,

      setLoading: (loading: boolean) => set({ isLoading: loading }),

      setUser: (user: User | null) => set({
        user,
        isAuthenticated: !!user,
        academyId: user?.academy_id || null,
        academyName: user?.academy_name || null
      }),

      setHasHydrated: (hydrated: boolean) => set({ hasHydrated: hydrated }),

      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true });

          // 비밀번호 검증 API 호출
          const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });

          const result = await response.json();

          if (!response.ok || !result.success) {
            set({ isLoading: false });
            return { 
              success: false, 
              error: { 
                message: result.error?.message || '로그인에 실패했습니다' 
              } 
            };
          }

          // 로그인 성공
          set({ 
            user: result.user,
            isAuthenticated: true,
            isLoading: false,
            academyId: result.user.academy_id,
            academyName: result.user.academy_name
          });

          return { success: true };

        } catch {
          set({ isLoading: false });
          return { 
            success: false, 
            error: { 
              message: '네트워크 오류가 발생했습니다' 
            } 
          };
        }
      },

      logout: async () => {
        set({ 
          user: null,
          isAuthenticated: false, 
          isLoading: false,
          academyId: null,
          academyName: null
        });
      },

      initializeAuth: () => {
        // localStorage에서 사용자 정보 복원 (zustand persist가 자동 처리)
        const state = get();
        if (state.user) {
          set({
            isAuthenticated: true,
            academyId: state.user.academy_id,
            academyName: state.user.academy_name
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        academyId: state.academyId,
        academyName: state.academyName
      }),
      onRehydrateStorage: () => (state) => {
        // 하이드레이션 완료 시 hasHydrated를 true로 설정
        state?.setHasHydrated(true);
      },
    }
  )
);

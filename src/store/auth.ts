import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Session, AuthState, AuthError } from '@/types';
import { supabase } from '@/lib/supabase/client';

interface AuthStore extends AuthState {
  // Actions
  login: (email: string, password: string) => Promise<{ success: boolean; error?: AuthError }>;
  logout: () => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<{ success: boolean; error?: AuthError }>;
  resetPassword: (email: string) => Promise<{ success: boolean; error?: AuthError }>;
  setLoading: (loading: boolean) => void;
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      session: null,
      isLoading: false,
      isAuthenticated: false,

      setLoading: (loading: boolean) => set({ isLoading: loading }),

      setUser: (user: User | null) => set({ 
        user, 
        isAuthenticated: !!user 
      }),

      setSession: (session: Session | null) => set({ 
        session, 
        user: session?.user || null,
        isAuthenticated: !!session 
      }),


      login: async (email: string, password: string) => {
        try {
          set({ isLoading: true });
          
          if (!supabase) {
            set({ isLoading: false });
            return { 
              success: false, 
              error: { 
                message: 'Supabase가 설정되지 않았습니다. 환경변수를 확인해주세요.' 
              } 
            };
          }
          
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) {
            set({ isLoading: false });
            return { 
              success: false, 
              error: { 
                message: error.message,
                code: error.message 
              } 
            };
          }

          if (data.user && data.session) {
            set({ 
              user: data.user as User,
              session: data.session as Session,
              isAuthenticated: true,
              isLoading: false 
            });
            return { success: true };
          }

          return { success: false, error: { message: '로그인에 실패했습니다.' } };
        } catch {
          set({ isLoading: false });
          return { 
            success: false, 
            error: { 
              message: '네트워크 오류가 발생했습니다.' 
            } 
          };
        }
      },

      logout: async () => {
        try {
          set({ isLoading: true });
          
          if (supabase) {
            await supabase.auth.signOut();
          }
          
          set({ 
            user: null,
            session: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
        } catch {
          set({ isLoading: false });
        }
      },

      signUp: async (email: string, password: string, name?: string) => {
        try {
          set({ isLoading: true });
          
          if (!supabase) {
            set({ isLoading: false });
            return { 
              success: false, 
              error: { 
                message: 'Supabase가 설정되지 않았습니다. 환경변수를 확인해주세요.' 
              } 
            };
          }
          
          const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: name ? { name } : undefined
            }
          });

          if (error) {
            set({ isLoading: false });
            return { 
              success: false, 
              error: { 
                message: error.message,
                code: error.message 
              } 
            };
          }

          set({ isLoading: false });
          return { success: true };
        } catch {
          set({ isLoading: false });
          return { 
            success: false, 
            error: { 
              message: '회원가입 중 오류가 발생했습니다.' 
            } 
          };
        }
      },

      resetPassword: async (email: string) => {
        try {
          set({ isLoading: true });
          
          if (!supabase) {
            set({ isLoading: false });
            return { 
              success: false, 
              error: { 
                message: 'Supabase가 설정되지 않았습니다. 환경변수를 확인해주세요.' 
              } 
            };
          }
          
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
          });

          if (error) {
            set({ isLoading: false });
            return { 
              success: false, 
              error: { 
                message: error.message 
              } 
            };
          }

          set({ isLoading: false });
          return { success: true };
        } catch {
          set({ isLoading: false });
          return { 
            success: false, 
            error: { 
              message: '비밀번호 재설정 중 오류가 발생했습니다.' 
            } 
          };
        }
      },

      initializeAuth: async () => {
        try {
          set({ isLoading: true });
          
          if (!supabase) {
            set({ 
              user: null,
              session: null, 
              isAuthenticated: false, 
              isLoading: false 
            });
            return;
          }
          
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            set({
              user: session.user as User,
              session: session as Session,
              isAuthenticated: true,
              isLoading: false
            });
          } else {
            set({ 
              user: null,
              session: null, 
              isAuthenticated: false, 
              isLoading: false 
            });
          }

          // 인증 상태 변화 감지
          supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' && session) {
              set({
                user: session.user as User,
                session: session as Session,
                isAuthenticated: true
              });
            } else if (event === 'SIGNED_OUT') {
              set({ 
                user: null,
                session: null, 
                isAuthenticated: false 
              });
            }
          });
        } catch {
          set({ 
            user: null,
            session: null, 
            isAuthenticated: false, 
            isLoading: false 
          });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ 
        user: state.user,
        isAuthenticated: state.isAuthenticated 
      }),
    }
  )
);

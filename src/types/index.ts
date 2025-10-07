// Supabase User 타입 확장
export interface User {
  id: string;
  email: string;
  name?: string;
  role?: 'admin' | 'moderator' | 'user';
  avatar?: string;
  created_at?: string;
  updated_at?: string;
  user_metadata?: {
    name?: string;
    avatar_url?: string;
  };
  app_metadata?: {
    provider?: string;
    providers?: string[];
  };
}


// Supabase Session 타입
export interface Session {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type: string;
  user: User;
}

// 인증 상태 타입
export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// 대시보드 통계 타입
export interface DashboardStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  monthlyGrowth: number;
}

// 테이블 컬럼 타입
export interface TableColumn<T> {
  key: keyof T;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, item: T) => React.ReactNode;
}

// 페이지네이션 타입
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// API 응답 타입
export interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

// 폼 상태 타입
export interface FormState {
  isLoading: boolean;
  error: string | null;
  success: boolean;
}

// 인증 에러 타입
export interface AuthError {
  message: string;
  status?: number;
  code?: string;
}

// 로그인 폼 데이터 타입
export interface LoginFormData {
  email: string;
  password: string;
}

// 회원가입 폼 데이터 타입
export interface SignUpFormData {
  email: string;
  password: string;
  name?: string;
}

// Admin User 타입 (자체 인증 시스템)
export interface User {
  id: string;
  email: string;
  name: string;
  role_id: string;
  role_name: string;
  academy_id: string | null;
  academy_name: string | null;
}

// 인증 상태 타입
export interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  academyId: string | null;
  academyName: string | null;
}

// 역할 타입
export interface Role {
  id: string;
  name: string;
  description: string | null;
  level: number;
  is_active: boolean;
  created_at: string;
}

// 권한 타입
export interface Permission {
  id: string;
  category: string;
  action: string;
  name: string;
  description: string | null;
  display_order: number;
  created_at: string;
}

// 역할-권한 매핑 타입
export interface RolePermission {
  role_id: string;
  permission_id: string;
  granted_at: string;
  granted_by: string | null;
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

// 학원 정보 타입
export interface Academy {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  description?: string;
  logo_url?: string;
  settings?: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// 서버 사이드 사용자 컨텍스트 타입
export interface UserContext {
  user: User;
  academy: Academy | null;
  isAdmin: boolean;
}

// 결제 내역 타입
export interface Payment {
  id: string;
  student_id: number; // BIGINT
  payer_name?: string;
  amount: number;
  payment_date: string;
  payment_method: '무통장' | '카드';
  cash_receipt_issued: boolean;
  academy_id?: string;
  created_at: string;
  updated_at: string;
  // JOIN된 학생 정보 (옵션)
  student_name?: string;
}

import { z } from 'zod';

// 로그인 폼 검증 스키마
export const loginSchema = z.object({
  email: z.string().email('유효한 이메일을 입력해주세요'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
});

// 회원가입 폼 검증 스키마
export const registerSchema = z.object({
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다'),
  email: z.string().email('유효한 이메일을 입력해주세요'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirmPassword'],
});

// 사용자 정보 업데이트 스키마
export const updateUserSchema = z.object({
  name: z.string().min(2, '이름은 최소 2자 이상이어야 합니다').optional(),
  email: z.string().email('유효한 이메일을 입력해주세요').optional(),
  role: z.enum(['admin', 'moderator', 'user']).optional(),
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type UpdateUserFormData = z.infer<typeof updateUserSchema>;





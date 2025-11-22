'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/auth';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  LogOut,
  Clock,
  Shield,
  GraduationCap,
  BookOpen,
  Building2,
  ChevronDown as ChevronDownIcon,
  BookText,
  Wallet,
  FileText
} from 'lucide-react';

// 네비게이션 아이템 타입 정의
interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeType?: 'new' | 'default';
  requiredPermission?: string | null; // permissionId 또는 null (null이면 권한 체크 없음)
}

interface NavigationCategory {
  title: string;
  items: NavigationItem[];
}

// 권한 ID 매핑 (DB에서 조회한 값)
const PERMISSION_IDS = {
  STUDENTS_VIEW: 'students.view',
  REPORTS_VIEW: 'reports.view',
  ACADEMY_SETTINGS: 'academy.settings',
  USERS_VIEW: 'users.view'
};

const navigationCategories: NavigationCategory[] = [
  {
    title: 'OVERVIEW',
    items: [
      { name: '대시보드', href: '/admin', icon: LayoutDashboard, badge: '3', requiredPermission: null }
    ]
  },
  {
    title: 'STUDENT MANAGEMENT',
    items: [
      { name: '학생 관리', href: '/admin/students', icon: GraduationCap, requiredPermission: PERMISSION_IDS.STUDENTS_VIEW },
      { name: '등/하원 조회', href: '/admin/checkinout', icon: Clock, badge: '5', requiredPermission: PERMISSION_IDS.STUDENTS_VIEW },
      { name: '학습관리', href: '/admin/learning', icon: BookText, requiredPermission: PERMISSION_IDS.REPORTS_VIEW },
      { name: '학습리포트', href: '/admin/study-reports', icon: BookOpen, requiredPermission: PERMISSION_IDS.REPORTS_VIEW }
    ]
  },
  {
    title: 'CONTENTS MANAGEMENT',
    items: [
      { name: '지문관리', href: '/admin/contents/passages', icon: FileText, requiredPermission: null }
    ]
  },
  {
    title: 'FINANCE',
    items: [
      { name: '학원비수납내역', href: '/admin/payments', icon: Wallet, requiredPermission: null }
    ]
  },
  {
    title: 'TEACHER',
    items: [
      { name: '지문가이드', href: '/admin/teacher/passage-guide', icon: BookOpen, requiredPermission: null }
    ]
  },
  {
    title: 'SETTINGS',
    items: [
      { name: '설정', href: '', icon: Settings, requiredPermission: null }
    ]
  }
];

interface AdminSidebarProps {
  className?: string;
}

interface SubMenuItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredPermission?: string | null;
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuthStore();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [permissionIds, setPermissionIds] = useState<string[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(true);
  const permissionIdsRef = useRef<string[]>([]);
  const userRoleIdRef = useRef<string | undefined>(user?.role_id);

  const handleLogout = () => {
    // 간단한 로그아웃 - 메인 페이지로 이동
    router.push('/');
  };

  const isItemActive = (href: string) => {
    return pathname === href;
  };

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => {
      if (prev.includes(itemName)) {
        return prev.filter(item => item !== itemName);
      } else {
        return [...prev, itemName];
      }
    });
  };

  // 설정 메뉴의 하위 메뉴들
  const settingsSubMenus = useMemo(() => [
    { name: '학원관리', href: '/admin/settings/academy', icon: Building2, requiredPermission: PERMISSION_IDS.ACADEMY_SETTINGS },
    { name: '사용자 관리', href: '/admin/settings/users', icon: Users, requiredPermission: PERMISSION_IDS.USERS_VIEW },
    { name: '권한 관리', href: '/admin/settings/permissions', icon: Shield, requiredPermission: null } // Admin 전용은 특별 처리
  ], []);

  // 학습관리 서브메뉴들
  const learningSubMenus = useMemo(() => [
    { name: '국어', href: '/admin/learning', icon: BookText },
    { name: '국어2', href: '/admin/learning/korean2', icon: BookText },
    { name: '수학', href: '/admin/learning/math', icon: BookText }
  ], []);

  // 권한 목록 로드 (한 번만, role_id가 변경될 때만)
  useEffect(() => {
    const loadPermissions = async () => {
      // 이미 같은 role_id로 로드했으면 스킵
      if (user?.role_id && userRoleIdRef.current === user.role_id && permissionIdsRef.current.length > 0) {
        setPermissionIds(permissionIdsRef.current);
        setLoadingPermissions(false);
        return;
      }

      if (!user?.role_id) {
        setLoadingPermissions(false);
        return;
      }

      try {
        setLoadingPermissions(true);
        const response = await fetch(`/api/auth/permissions?role_id=${user.role_id}`);
        const result = await response.json();

        if (result.success) {
          const newPermissionIds = result.data.permissionIds || [];
          permissionIdsRef.current = newPermissionIds;
          userRoleIdRef.current = user.role_id;
          setPermissionIds(newPermissionIds);
        }
      } catch (error) {
        console.error('Failed to load permissions:', error);
      } finally {
        setLoadingPermissions(false);
      }
    };

    loadPermissions();
  }, [user?.role_id]);

  // 현재 활성화된 하위 메뉴가 있는 상위 메뉴를 자동으로 열기 (최적화: 상태 업데이트 최소화)
  useEffect(() => {
    setExpandedItems(prev => {
      let updated = false;
      const newExpanded = [...prev];

      const hasActiveSubMenu = settingsSubMenus.some(subItem => subItem.href === pathname);
      if (hasActiveSubMenu && !prev.includes('설정')) {
        newExpanded.push('설정');
        updated = true;
      }

      const hasActiveLearningSubMenu = learningSubMenus.some(subItem => subItem.href === pathname);
      if (hasActiveLearningSubMenu && !prev.includes('학습관리')) {
        newExpanded.push('학습관리');
        updated = true;
      }

      // 변경이 없으면 같은 배열 반환하여 리렌더링 방지
      return updated ? newExpanded : prev;
    });
  }, [pathname, settingsSubMenus, learningSubMenus]);

  // 권한 체크 함수 - useCallback으로 최적화 (ref 사용하여 불필요한 재생성 방지)
  const hasPermission = useCallback((requiredPermission: string | null | undefined): boolean => {
    // null이면 권한 체크 없음 (항상 표시)
    if (requiredPermission === null || requiredPermission === undefined) {
      return true;
    }

    // 권한 관리 메뉴는 role_id로 체크
    if (requiredPermission === 'PERMISSIONS_ADMIN') {
      return user?.role_id === 'admin';
    }

    // 권한 로딩 중이거나 권한이 아직 로드되지 않았으면 일단 true 반환 (모든 메뉴 표시)
    // 로딩이 완료되고 권한이 있을 때만 필터링
    if (loadingPermissions || permissionIdsRef.current.length === 0) {
      return true;
    }

    // ref를 사용하여 permissionIds 조회 (상태 변경 없이도 체크 가능)
    return permissionIdsRef.current.includes(requiredPermission);
  }, [user?.role_id, loadingPermissions]);

  // 필터링된 설정 하위 메뉴 (먼저 계산)
  const filteredSettingsSubMenus = useMemo(() => {
    // 권한 로딩 중이면 필터링하지 않고 전체 메뉴 표시
    if (loadingPermissions) {
      return settingsSubMenus;
    }

    return settingsSubMenus.filter(subItem => {
      // 권한 관리 메뉴는 특별 처리
      if (subItem.name === '권한 관리') {
        return user?.role_id === 'admin';
      }
      return hasPermission(subItem.requiredPermission);
    });
  }, [hasPermission, user?.role_id, loadingPermissions]);

  // 필터링된 메뉴 카테고리
  const filteredCategories = useMemo(() => {
    // 권한이 로드되지 않았거나 로딩 중이면 필터링하지 않고 전체 메뉴 표시
    if (loadingPermissions || permissionIdsRef.current.length === 0) {
      return navigationCategories;
    }

    return navigationCategories
      .map(category => {
        const filteredItems = category.items.filter(item => {
          // 설정 메뉴의 경우 하위 메뉴가 없으면 숨김
          if (item.name === '설정' && filteredSettingsSubMenus.length === 0) {
            return false;
          }
          return hasPermission(item.requiredPermission);
        });
        return {
          ...category,
          items: filteredItems
        };
      })
      .filter(category => category.items.length > 0); // 빈 카테고리 제거
  }, [hasPermission, filteredSettingsSubMenus, loadingPermissions, permissionIds]);

  // 필터링된 학습관리 하위 메뉴
  const filteredLearningSubMenus = useMemo(() => {
    return learningSubMenus.filter(subItem => hasPermission(null)); // 학습관리 하위 메뉴는 모두 표시
  }, [hasPermission]);

  return (
    <div className={cn('flex h-full w-56 flex-col bg-white border-r border-gray-200', className)}>
      {/* 로고 섹션 */}
      <div className="flex h-[58px] min-h-[58px] items-center px-5 bg-gradient-to-r from-blue-500 to-blue-700">
        <div className="flex items-center space-x-2.5">
          {/* 로고 아이콘 */}
          <div className="w-9 h-9 bg-gradient-to-br from-blue-300 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-[17px] font-bold text-white leading-tight">
              부산EDU
            </h1>
            <p className="text-[13px] text-blue-100 font-medium">
              학원관리 시스템
            </p>
          </div>
        </div>
      </div>

      {/* 네비게이션 메뉴 */}
      <nav className="flex-1 px-3.5 py-5 space-y-5">
        {filteredCategories.map((category) => (
          <div key={category.title}>
            {/* 카테고리 헤더 */}
            <div className="px-2 py-1.5">
              <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                {category.title}
              </h3>
            </div>
            
            {/* 카테고리 아이템들 */}
            <div className="space-y-1">
              {category.items.map((item) => {
                const isActive = isItemActive(item.href);
                const isSettings = item.name === '설정';
                const isLearningManagement = item.name === '학습관리';
                const isExpanded = expandedItems.includes(item.name);
                
                return (
                  <div key={item.name}>
                    {isSettings ? (
                      <div>
                        <div
                          className={cn(
                            'flex items-center justify-between px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer',
                            isActive
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-700 hover:bg-gray-50'
                          )}
                          onClick={() => toggleExpanded(item.name)}
                        >
                          <div className="flex items-center space-x-2.5">
                            <item.icon className="h-[18px] w-[18px]" />
                            <span>{item.name}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {/* 드롭다운 화살표 */}
                            <ChevronDownIcon className={cn(
                              'h-3.5 w-3.5 text-gray-400 transition-transform',
                              isExpanded ? 'rotate-180' : ''
                            )} />
                          </div>
                        </div>
                        
                        {/* 하위 메뉴 */}
                        {isExpanded && (
                          <div className="ml-3.5 mt-1.5 space-y-1">
                            {filteredSettingsSubMenus.map((subItem) => {
                              const isSubActive = isItemActive(subItem.href);
                              return (
                                <Link key={subItem.name} href={subItem.href}>
                                  <div
                                    className={cn(
                                      'flex items-center px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors',
                                      isSubActive
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-600 hover:bg-gray-50'
                                    )}
                                  >
                                    <subItem.icon className="h-3.5 w-3.5 mr-2.5" />
                                    <span>{subItem.name}</span>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : isLearningManagement ? (
                      <div>
                        <div
                          className={cn(
                            'flex items-center justify-between px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer',
                            isActive
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-700 hover:bg-gray-50'
                          )}
                          onClick={() => toggleExpanded(item.name)}
                        >
                          <div className="flex items-center space-x-2.5">
                            <item.icon className="h-[18px] w-[18px]" />
                            <span>{item.name}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            <ChevronDownIcon className={cn(
                              'h-3.5 w-3.5 text-gray-400 transition-transform',
                              isExpanded ? 'rotate-180' : ''
                            )} />
                          </div>
                        </div>
                        
                        {/* 하위 메뉴 */}
                        {isExpanded && (
                          <div className="ml-3.5 mt-1.5 space-y-1">
                            {learningSubMenus.map((subItem) => {
                              const isSubActive = isItemActive(subItem.href);
                              return (
                                <Link key={subItem.name} href={subItem.href}>
                                  <div
                                    className={cn(
                                      'flex items-center px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors',
                                      isSubActive
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-600 hover:bg-gray-50'
                                    )}
                                  >
                                    <subItem.icon className="h-3.5 w-3.5 mr-2.5" />
                                    <span>{subItem.name}</span>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ) : (
                      <Link href={item.href}>
                        <div
                          className={cn(
                            'flex items-center justify-between px-2.5 py-2 rounded-lg text-[13px] font-medium transition-colors',
                            isActive
                              ? 'bg-blue-50 text-blue-700'
                              : 'text-gray-700 hover:bg-gray-50'
                          )}
                        >
                          <div className="flex items-center space-x-2.5">
                            <item.icon className="h-[18px] w-[18px]" />
                            <span>{item.name}</span>
                          </div>
                          
                          <div className="flex items-center space-x-2">
                            {/* 배지 */}
                            {item.badge && (
                              <Badge 
                                variant={item.badgeType === 'new' ? 'default' : 'secondary'}
                                className={cn(
                                  'text-[11px] px-2 py-0.5',
                                  item.badgeType === 'new' 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-blue-100 text-blue-700'
                                )}
                              >
                                {item.badge}
                              </Badge>
                            )}
                            
                            {/* 드롭다운 화살표 - 하위 메뉴가 있을 때만 표시 */}
                            {isSettings && (
                              <ChevronDownIcon className={cn(
                                'h-3.5 w-3.5 text-gray-400 transition-transform',
                                isExpanded ? 'rotate-180' : ''
                              )} />
                            )}
                            {isLearningManagement && (
                              <ChevronDownIcon className={cn(
                                'h-3.5 w-3.5 text-gray-400 transition-transform',
                                isExpanded ? 'rotate-180' : ''
                              )} />
                            )}
                          </div>
                        </div>
                      </Link>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* 로그아웃 버튼 */}
      <div className="p-3.5 border-t border-gray-100">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-600 hover:bg-gray-50 text-[13px] h-9"
          onClick={handleLogout}
        >
          <LogOut className="mr-2.5 h-[18px] w-[18px]" />
          로그아웃
        </Button>
      </div>
    </div>
  );
}

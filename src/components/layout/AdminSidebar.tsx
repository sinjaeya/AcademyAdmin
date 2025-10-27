'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  BarChart3, 
  LogOut,
  Clock,
  Shield,
  CreditCard,
  GraduationCap,
  BookOpen,
  Building2,
  Folder,
  Wallet,
  Search,
  HelpCircle,
  ChevronDown as ChevronDownIcon,
  BookText
} from 'lucide-react';

// 네비게이션 아이템 타입 정의
interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  badgeType?: 'new' | 'default';
}

interface NavigationCategory {
  title: string;
  items: NavigationItem[];
}

const navigationCategories: NavigationCategory[] = [
  {
    title: 'OVERVIEW',
    items: [
      { name: '대시보드', href: '/admin', icon: LayoutDashboard, badge: '3' },
      { name: '통계', href: '/admin/analytics', icon: BarChart3 },
      { name: '학원관리', href: '/admin/settings/academy', icon: Building2 },
      { name: '프로젝트', href: '/admin/projects', icon: Folder, badge: '12' }
    ]
  },
  {
    title: 'STUDENT MANAGEMENT',
    items: [
      { name: '학생 관리', href: '/admin/students', icon: GraduationCap },
      { name: '등/하원 조회', href: '/admin/checkinout', icon: Clock, badge: '5' },
      { name: '학습관리', href: '/admin/learning', icon: BookText },
      { name: '학습리포트', href: '/admin/study-reports', icon: BookOpen }
    ]
  },
  {
    title: 'FINANCE',
    items: [
      { name: '입금조회', href: '/admin/payments', icon: CreditCard, badge: '2' },
      { name: '수납관리', href: '/admin/transactions', icon: Wallet }
    ]
  },
  {
    title: 'SYSTEM MANAGEMENT',
    items: [
      { name: 'SEO', href: '/admin/seo', icon: Search, badge: 'New', badgeType: 'new' }
    ]
  },
  {
    title: 'TEAM & COMMUNICATION',
    items: [
      { name: '설정', href: '/admin/settings', icon: Settings },
      { name: '도움말', href: '/admin/help', icon: HelpCircle }
    ]
  }
];

interface AdminSidebarProps {
  className?: string;
}

export function AdminSidebar({ className }: AdminSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

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
    { name: '학원관리', href: '/admin/settings/academy', icon: Building2 },
    { name: '사용자 관리', href: '/admin/settings/users', icon: Users },
    { name: '권한 관리', href: '/admin/settings/permissions', icon: Shield }
  ], []);

  // 현재 활성화된 하위 메뉴가 있는 상위 메뉴를 자동으로 열기
  useEffect(() => {
    const hasActiveSubMenu = settingsSubMenus.some(subItem => subItem.href === pathname);
    if (hasActiveSubMenu) {
      setExpandedItems(prev => {
        if (!prev.includes('설정')) {
          return [...prev, '설정'];
        }
        return prev;
      });
    }
  }, [pathname, settingsSubMenus]);

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
        {navigationCategories.map((category) => (
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
                            {settingsSubMenus.map((subItem) => {
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

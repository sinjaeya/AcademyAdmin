'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Users, 
  Settings, 
  BarChart3, 
  FileText,
  LogOut,
  Clock,
  ChevronDown,
  ChevronRight,
  Shield,
  CreditCard,
  GraduationCap,
  BookOpen,
  Building2
} from 'lucide-react';

const navigation = [
  { name: '대시보드', href: '/admin', icon: LayoutDashboard },
  { name: '등/하원 조회', href: '/admin/checkinout', icon: Clock },
  { name: '입금조회', href: '/admin/payments', icon: CreditCard },
  { name: '학생 관리', href: '/admin/students', icon: GraduationCap },
  { name: '학습리포트', href: '/admin/study-reports', icon: BookOpen },
  { name: '통계', href: '/admin/analytics', icon: BarChart3 },
  { name: '문서', href: '/admin/documents', icon: FileText },
  { 
    name: '설정', 
    href: '/admin/settings', 
    icon: Settings,
    children: [
      { name: '학원관리', href: '/admin/settings/academy', icon: Building2 },
      { name: '사이트 사용자 관리', href: '/admin/settings/users', icon: Users },
      { name: '사용자 권한 관리', href: '/admin/settings/permissions', icon: Shield }
    ]
  },
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

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => {
      // 현재 클릭한 아이템이 이미 확장되어 있는 경우
      if (prev.includes(itemName)) {
        // 하위 메뉴가 열린 상태에서는 접히지 않음 (아무것도 하지 않음)
        return prev;
      } else {
        // 새로운 아이템을 확장하고 다른 확장된 아이템들을 확인하여 닫기
        // 단, 현재 활성화된 하위 메뉴가 있는 상위 메뉴는 닫지 않음
        const newExpandedItems = [itemName];
        
        // 기존에 확장된 아이템들 중에서 현재 활성화된 하위 메뉴가 있는 것들은 유지
        prev.forEach(expandedItemName => {
          const expandedItem = navigation.find(item => item.name === expandedItemName);
          if (expandedItem && hasActiveChild(expandedItem)) {
            newExpandedItems.push(expandedItemName);
          }
        });
        
        return newExpandedItems;
      }
    });
  };

  // 현재 활성화된 상위 메뉴가 있는지 확인하는 함수
  const hasActiveChild = (item: { children?: { href: string }[] }) => {
    if (!item.children) return false;
    return item.children.some((child) => child.href === pathname);
  };

  // 페이지 로드 시 현재 활성화된 하위 메뉴가 있는 상위 메뉴를 자동으로 열기
  useEffect(() => {
    const activeParentItems = navigation
      .filter(item => hasActiveChild(item))
      .map(item => item.name);
    
    if (activeParentItems.length > 0) {
      setExpandedItems(prev => {
        // 기존에 열린 메뉴와 현재 활성화된 부모 메뉴들을 합치기
        const newExpandedItems = [...new Set([...prev, ...activeParentItems])];
        return newExpandedItems;
      });
    }
  }, [pathname]);

  const isItemActive = (item: { href: string; children?: { href: string }[] }) => {
    if (item.href === pathname) return true;
    if (item.children) {
      return item.children.some((child) => child.href === pathname);
    }
    return false;
  };

  return (
    <div className={cn('flex h-full w-64 flex-col bg-gray-900', className)}>
      {/* 로고 */}
      <div className="flex h-16 items-center px-6">
        <h1 className="text-xl font-bold text-white">Admin Panel</h1>
      </div>

      {/* 네비게이션 메뉴 */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = isItemActive(item);
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedItems.includes(item.name);

          return (
            <div key={item.name}>
              {hasChildren ? (
                <div>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-between text-left',
                      isActive
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    )}
                    onClick={() => toggleExpanded(item.name)}
                  >
                    <div className="flex items-center">
                      <item.icon className="mr-3 h-5 w-5" />
                      {item.name}
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                  
                  {/* 하위 메뉴 */}
                  {isExpanded && (
                    <div className="ml-4 mt-1 space-y-1">
                      {item.children?.map((child) => {
                        const isChildActive = child.href === pathname;
                        return (
                          <Link key={child.name} href={child.href}>
                            <Button
                              variant={isChildActive ? 'secondary' : 'ghost'}
                              className={cn(
                                'w-full justify-start text-left text-sm',
                                isChildActive
                                  ? 'bg-gray-700 text-white'
                                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                              )}
                            >
                              <child.icon className="mr-3 h-4 w-4" />
                              {child.name}
                            </Button>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <Link href={item.href}>
                  <Button
                    variant={isActive ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start text-left',
                      isActive
                        ? 'bg-gray-800 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    )}
                  >
                    <item.icon className="mr-3 h-5 w-5" />
                    {item.name}
                  </Button>
                </Link>
              )}
            </div>
          );
        })}
      </nav>

      {/* 로그아웃 버튼 */}
      <div className="p-3">
        <Button
          variant="ghost"
          className="w-full justify-start text-gray-300 hover:bg-gray-800 hover:text-white"
          onClick={handleLogout}
        >
          <LogOut className="mr-3 h-5 w-5" />
          로그아웃
        </Button>
      </div>
    </div>
  );
}

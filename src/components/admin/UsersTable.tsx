'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Edit, Trash2, UserCheck } from 'lucide-react';
import { User } from '@/types';

// 임시 데이터
const mockUsers: User[] = [
  {
    id: '1',
    name: '김관리',
    email: 'admin@example.com',
    role_id: '1',
    role_name: '관리자',
    academy_id: null,
    academy_name: null,
  },
  {
    id: '2',
    name: '박사용',
    email: 'user1@example.com',
    role_id: '2',
    role_name: '사용자',
    academy_id: '1',
    academy_name: '이지수학교습소',
  },
  {
    id: '3',
    name: '이중재',
    email: 'moderator@example.com',
    role_id: '3',
    role_name: '중재자',
    academy_id: '1',
    academy_name: '이지수학교습소',
  },
  {
    id: '4',
    name: '최사용',
    email: 'user2@example.com',
    role_id: '2',
    role_name: '사용자',
    academy_id: '1',
    academy_name: '이지수학교습소',
  },
];

const getRoleBadgeVariant = (roleName: string) => {
  if (roleName.includes('관리자')) {
    return 'destructive';
  } else if (roleName.includes('중재')) {
    return 'default';
  } else {
    return 'secondary';
  }
};

export function UsersTable() {
  const [users] = useState<User[]>(mockUsers);

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>사용자</TableHead>
            <TableHead>이메일</TableHead>
            <TableHead>역할</TableHead>
            <TableHead>가입일</TableHead>
            <TableHead>최근 활동</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>
                      {user.name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{user.name || 'Unknown User'}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge variant={getRoleBadgeVariant(user.role_name || '사용자')}>
                  {user.role_name || '사용자'}
                </Badge>
              </TableCell>
              <TableCell>
                {user.academy_name || '-'}
              </TableCell>
              <TableCell>
                -
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem>
                      <Edit className="mr-2 h-4 w-4" />
                      편집
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <UserCheck className="mr-2 h-4 w-4" />
                      권한 변경
                    </DropdownMenuItem>
                    <DropdownMenuItem className="text-red-600">
                      <Trash2 className="mr-2 h-4 w-4" />
                      삭제
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
    role: 'admin',
    avatar: '/avatars/admin.jpg',
    created_at: '2024-01-15',
    updated_at: '2024-10-05',
  },
  {
    id: '2',
    name: '박사용',
    email: 'user1@example.com',
    role: 'user',
    avatar: '/avatars/user1.jpg',
    created_at: '2024-02-20',
    updated_at: '2024-10-04',
  },
  {
    id: '3',
    name: '이중재',
    email: 'moderator@example.com',
    role: 'moderator',
    avatar: '/avatars/moderator.jpg',
    created_at: '2024-03-10',
    updated_at: '2024-10-03',
  },
  {
    id: '4',
    name: '최사용',
    email: 'user2@example.com',
    role: 'user',
    avatar: '/avatars/user2.jpg',
    created_at: '2024-04-05',
    updated_at: '2024-10-02',
  },
];

const getRoleBadgeVariant = (role: string) => {
  switch (role) {
    case 'admin':
      return 'destructive';
    case 'moderator':
      return 'default';
    case 'user':
      return 'secondary';
    default:
      return 'outline';
  }
};

const getRoleLabel = (role: string) => {
  switch (role) {
    case 'admin':
      return '관리자';
    case 'moderator':
      return '중재자';
    case 'user':
      return '사용자';
    default:
      return role;
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
                    <AvatarImage src={user.avatar} alt={user.name || 'User'} />
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
                <Badge variant={getRoleBadgeVariant(user.role || 'user')}>
                  {getRoleLabel(user.role || 'user')}
                </Badge>
              </TableCell>
              <TableCell>
                {user.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '-'}
              </TableCell>
              <TableCell>
                {user.updated_at ? new Date(user.updated_at).toLocaleDateString('ko-KR') : '-'}
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

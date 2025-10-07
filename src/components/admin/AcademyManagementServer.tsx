import { createClient } from '@supabase/supabase-js';
import { AcademyManagement } from './AcademyManagement';
import { Academy } from '@/types';

export async function AcademyManagementServer() {
  try {
    // 환경변수 확인
    console.log('환경변수 확인:', {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? '설정됨' : '없음',
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? '설정됨' : '없음'
    });

    // anon key로 Supabase 클라이언트 생성
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mhorwnwhcyxynfxmlhit.supabase.co';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1ob3J3bndoY3l4eW5meG1saGl0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkxMTA0NTMsImV4cCI6MjA3NDY4NjQ1M30.2fpvr5wNDlbguFMgyd5ZcNt9_LHAz-j9oa-nCiO60cQ';
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    
    // 학원 목록 조회
    const { data: academies, error } = await supabase
      .from('academy')
      .select('*')
      .order('created_at', { ascending: false });

    console.log('학원 데이터 조회 결과:', { academies, error });

    if (error) {
      console.error('학원 목록 조회 오류:', error);
      return (
        <div className="text-center text-red-600 p-6">
          학원 목록을 불러오는데 실패했습니다.
          <br />
          <small>오류: {error.message}</small>
        </div>
      );
    }

    const academyList = academies || [];
    console.log('전달할 학원 데이터:', academyList);

    return (
      <AcademyManagement initialAcademies={academyList} />
    );
  } catch (error) {
    console.error('서버 컴포넌트 오류:', error);
    return (
      <div className="text-center text-red-600 p-6">
        서버 오류가 발생했습니다.
        <br />
        <small>오류: {error instanceof Error ? error.message : '알 수 없는 오류'}</small>
      </div>
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { year, month } = body;

    // Python 스크립트 경로
    const pythonScript = 'c:/Source/dailykor-data-sync/학습결과_가져오기.py';
    const monthArg = `${year}-${String(month).padStart(2, '0')}`;

    console.log(`Starting sync for ${monthArg}`);

    // 백그라운드에서 Python 스크립트 실행
    const command = `python "${pythonScript}" "${monthArg}"`;
    
    exec(command, {
      cwd: 'c:/Source/dailykor-data-sync',
      maxBuffer: 1024 * 1024 * 10, // 10MB
      env: process.env,
    }, (error, stdout, stderr) => {
      if (error) {
        console.error('Python script error:', error);
        return;
      }
      
      console.log('Python script completed');
      console.log('Output:', stdout);
      
      if (stderr) {
        console.error('Python script stderr:', stderr);
      }
    });

    // 즉시 응답 반환 (비동기 처리)
    return NextResponse.json({ 
      success: true, 
      message: '학습 데이터 동기화가 시작되었습니다.' 
    });

  } catch (error) {
    console.error('Error in sync API:', error);
    return NextResponse.json({ 
      success: false, 
      error: '서버 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}


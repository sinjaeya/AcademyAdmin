import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/admin/ai-report
 * AI 리포트 생성 (프록시)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { learningData } = body;
    
    if (!learningData) {
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'MISSING_LEARNING_DATA',
            message: 'learningData 필드가 필요합니다.'
          }
        },
        { status: 400 }
      );
    }
    
    // 외부 API 호출
    const apiResponse = await fetch('https://api.busanedu.co.kr/api/MathReport', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        learningDataText: learningData
      })
    });
    
    if (!apiResponse.ok) {
      const errorData = await apiResponse.json().catch(() => ({}));
      console.error('외부 API 오류:', apiResponse.status, errorData);
      console.error('전달한 데이터:', { learningDataText: learningData });
      
      return NextResponse.json(
        { 
          success: false,
          error: {
            code: 'EXTERNAL_API_ERROR',
            message: errorData.error?.message || errorData.message || `외부 API 오류: ${apiResponse.status}`,
            details: errorData
          }
        },
        { status: apiResponse.status }
      );
    }
    
    const result = await apiResponse.json();
    return NextResponse.json(result);
    
  } catch (error) {
    console.error('AI 리포트 API 오류:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : '서버 오류가 발생했습니다'
        }
      },
      { status: 500 }
    );
  }
}


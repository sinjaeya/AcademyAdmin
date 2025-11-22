'use server';

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

const PASSAGE_QA_STATUSES = ['pending', 'reviewed', 'approved', 'rejected', 'length_overflow'] as const;
const ALLOWED_STATUS = new Set(PASSAGE_QA_STATUSES);

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: '지문 ID가 필요합니다.' }, { status: 400 });
  }

  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('passage')
      .select('*')
      .eq('code_id', id)
      .single();

    if (error) {
      console.error('Failed to fetch passage detail:', error);
      return NextResponse.json(
        { error: error.message || '지문 상세 정보를 가져오는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json({ error: '지문을 찾을 수 없습니다.' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error while fetching passage detail:', error);
    return NextResponse.json(
      { error: '지문 상세 정보를 가져오는 중 서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  if (!id) {
    return NextResponse.json({ error: '지문 ID가 필요합니다.' }, { status: 400 });
  }

  let payload: { status?: string; content?: string } = {};

  try {
    payload = await request.json();
  } catch (error) {
    console.error('Invalid JSON payload:', error);
    return NextResponse.json({ error: '잘못된 요청 본문입니다.' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  if (typeof payload.status === 'string') {
    const normalized = payload.status.toLowerCase() as typeof PASSAGE_QA_STATUSES[number];
    if (!ALLOWED_STATUS.has(normalized)) {
      return NextResponse.json({ error: '허용되지 않은 상태 값입니다.' }, { status: 400 });
    }
    updates.qa_status = normalized;
  }

  if (typeof payload.content === 'string') {
    updates.content = payload.content;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: '업데이트할 데이터가 없습니다.' }, { status: 400 });
  }

  try {
    const supabase = createServerClient();

    const { data, error } = await supabase
      .from('passage')
      .update(updates)
      .eq('code_id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Failed to update passage:', error);
      return NextResponse.json(
        { error: error.message || '지문을 업데이트하는 중 오류가 발생했습니다.' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error while updating passage:', error);
    return NextResponse.json(
      { error: '지문을 업데이트하는 중 서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}


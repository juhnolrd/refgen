import { NextRequest, NextResponse } from 'next/server';
import { parseURL } from '@/lib/parser';
import { formatGOST } from '@/lib/formatter';


export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();


    if (!url) {
      return NextResponse.json(
        { error: 'URL обязателен' },
        { status: 400 }
      );
    }


    // Валидация URL
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Некорректный URL' },
        { status: 400 }
      );
    }


    const metadata = await parseURL(url);
    const citation = formatGOST(metadata);


    return NextResponse.json({
      citation,
      metadata
    });


  } catch (error: any) {
    console.error('Parse error:', error);
    return NextResponse.json(
      { error: error.message || 'Ошибка при парсинге URL' },
      { status: 500 }
    );
  }
}
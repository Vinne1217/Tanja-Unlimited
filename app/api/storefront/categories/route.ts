import { NextResponse } from 'next/server';
import { getCategories } from '@/lib/catalog';

export const dynamic = 'force-dynamic';
export const revalidate = 300;

export async function GET() {
  try {
    const categories = await getCategories('sv');
    return NextResponse.json({ 
      success: true, 
      categories 
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        categories: [] 
      },
      { status: 500 }
    );
  }
}


import { NextResponse } from 'next/server';
import { getCategories } from '@/lib/catalog';

export const dynamic = 'force-dynamic';
export const revalidate = 60; // Revalidate every minute to get fresh categories from customer portal

export async function GET() {
  try {
    const categories = await getCategories('sv');
    
    // Log category structure for debugging
    console.log(`📦 Categories API: Fetched ${categories.length} categories`);
    if (categories.length > 0) {
      console.log(`📦 Sample category structure:`, JSON.stringify(categories[0], null, 2));
      console.log(`📦 Sample category fields:`, {
        id: categories[0].id,
        name: categories[0].name,
        slug: categories[0].slug,
        hasSubcategories: !!categories[0].subcategories,
        subcategoryCount: categories[0].subcategories?.length || 0,
        productCount: categories[0].productCount
      });
    } else {
      console.warn(`⚠️ No categories returned from getCategories`);
    }
    
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


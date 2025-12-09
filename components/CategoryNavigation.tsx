'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronDown, ChevronUp } from 'lucide-react';

export type Category = { 
  id: string; 
  slug: string; 
  name: string;
  subcategories?: Category[];
  productCount?: number;
};

export default function CategoryNavigation() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const pathname = usePathname();

  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await fetch('/api/storefront/categories', {
          cache: 'no-store'
        });
        const data = await response.json();
        if (data.success && data.categories) {
          setCategories(data.categories);
        }
      } catch (error) {
        console.error('Error loading categories:', error);
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, []);

  const toggleCategory = (slug: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(slug)) {
        newSet.delete(slug);
      } else {
        newSet.add(slug);
      }
      return newSet;
    });
  };

  const isCategoryActive = (categorySlug: string) => {
    return pathname === `/webshop/${categorySlug}`;
  };

  const isSubcategoryActive = (subcategorySlug: string, parentSlug: string) => {
    // Check if current path matches subcategory pattern
    return pathname === `/webshop/${parentSlug}/${subcategorySlug}` || 
           pathname.includes(`/${subcategorySlug}`);
  };

  if (loading) {
    return (
      <div className="bg-white border-b border-warmOchre/20 py-4">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="text-sm text-softCharcoal">Laddar kategorier...</div>
        </div>
      </div>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border-b border-warmOchre/20 py-4 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => {
            const hasSubcategories = category.subcategories && category.subcategories.length > 0;
            const isExpanded = expandedCategories.has(category.slug);
            const isActive = isCategoryActive(category.slug);

            return (
              <div key={category.id || category.slug} className="relative">
                <div className="flex items-center">
                  <Link
                    href={`/webshop/${category.slug}`}
                    className={`px-4 py-2 rounded-md font-medium text-sm transition-all ${
                      isActive
                        ? 'bg-warmOchre text-deepIndigo'
                        : 'bg-warmIvory text-softCharcoal hover:bg-warmOchre/20 hover:text-deepIndigo'
                    }`}
                  >
                    {category.name}
                    {category.productCount !== undefined && category.productCount > 0 && (
                      <span className="ml-2 text-xs opacity-70">
                        ({category.productCount})
                      </span>
                    )}
                  </Link>
                  
                  {hasSubcategories && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleCategory(category.slug);
                      }}
                      className={`ml-1 p-1 rounded transition-colors ${
                        isExpanded ? 'text-warmOchre' : 'text-softCharcoal hover:text-deepIndigo'
                      }`}
                      aria-label={isExpanded ? 'Dölj underkategorier' : 'Visa underkategorier'}
                    >
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </div>

                {/* Subcategories */}
                {hasSubcategories && isExpanded && (
                  <div className="absolute top-full left-0 mt-2 bg-white border border-warmOchre/20 rounded-md shadow-lg py-2 min-w-[200px] z-50">
                    {category.subcategories!.map((subcategory) => {
                      const isSubActive = isSubcategoryActive(subcategory.slug, category.slug);
                      return (
                        <Link
                          key={subcategory.id || subcategory.slug}
                          href={`/webshop/${category.slug}/${subcategory.slug}`}
                          className={`block px-4 py-2 text-sm transition-colors ${
                            isSubActive
                              ? 'bg-warmOchre/20 text-deepIndigo font-medium'
                              : 'text-softCharcoal hover:bg-warmIvory hover:text-deepIndigo'
                          }`}
                        >
                          {subcategory.name}
                          {subcategory.productCount !== undefined && subcategory.productCount > 0 && (
                            <span className="ml-2 text-xs opacity-70">
                              ({subcategory.productCount})
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}


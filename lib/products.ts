// Product data for Tanja Unlimited Webshop

export type Variant = {
  key: string;
  sku: string;
  stock: number;
  stripePriceId: string;
  size?: string;
  color?: string;
  status?: 'in_stock' | 'low_stock' | 'out_of_stock';
  outOfStock?: boolean;
  lowStock?: boolean;
  inStock?: boolean;
  priceSEK?: number; // Price in cents from Storefront API
  price?: number; // Price in SEK (converted)
  priceFormatted?: string; // Formatted price string (e.g., "299.00 kr")
};

export type Product = {
  id: string;
  name: string;
  price: number;
  salePrice?: number;
  currency: string;
  category: string;
  description?: string;
  image?: string;
  inStock: boolean;
  stripeProductId?: string;
  stripePriceId?: string;
  variants?: Variant[];
};

export type Category = {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
};

export const categories: Category[] = [
  {
    id: 'tanja-jacket',
    name: 'The Tanja Jacket',
    slug: 'tanja-jacket',
    description: 'Our signature reversible jackets - hand-quilted from antique fabrics. Each piece is unique.',
    icon: 'jacket'
  },
  {
    id: 'lettering-blouse',
    name: 'Tanja Lettering Blouse',
    slug: 'lettering-blouse',
    description: 'Beautiful blouses featuring Tanja\'s original calligraphy artwork.',
    icon: 'shirt'
  },
  {
    id: 'art-cushion',
    name: 'Art Cushion',
    slug: 'art-cushion',
    description: 'Unique art cushions with hand-painted and calligraphy designs.',
    icon: 'pillow'
  },
  {
    id: 'shawls-stoles',
    name: 'Shawls and Stoles',
    slug: 'shawls-stoles',
    description: 'Luxurious cashmere and silk shawls, many featuring calligraphy.',
    icon: 'scarf'
  },
  {
    id: 'carpet-throw',
    name: 'The Tanja Carpet / Throw',
    slug: 'carpet-throw',
    description: 'Hand-quilted carpets and throws made from recycled antique camel blankets.',
    icon: 'rug'
  },
  {
    id: 'ragpicker-denims',
    name: 'Ragpicker Denims',
    slug: 'ragpicker-denims',
    description: 'Unique denim jeans adorned with Indian wedding shawls and embroidered fabrics.',
    icon: 'jeans'
  },
  {
    id: 'csr',
    name: 'Corporate Social Responsibility',
    slug: 'csr',
    description: 'Help Tanja help - 100% of proceeds go to charitable causes in India.',
    icon: 'heart'
  },
  {
    id: 'mixed',
    name: 'Mixed Products',
    slug: 'mixed',
    description: 'Other unique handcrafted items and accessories.',
    icon: 'sparkles'
  }
];

export const products: Product[] = [
  // The Tanja Jacket
  {
    id: 'sjs-001',
    name: 'Short Jacket Silk (SJS)',
    price: 2198,
    currency: 'SEK',
    category: 'tanja-jacket',
    description: 'Hand-quilted silk jacket, reversible with two different fronts',
    image: '/Images/Short Jacket Silk (SJS).webp',
    inStock: true,
    stripeProductId: 'prod_TM8HrnCVZxAkzA',
    stripePriceId: 'price_1SPQ0nP6vvUUervCNY9ApxdL'
  },
  {
    id: 'ljsf-001',
    name: 'Long Jacket Silk Fitted (LJSf)',
    price: 2798,
    currency: 'SEK',
    category: 'tanja-jacket',
    description: 'Fitted long silk jacket, completely reversible',
    image: '/Images/Long Jacket Silk fitted (LJSf).webp',
    inStock: true,
    stripeProductId: 'prod_TM8KNMKe85ZYMM',
    stripePriceId: 'price_1SPQ3cP6vvUUervCRevV3pPO'
  },
  {
    id: 'sjcilw-001',
    name: 'Short Jacket Cotton Imperial Line White (SJCilW)',
    price: 2998,
    currency: 'SEK',
    category: 'tanja-jacket',
    description: 'Cotton jacket in imperial line design, white',
    image: '/Images/Short jacket Cotton Imperial Line White (SJCilW).webp',
    inStock: true,
    stripeProductId: 'prod_TM8ObxolUedP4W',
    stripePriceId: 'price_1SPQ7MP6vvUUervCPTBo0sHM'
  },
  {
    id: 'njcilw-001',
    name: 'Nehru Jacket Cotton Imperial Line White (NJCilW)',
    price: 3998,
    currency: 'SEK',
    category: 'tanja-jacket',
    description: 'Nehru style cotton jacket in imperial line, white',
    image: '/Images/Nehru Jacket Cotton imperial line White (NJCilW).webp',
    inStock: true,
    stripeProductId: 'prod_TM8PR5YzRhLcGo',
    stripePriceId: 'price_1SPQ8KP6vvUUervCFalBRK9b'
  },
  {
    id: 'ljckils-001',
    name: 'Long Jacket Cotton Knee Imperial Line Silver (LJCkilS)',
    price: 6200,
    currency: 'SEK',
    category: 'tanja-jacket',
    description: 'Knee-length cotton jacket in imperial line, silver',
    image: '/Images/Long Jacket Cotton knee imperial line Silver (LJCkilS).webp',
    inStock: true,
    stripeProductId: 'prod_TM8U3Iw6TlUoba',
    stripePriceId: 'price_1SPQDlP6vvUUervCQP2ffvW4'
  },
  {
    id: 'ljcfils-001',
    name: 'Long Jacket Cotton Fitted Imperial Line Silver (LJCfilS)',
    price: 6400,
    currency: 'SEK',
    category: 'tanja-jacket',
    description: 'Fitted long cotton jacket in imperial line, silver',
    image: '/Images/Long Jacket Cotton fitted imperial line Silver (LJCfilS).webp',
    inStock: true,
    stripeProductId: 'prod_TM8WtsmaCpBGLm',
    stripePriceId: 'price_1SPQFTP6vvUUervCCpDjI6u5'
  },
  {
    id: 'ljckilg-001',
    name: 'Long Jacket Cotton Knee Imperial Line Gold (LJCkilG)',
    price: 8200,
    currency: 'SEK',
    category: 'tanja-jacket',
    description: 'Knee-length cotton jacket in imperial line, gold',
    inStock: true
  },
  {
    id: 'ljcfilg-001',
    name: 'Long Jacket Cotton Fitted Imperial Line Gold (LJCfilG)',
    price: 8400,
    currency: 'SEK',
    category: 'tanja-jacket',
    description: 'Fitted long cotton jacket in imperial line, gold',
    inStock: true
  },
  {
    id: 'ljckilp-001',
    name: 'Long Jacket Cotton Knee Imperial Line Platinum (LJCkilP)',
    price: 10500,
    currency: 'SEK',
    category: 'tanja-jacket',
    description: 'Knee-length cotton jacket in imperial line, platinum',
    inStock: true
  },
  {
    id: 'ljcfilp-001',
    name: 'Long Jacket Cotton Fitted Imperial Line Platinum (LJCfilP)',
    price: 10500,
    currency: 'SEK',
    category: 'tanja-jacket',
    description: 'Fitted long cotton jacket in imperial line, platinum',
    inStock: true
  },
  {
    id: 'ljcfild-001',
    name: 'Long Jacket Cotton Fitted Imperial Line Diamond (LJCfilD)',
    price: 14000,
    currency: 'SEK',
    category: 'tanja-jacket',
    description: 'Fitted long cotton jacket in imperial line, diamond collection',
    inStock: true
  },

  // Tanja Lettering Blouse
  {
    id: 'tlb-white-001',
    name: 'Tanja Calligraphy Blouse White',
    price: 898,
    currency: 'SEK',
    category: 'lettering-blouse',
    description: 'White blouse featuring Tanja\'s original calligraphy artwork',
    inStock: true
  },

  // Art Cushions
  {
    id: 'cushion-pine-40x40',
    name: 'Pine Flower - Art Cushion 40x40',
    price: 529,
    currency: 'SEK',
    category: 'art-cushion',
    description: 'Hand-painted pine flower design cushion',
    inStock: true
  },
  {
    id: 'cushion-pine-40x60',
    name: 'Pine Flower - Art Cushion 40x60',
    price: 749,
    currency: 'SEK',
    category: 'art-cushion',
    description: 'Hand-painted pine flower design cushion, larger size',
    inStock: true
  },
  {
    id: 'cushion-iris-40x60',
    name: 'Purple Iris - Art Cushion 40x60',
    price: 749,
    currency: 'SEK',
    category: 'art-cushion',
    description: 'Purple iris design art cushion',
    inStock: true
  },
  {
    id: 'cushion-birthday-40x40',
    name: 'Happy Birthday - Art Cushion 40x40',
    price: 529,
    currency: 'SEK',
    category: 'art-cushion',
    description: 'Calligraphy "Happy Birthday" cushion',
    inStock: true
  },
  {
    id: 'cushion-iris-40x40',
    name: 'Purple Iris - Art Cushion 40x40',
    price: 529,
    currency: 'SEK',
    category: 'art-cushion',
    description: 'Purple iris design art cushion',
    inStock: true
  },
  {
    id: 'cushion-birthday-40x60',
    name: 'Happy Birthday - Art Cushion 40x60',
    price: 749,
    currency: 'SEK',
    category: 'art-cushion',
    description: 'Calligraphy "Happy Birthday" cushion, larger size',
    inStock: true
  },
  {
    id: 'cushion-konkani',
    name: 'Konkani - Unique Hand-Sewn Cushion',
    price: 229,
    currency: 'SEK',
    category: 'art-cushion',
    description: 'Unique hand-sewn cushion with traditional design',
    inStock: true
  },

  // Shawls and Stoles
  {
    id: 'shawl-kani-cashmere',
    name: 'Tanja Lettering Shawl Kani Cashmere',
    price: 1598,
    currency: 'SEK',
    category: 'shawls-stoles',
    description: 'Luxurious Kani cashmere shawl with calligraphy lettering',
    inStock: true
  },
  {
    id: 'shawl-rosa',
    name: 'Tanja Letter Shawl Pink Melange',
    price: 298,
    salePrice: 149,
    currency: 'SEK',
    category: 'shawls-stoles',
    description: 'Pink melange letter shawl - on sale!',
    inStock: true
  },
  {
    id: 'shawl-blue-black',
    name: 'Tanja Letter Shawl Blue Black',
    price: 298,
    salePrice: 149,
    currency: 'SEK',
    category: 'shawls-stoles',
    description: 'Blue and black letter shawl - on sale!',
    inStock: true
  },
  {
    id: 'shawl-black-gold',
    name: 'Tanja Letter Shawl Black Gold',
    price: 298,
    salePrice: 149,
    currency: 'SEK',
    category: 'shawls-stoles',
    description: 'Black and gold letter shawl - on sale!',
    inStock: true
  },
  {
    id: 'shawl-aare-cashmere',
    name: 'Hand Embroidered Shawl - Aare Cashmere',
    price: 3450,
    currency: 'SEK',
    category: 'shawls-stoles',
    description: 'Exquisite hand-embroidered cashmere shawl',
    inStock: true
  },

  // The Tanja Carpet / Throw
  {
    id: 'carpet-001',
    name: 'The Tanja Carpet',
    price: 3998,
    currency: 'SEK',
    category: 'carpet-throw',
    description: 'Made from recycled antique camel blankets - several layers of hand-quilted, beautifully worn cotton fabrics',
    inStock: true
  },

  // Ragpicker Denims
  {
    id: 'denim-damayanti',
    name: 'Damayanti Ragpicker Denims',
    price: 2398,
    currency: 'SEK',
    category: 'ragpicker-denims',
    description: 'Jeans adorned with handicraft from Indian wedding shawls from the 30s and 40s',
    inStock: true
  },
  {
    id: 'denim-adita',
    name: 'Adita Ragpicker Denims',
    price: 2398,
    currency: 'SEK',
    category: 'ragpicker-denims',
    description: 'Jeans patched with old embroidered camel blankets and hand-woven decorations',
    inStock: true
  },

  // Corporate Social Responsibility
  {
    id: 'csr-bracelet',
    name: 'CSR Bracelet - Help Tanja Help',
    price: 100,
    currency: 'SEK',
    category: 'csr',
    description: '100% of proceeds go to charitable causes. Help make a difference!',
    inStock: true
  },
  {
    id: 'csr-ring',
    name: 'CSR Ring - Help Tanja Help',
    price: 100,
    currency: 'SEK',
    category: 'csr',
    description: '100% of proceeds go to charitable causes. Help make a difference!',
    inStock: true
  },
  {
    id: 'csr-scarf',
    name: 'CSR Bandana / Scarf - Help Tanja Help',
    price: 100,
    currency: 'SEK',
    category: 'csr',
    description: '100% of proceeds go to charitable causes. Help make a difference!',
    inStock: true
  }
];

// Helper functions
export function getProductsByCategory(categoryId: string): Product[] {
  return products.filter(p => p.category === categoryId);
}

export function getProductById(id: string): Product | undefined {
  return products.find(p => p.id === id);
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return categories.find(c => c.slug === slug);
}

export function formatPrice(price: number, currency: string = 'SEK'): string {
  return `${currency} ${price.toLocaleString('sv-SE')}`;
}


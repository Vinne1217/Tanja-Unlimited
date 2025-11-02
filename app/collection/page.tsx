import Link from 'next/link';

export const dynamic = 'force-dynamic';

type CollectionCategory = {
  title: string;
  slug: string;
  description: string;
  image?: string;
  colors: string[];
};

export default function CollectionIndex() {
  const collections: CollectionCategory[] = [
    {
      title: 'Tanja Unlimited Collection',
      slug: 'tanja-collection',
      description: 'The bestseller - The Tanja Jacket. Hand-quilted cotton and silk fabrics from Rajasthan. Each jacket is reversible with two fronts. Unique designer garments, silk dresses, pashmina shawls, and calligraphy prints.',
      colors: ['from-fuchsia-500', 'to-purple-600']
    },
    {
      title: 'Tanja Unlimited Outlet',
      slug: 'outlet',
      description: 'Exclusive outlet items at special prices. High-quality scarves, unique pieces, and selected items from previous collections. Limited availability.',
      colors: ['from-blue-500', 'to-cyan-600']
    },
    {
      title: 'Tanja Unlimited Ragpicker Jeans',
      slug: 'ragpicker-jeans',
      description: 'Jeans adorned with handicraft from Indian wedding shawls from the 30s and 40s. Patched with old embroidered camel blankets, hand-woven door decorations and drapes from Rajasthan.',
      colors: ['from-orange-500', 'to-red-600']
    }
  ];

  return (
    <section className="space-y-12">
      {/* Hero section */}
      <div className="text-center space-y-4">
        <h1 className="text-7xl font-bold" style={{
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          color: '#111'
        }}>
          Collection
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Explore our curated collections of hand-crafted textiles, reversible jackets, and unique fashion pieces from India
        </p>
      </div>

      {/* Collection cards */}
      <div className="grid lg:grid-cols-3 gap-8">
        {collections.map((collection, idx) => (
          <Link 
            key={collection.slug} 
            href={`/collection/${collection.slug}`}
            className="group"
          >
            <div className="relative overflow-hidden rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-2">
              {/* Colorful gradient background */}
              <div className={`h-64 bg-gradient-to-br ${collection.colors[0]} ${collection.colors[1]} relative overflow-hidden`}>
                {/* Decorative pattern */}
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: `
                    repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,0.1) 20px, rgba(255,255,255,0.1) 40px),
                    repeating-linear-gradient(-45deg, transparent, transparent 20px, rgba(0,0,0,0.1) 20px, rgba(0,0,0,0.1) 40px)
                  `
                }}></div>
                
                {/* Number badge */}
                <div className="absolute top-6 right-6 w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg">
                  <span className="text-2xl font-bold text-gray-800">{idx + 1}</span>
                </div>
                
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-white/10 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-white text-xl font-bold drop-shadow-lg">View Collection →</span>
                </div>
              </div>
              
              {/* Content */}
              <div className="bg-white p-6 space-y-3">
                <h2 className="text-2xl font-bold text-gray-900 group-hover:text-fuchsia-600 transition">
                  {collection.title}
                </h2>
                <p className="text-gray-600 leading-relaxed">
                  {collection.description}
                </p>
                <div className="pt-3 flex items-center text-fuchsia-600 font-semibold group-hover:gap-3 transition-all">
                  <span>Explore</span>
                  <span className="transform group-hover:translate-x-2 transition-transform">→</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Info section */}
      <div className="bg-gradient-to-br from-cream to-white rounded-2xl p-8 border-l-4 border-fuchsia-500 shadow-lg">
        <h3 className="text-2xl font-bold mb-3">About Our Collections</h3>
        <div className="grid md:grid-cols-2 gap-6 text-gray-700">
          <div>
            <h4 className="font-semibold text-lg mb-2 text-fuchsia-600">✨ Handcrafted Quality</h4>
            <p>Each piece is sewn by Tanja's own seamstresses using hand-quilted fabrics that were previously worn as camel blankets or saris by the women of Rajasthan, India.</p>
          </div>
          <div>
            <h4 className="font-semibold text-lg mb-2 text-blue-600">🔄 Reversible Design</h4>
            <p>The famous Tanja Jacket is completely reversible with two different fronts - you get two unique jackets in one!</p>
          </div>
          <div>
            <h4 className="font-semibold text-lg mb-2 text-orange-600">🌍 Sustainable Fashion</h4>
            <p>We transform antique fabrics and textiles into modern, wearable art. Each piece tells a story and helps preserve traditional craftsmanship.</p>
          </div>
          <div>
            <h4 className="font-semibold text-lg mb-2 text-green-600">💎 One-of-a-Kind</h4>
            <p>Because we use vintage and antique materials, each item is truly unique. No two pieces are exactly alike.</p>
          </div>
        </div>
      </div>
    </section>
  );
}



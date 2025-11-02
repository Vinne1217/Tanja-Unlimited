import Link from 'next/link';

export default function AboutPage() {
  return (
    <section className="max-w-6xl mx-auto space-y-12">
      {/* Hero */}
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold" style={{
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic'
        }}>
          About Tanja Unlimited
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Discover our story, values, and commitment to sustainable fashion and craftsmanship
        </p>
      </div>

      {/* Quick Links */}
      <div className="grid md:grid-cols-4 gap-4">
        <Link href="/about/press" className="bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white rounded-xl p-6 hover:shadow-xl transition text-center">
          <span className="text-3xl mb-2 block">📰</span>
          <h3 className="font-bold text-lg">Press</h3>
        </Link>
        <Link href="/about/webshop-info" className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white rounded-xl p-6 hover:shadow-xl transition text-center">
          <span className="text-3xl mb-2 block">🛍️</span>
          <h3 className="font-bold text-lg">Webshop Info</h3>
        </Link>
        <Link href="/about/tanja-in-india" className="bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-xl p-6 hover:shadow-xl transition text-center">
          <span className="text-3xl mb-2 block">🇮🇳</span>
          <h3 className="font-bold text-lg">Tanja in India</h3>
        </Link>
        <Link href="/sister-unlimited" className="bg-gradient-to-br from-green-500 to-emerald-600 text-white rounded-xl p-6 hover:shadow-xl transition text-center">
          <span className="text-3xl mb-2 block">👥</span>
          <h3 className="font-bold text-lg">Sister Unlimited</h3>
        </Link>
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-2xl p-8 shadow-lg space-y-6">
        <h2 className="text-3xl font-bold">Our Story</h2>
        <p className="text-gray-700 leading-relaxed">
          Tanja Unlimited offers unique fashion pieces handcrafted from textiles with a rich history. Our signature piece, The Tanja Jacket, is sewn by our own seamstresses from hand-quilted cotton or silk fabrics that were previously worn by the women of Rajasthan, India, as camel blankets or saris.
        </p>
        <p className="text-gray-700 leading-relaxed">
          Each Tanja jacket is completely reversible with two different fronts - giving you two unique jackets in one. We also create the Tanja rug from recycled antique camel blankets, featuring several layers of hand-quilted, beautifully worn cotton fabrics.
        </p>
      </div>

      {/* Values */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-3 text-fuchsia-600">🌱 Sustainability</h3>
          <p className="text-gray-700">
            We give new life to antique fabrics and textiles, reducing waste while preserving traditional craftsmanship and cultural heritage.
          </p>
        </div>
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-3 text-blue-600">✋ Handcrafted</h3>
          <p className="text-gray-700">
            Every piece is carefully made by skilled artisans, ensuring exceptional quality and attention to detail in each unique item.
          </p>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6">
          <h3 className="text-xl font-bold mb-3 text-orange-600">🎨 Artistic</h3>
          <p className="text-gray-700">
            Our designs blend traditional Indian textiles with modern Scandinavian aesthetics, featuring Tanja's original calligraphy artwork.
          </p>
        </div>
      </div>

      {/* Location */}
      <div className="bg-gradient-to-br from-indigoDeep to-indigoDeep/80 rounded-2xl p-8 text-white">
        <h3 className="text-3xl font-bold mb-4">Visit Us</h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-xl mb-3 text-ochreRed">Göteborg Store</h4>
            <p className="text-cream mb-4">
              Molinsgatan 13<br/>
              411 33 Göteborg<br/>
              Sweden
            </p>
            <a 
              href="http://maps.google.se/maps?q=Molinsgatan+13,+Göteborg" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-block px-6 py-2 bg-ochreRed text-white rounded-full hover:bg-white hover:text-ochreRed transition"
            >
              📍 View on Map
            </a>
          </div>
          <div>
            <h4 className="font-semibold text-xl mb-3 text-ochreRed">Sold At</h4>
            <ul className="text-cream space-y-2">
              <li>• Bra Under i Focus, Göteborg</li>
              <li>• European Trade Fairs</li>
              <li>• Online at shop.tanjaunlimited.se</li>
            </ul>
            <p className="text-cream mt-4">
              Ring Tanja Kisker: <a href="tel:+46706332220" className="text-ochreRed font-bold">0706332220</a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}


export default function HomePage() {
  return (
    <section className="max-w-7xl mx-auto space-y-16">
      {/* Hero */}
      <div className="relative bg-gradient-to-br from-pink-400 via-purple-500 to-blue-500 rounded-3xl p-16 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-yellow-400 opacity-20 rounded-full blur-3xl -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-green-400 opacity-20 rounded-full blur-3xl -ml-40 -mb-40"></div>
        
        <div className="relative z-10 text-center text-white">
          <h1 className="text-7xl font-black mb-6 drop-shadow-2xl">Tanja Unlimited</h1>
          <p className="text-3xl font-bold mb-4 drop-shadow-lg">Art-Forward Fashion from Rajasthan</p>
          <p className="text-xl max-w-3xl mx-auto leading-relaxed drop-shadow-lg">
            Hand-quilted jackets, calligraphy designs, and sustainable textiles. Each piece is reversible, unique, and tells a story.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <a href="/collection" className="px-8 py-4 bg-white text-fuchsia-600 rounded-full hover:bg-yellow-400 hover:text-indigoDeep transition font-bold shadow-xl text-lg">
              🛍️ Shop Collection
            </a>
            <a href="/events" className="px-8 py-4 bg-yellow-400 text-indigoDeep rounded-full hover:bg-white transition font-bold shadow-xl text-lg">
              📅 2025 Events
            </a>
          </div>
        </div>
      </div>

      {/* The Tanja Jacket - Featured */}
      <div className="bg-gradient-to-br from-cream to-white rounded-3xl p-12 shadow-xl border-4 border-fuchsia-200">
        <div className="text-center mb-8">
          <h2 className="text-5xl font-bold mb-4">The Tanja Jacket</h2>
          <p className="text-xl text-gray-600">Our Bestseller - Reversible & Unique</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-fuchsia-600">Die Tanja Jacke / Tanja-jackan</h3>
            <p className="text-gray-700 leading-relaxed">
              Sewn from hand-quilted cotton or silk fabrics that were previously worn by the women of Rajasthan, India, as camel blankets or saris. Each jacket is completely reversible with two different fronts - you get two unique jackets in one!
            </p>
            <p className="text-gray-700 leading-relaxed">
              The latest collection also includes the Tanja rug, made from recycled antique camel blankets – several layers of hand-quilted, beautifully worn cotton fabrics.
            </p>
          </div>
          <div className="bg-gradient-to-br from-fuchsia-100 to-purple-100 rounded-xl p-8">
            <h4 className="text-xl font-bold mb-4">Where to Buy</h4>
            <ul className="space-y-3 text-gray-700">
              <li>🏪 Trade fairs across Europe</li>
              <li>🏬 Bra Under i Focus, Göteborg</li>
              <li>🏠 Tanja Unlimited Atelier, Göteborg</li>
              <li>🌐 Online - contact us for orders</li>
            </ul>
            <a href="/collection" className="inline-block mt-6 px-6 py-3 bg-fuchsia-600 text-white rounded-full hover:bg-fuchsia-700 transition font-bold">
              View Collection →
            </a>
          </div>
        </div>
      </div>

      {/* Quick Links Grid */}
      <div className="grid md:grid-cols-3 gap-6">
        <a href="/collection" className="bg-white border-2 border-fuchsia-200 rounded-2xl p-8 hover:shadow-2xl hover:border-fuchsia-400 transition group">
          <div className="text-5xl mb-4">👗</div>
          <h3 className="text-2xl font-bold mb-2 group-hover:text-fuchsia-600 transition">Collection</h3>
          <p className="text-gray-600">Jackets, Ragpicker Denims, scarves, dresses, and unique pieces</p>
        </a>
        
        <a href="/hand-lettering" className="bg-white border-2 border-blue-200 rounded-2xl p-8 hover:shadow-2xl hover:border-blue-400 transition group">
          <div className="text-5xl mb-4">✍️</div>
          <h3 className="text-2xl font-bold mb-2 group-hover:text-blue-600 transition">Hand Lettering</h3>
          <p className="text-gray-600">Calligraphy services and distance learning courses</p>
        </a>
        
        <a href="/events" className="bg-white border-2 border-orange-200 rounded-2xl p-8 hover:shadow-2xl hover:border-orange-400 transition group">
          <div className="text-5xl mb-4">🎪</div>
          <h3 className="text-2xl font-bold mb-2 group-hover:text-orange-600 transition">Exhibitions</h3>
          <p className="text-gray-600">Meet us at fairs across Europe in 2025</p>
        </a>
      </div>

      {/* About Section */}
      <div className="bg-white rounded-2xl p-10 shadow-xl">
        <h2 className="text-4xl font-bold mb-6 text-center">Our Collections</h2>
        <p className="text-center text-gray-600 text-lg mb-8 max-w-3xl mx-auto">
          Tanja Unlimited offers the largest selection of high-quality silk and cashmere scarves in Sweden. We sell unique designer garments made from antique fabrics, silk dresses, genuine pashmina shawls, and antique suzani shawls.
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-6">
            <h4 className="font-bold text-lg mb-2 text-fuchsia-600">🎨 Calligraphy Designs</h4>
            <p className="text-gray-700 text-sm">
              Tanja's original calligraphy artwork on blouses, tunics, handbags, phone cases, iPad cases, wallets, pillows, and scarves.
            </p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-6">
            <h4 className="font-bold text-lg mb-2 text-blue-600">🔄 Reversible Jackets</h4>
            <p className="text-gray-700 text-sm">
              Each Tanja Jacket has two fronts - two different jackets in one! Hand-quilted by our seamstresses.
            </p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-6">
            <h4 className="font-bold text-lg mb-2 text-orange-600">♻️ Upcycled Materials</h4>
            <p className="text-gray-700 text-sm">
              Antique camel blankets and vintage saris from the 1930s-1940s transformed into modern fashion.
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6">
            <h4 className="font-bold text-lg mb-2 text-green-600">🌍 Global Reach</h4>
            <p className="text-gray-700 text-sm">
              Our range is growing - showcased at European trade fairs and available worldwide.
            </p>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-br from-indigoDeep to-purple-900 rounded-3xl p-12 text-white text-center shadow-2xl">
        <h2 className="text-4xl font-bold mb-4">Visit Us or Shop Online</h2>
        <p className="text-cream text-xl mb-8 max-w-2xl mx-auto">
          För möjligheten att titta, prova, handla - ring Tanja Kisker eller besök shop.tanjaunlimited.se
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a href="tel:+46706332220" className="px-8 py-4 bg-ochreRed text-white rounded-full hover:bg-white hover:text-ochreRed transition font-bold shadow-lg text-lg">
            📞 0706332220
          </a>
          <a href="/book" className="px-8 py-4 bg-white text-indigoDeep rounded-full hover:bg-yellow-400 transition font-bold shadow-lg text-lg">
            📅 Book Appointment
          </a>
          <a href="https://www.facebook.com/tanjaunlimited" target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition font-bold shadow-lg text-lg">
            Follow on Facebook
          </a>
        </div>
      </div>
    </section>
  );
}



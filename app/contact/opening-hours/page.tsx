'use client';

// Mark as dynamic to support client-side rendering
export const dynamic = 'force-dynamic';

export default function OpeningHoursPage() {
  return (
    <section className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-5xl font-bold mb-6">Öppettider / Opening Hours</h1>
      
      <div className="bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 rounded-2xl p-12 shadow-xl text-center">
        <h2 className="text-4xl font-bold mb-6">By Appointment Only</h2>
        <p className="text-xl text-gray-700 mb-8">
          Vi har öppet efter överenskommelse / We are open by appointment
        </p>
        
        <div className="bg-white rounded-xl p-6 shadow-lg inline-block">
          <p className="text-gray-700 mb-4 text-lg">
            För möjligheten att titta, prova, handla:
          </p>
          <p className="text-gray-700 mb-6">
            Ring Tanja Kisker: <a href="tel:+46706332220" className="text-fuchsia-600 font-bold text-xl">0706332220</a>
          </p>
          <p className="text-gray-600 text-sm">
            eller besök <a href="https://shop.tanjaunlimited.se" className="text-blue-600 underline">shop.tanjaunlimited.se</a>
          </p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h3 className="text-2xl font-bold mb-4 text-fuchsia-600">🏠 Atelier Göteborg</h3>
          <p className="text-gray-700 mb-4">
            Visit our studio in Göteborg for a personalized shopping experience
          </p>
          <p className="font-semibold text-gray-800">
            Molinsgatan 13<br/>
            411 33 Göteborg<br/>
            Sweden
          </p>
          <a 
            href="http://maps.google.se/maps?q=Molinsgatan+13,+Göteborg" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block mt-4 px-6 py-2 bg-fuchsia-600 text-white rounded-full hover:bg-fuchsia-700 transition"
          >
            📍 View on Map
          </a>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg">
          <h3 className="text-2xl font-bold mb-4 text-blue-600">🎪 At Trade Fairs</h3>
          <p className="text-gray-700 mb-4">
            Meet us at exhibitions across Europe throughout 2025
          </p>
          <p className="text-gray-700 mb-4">
            Följ oss på Facebook för uppdatering av Tanja Unlimited's whereabouts!
          </p>
          <a 
            href="/events" 
            className="inline-block px-6 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition"
          >
            View Events Calendar →
          </a>
        </div>
      </div>

      <div className="bg-gradient-to-br from-orange-100 to-red-100 rounded-2xl p-8 shadow-lg">
        <h3 className="text-2xl font-bold mb-4">Also Sold At:</h3>
        <ul className="space-y-2 text-gray-700 text-lg">
          <li>📍 <strong>Bra Under i Focus</strong>, Göteborg</li>
          <li>📍 <strong>Tanja Unlimited Atelier</strong>, Göteborg</li>
          <li>🌍 European Trade Fairs and Exhibitions</li>
        </ul>
      </div>

      <div className="bg-gradient-to-br from-indigoDeep to-purple-900 rounded-2xl p-8 text-white text-center">
        <h3 className="text-2xl font-bold mb-4">Book Your Visit Today</h3>
        <p className="text-cream mb-6">
          Schedule a private viewing or ask questions about our collection
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a href="/book" className="px-6 py-3 bg-ochreRed text-white rounded-full hover:bg-white hover:text-ochreRed transition font-semibold">
            📅 Book Appointment
          </a>
          <a href="https://wa.me/46706332220" target="_blank" rel="noopener noreferrer" className="px-6 py-3 bg-white text-indigoDeep rounded-full hover:bg-green-500 hover:text-white transition font-semibold">
            💬 WhatsApp Us
          </a>
        </div>
      </div>
    </section>
  );
}


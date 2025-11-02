export default function WebshopPage() {
  return (
    <section className="max-w-4xl mx-auto space-y-8 text-center">
      <h1 className="text-5xl font-bold mb-6">Webshop</h1>
      
      <div className="bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100 rounded-2xl p-12 shadow-xl">
        <h2 className="text-3xl font-bold mb-6">Buy Online</h2>
        
        <div className="space-y-6 text-lg">
          <div className="bg-white/80 rounded-xl p-6">
            <p className="font-semibold mb-2">🇬🇧 For orders and enquiries in the webshop:</p>
            <p>Please contact Tanja Kisker at <a href="mailto:info@tanjaunlimited.se" className="text-fuchsia-600 font-bold">info@tanjaunlimited.se</a> or <a href="tel:+46706332220" className="text-fuchsia-600 font-bold">+46706332220</a></p>
          </div>
          
          <div className="bg-white/80 rounded-xl p-6">
            <p className="font-semibold mb-2">🇩🇪 Für Bestellungen und Anfragen im Webshop:</p>
            <p>Kontaktieren Sie bitte Tanja Kisker unter <a href="mailto:info@tanjaunlimited.se" className="text-fuchsia-600 font-bold">info@tanjaunlimited.se</a> oder <a href="tel:+46706332220" className="text-fuchsia-600 font-bold">+46706332220</a></p>
          </div>
          
          <div className="bg-white/80 rounded-xl p-6">
            <p className="font-semibold mb-2">🇸🇪 För beställningar och frågor om köp i webbshoppen:</p>
            <p>Kontakta Tanja Kisker på <a href="mailto:info@tanjaunlimited.se" className="text-fuchsia-600 font-bold">info@tanjaunlimited.se</a> eller <a href="tel:+46706332220" className="text-fuchsia-600 font-bold">+46706332220</a></p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <a href="tel:+46706332220" className="px-8 py-4 bg-fuchsia-600 text-white rounded-full hover:bg-fuchsia-700 transition font-bold text-lg shadow-lg">
            📞 Call Us
          </a>
          <a href="mailto:info@tanjaunlimited.se" className="px-8 py-4 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition font-bold text-lg shadow-lg">
            ✉️ Email Us
          </a>
          <a href="https://wa.me/46706332220" target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-green-600 text-white rounded-full hover:bg-green-700 transition font-bold text-lg shadow-lg">
            💬 WhatsApp
          </a>
        </div>
      </div>

      <div className="bg-white rounded-xl p-8 shadow-lg">
        <h3 className="text-2xl font-bold mb-4">Browse Our Collections</h3>
        <p className="text-gray-600 mb-6">Explore our unique handcrafted items and contact us to place your order</p>
        <a href="/collection" className="inline-block px-6 py-3 bg-ochreRed text-white rounded-full hover:bg-indigoDeep transition font-semibold">
          View Collections →
        </a>
      </div>
    </section>
  );
}


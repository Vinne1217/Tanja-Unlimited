export default function WebshopInfoPage() {
  return (
    <section className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-5xl font-bold mb-6">Webshop Information</h1>
      
      <div className="grid md:grid-cols-3 gap-6">
        <a href="#terms" className="bg-gradient-to-br from-fuchsia-500 to-purple-600 text-white rounded-xl p-6 hover:shadow-xl transition text-center">
          <span className="text-3xl mb-2 block">📜</span>
          <h3 className="font-bold">Villkor & Information</h3>
        </a>
        <a href="#payment" className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white rounded-xl p-6 hover:shadow-xl transition text-center">
          <span className="text-3xl mb-2 block">💳</span>
          <h3 className="font-bold">Betalningsmetoder</h3>
        </a>
        <a href="#returns" className="bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-xl p-6 hover:shadow-xl transition text-center">
          <span className="text-3xl mb-2 block">↩️</span>
          <h3 className="font-bold">Returer</h3>
        </a>
      </div>

      <div id="terms" className="bg-white rounded-2xl p-8 shadow-lg space-y-4">
        <h2 className="text-3xl font-bold text-fuchsia-600">Villkor & Information</h2>
        <p className="text-gray-700 leading-relaxed">
          All items in our webshop are unique, handcrafted pieces. Due to the nature of upcycled materials, each product is one-of-a-kind and may vary slightly from photos.
        </p>
        <ul className="space-y-2 text-gray-700">
          <li>• All prices are in SEK and include Swedish VAT</li>
          <li>• Orders are processed within 1-3 business days</li>
          <li>• Shipping times vary by destination</li>
          <li>• For custom orders, please allow additional time</li>
        </ul>
      </div>

      <div id="payment" className="bg-white rounded-2xl p-8 shadow-lg space-y-4">
        <h2 className="text-3xl font-bold text-blue-600">Betalningsmetoder</h2>
        <p className="text-gray-700 leading-relaxed">
          We accept the following payment methods for your convenience:
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="font-semibold">💳 Credit/Debit Cards</p>
            <p className="text-sm text-gray-600">Visa, Mastercard, American Express</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="font-semibold">🏦 Bank Transfer</p>
            <p className="text-sm text-gray-600">Direct bank transfer available</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="font-semibold">📱 Swish</p>
            <p className="text-sm text-gray-600">Swedish mobile payment</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="font-semibold">✉️ Invoice</p>
            <p className="text-sm text-gray-600">Available for Swedish customers</p>
          </div>
        </div>
      </div>

      <div id="returns" className="bg-white rounded-2xl p-8 shadow-lg space-y-4">
        <h2 className="text-3xl font-bold text-orange-600">Returer</h2>
        <p className="text-gray-700 leading-relaxed">
          We want you to be completely satisfied with your purchase. If you need to return an item:
        </p>
        <ul className="space-y-2 text-gray-700">
          <li>• 14-day return policy from delivery date</li>
          <li>• Items must be unworn and in original condition</li>
          <li>• Contact us before returning: <a href="mailto:info@tanjaunlimited.se" className="text-orange-600 font-bold">info@tanjaunlimited.se</a></li>
          <li>• Return shipping costs are the customer's responsibility</li>
          <li>• Refunds processed within 7 days of receiving return</li>
        </ul>
      </div>

      <div className="bg-gradient-to-br from-indigoDeep to-indigoDeep/80 rounded-2xl p-8 text-white text-center">
        <h3 className="text-2xl font-bold mb-4">Questions?</h3>
        <p className="text-cream mb-6">
          Contact us for any questions about orders, shipping, or returns
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a href="tel:+46706332220" className="px-6 py-3 bg-ochreRed text-white rounded-full hover:bg-white hover:text-ochreRed transition font-semibold">
            📞 +46 70 633 22 20
          </a>
          <a href="mailto:info@tanjaunlimited.se" className="px-6 py-3 bg-white text-indigoDeep rounded-full hover:bg-ochreRed hover:text-white transition font-semibold">
            ✉️ Email Us
          </a>
        </div>
      </div>
    </section>
  );
}


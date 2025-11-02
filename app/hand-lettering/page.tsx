export default function HandLetteringPage() {
  return (
    <section className="max-w-6xl mx-auto space-y-12">
      {/* Hero */}
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold" style={{
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic'
        }}>
          Hand Lettering & Calligraphy
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          Beautiful hand-lettered designs and professional calligraphy services by Tanja Kisker
        </p>
      </div>

      {/* Services */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-2xl p-8 shadow-lg">
          <h2 className="text-3xl font-bold mb-4 text-fuchsia-600">Uppdrag Handtextning</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Professional hand lettering for special projects, invitations, logos, and custom designs. Each piece is carefully crafted with attention to detail and artistic flair.
          </p>
          <ul className="space-y-2 text-gray-700">
            <li>✓ Wedding invitations</li>
            <li>✓ Event signage</li>
            <li>✓ Logo design</li>
            <li>✓ Custom artwork</li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 shadow-lg">
          <h2 className="text-3xl font-bold mb-4 text-blue-600">Distansutbildning i Reklamtexning</h2>
          <p className="text-gray-700 leading-relaxed mb-4">
            Distance learning course in commercial hand lettering. Learn the art of beautiful handwriting and calligraphy from anywhere.
          </p>
          <ul className="space-y-2 text-gray-700">
            <li>✓ Online instruction</li>
            <li>✓ Flexible schedule</li>
            <li>✓ Personal feedback</li>
            <li>✓ Certificate upon completion</li>
          </ul>
        </div>
      </div>

      {/* Portfolio */}
      <div className="bg-white rounded-2xl p-8 shadow-lg">
        <h2 className="text-3xl font-bold mb-6">Our Calligraphy Designs</h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          Tanja Unlimited prints our own designs, which we then tailor or transform into high-quality products. The motifs are mainly taken from Tanja Kisker's calligraphy. These designs can be found on:
        </p>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-fuchsia-100 to-pink-100 rounded-lg p-4 text-center">
            <span className="text-2xl mb-2 block">👕</span>
            <p className="font-semibold">Blouses & Tunics</p>
          </div>
          <div className="bg-gradient-to-br from-blue-100 to-cyan-100 rounded-lg p-4 text-center">
            <span className="text-2xl mb-2 block">👜</span>
            <p className="font-semibold">Handbags</p>
          </div>
          <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg p-4 text-center">
            <span className="text-2xl mb-2 block">📱</span>
            <p className="font-semibold">Phone & iPad Cases</p>
          </div>
          <div className="bg-gradient-to-br from-orange-100 to-red-100 rounded-lg p-4 text-center">
            <span className="text-2xl mb-2 block">🧣</span>
            <p className="font-semibold">Scarves & Pillows</p>
          </div>
        </div>
      </div>

      {/* Contact CTA */}
      <div className="bg-gradient-to-br from-indigoDeep to-indigoDeep/80 rounded-2xl p-8 text-white text-center shadow-2xl">
        <h3 className="text-3xl font-bold mb-4">Interested in Hand Lettering Services?</h3>
        <p className="text-cream text-lg mb-6">
          Contact Tanja Kisker to discuss your project or enroll in our distance learning course
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a href="tel:+46706332220" className="px-6 py-3 bg-ochreRed text-white rounded-full hover:bg-white hover:text-ochreRed transition font-semibold shadow-lg">
            📞 Call +46 70 633 22 20
          </a>
          <a href="mailto:info@tanjaunlimited.se" className="px-6 py-3 bg-white text-indigoDeep rounded-full hover:bg-ochreRed hover:text-white transition font-semibold shadow-lg">
            ✉️ Email Us
          </a>
        </div>
      </div>
    </section>
  );
}


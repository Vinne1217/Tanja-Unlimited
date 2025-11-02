import ContactForm from '@/components/ContactForm';

export default function BookPage() {
  return (
    <section className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold">Book an Appointment</h1>
        <p className="text-xl text-gray-600">
          Schedule a private viewing, atelier visit, or consultation with Tanja Kisker
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-gradient-to-br from-fuchsia-50 to-purple-50 rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-fuchsia-600">📅 Private Viewing</h2>
          <p className="text-gray-700 mb-4">
            Book a private appointment to see our collection in person at our Göteborg atelier
          </p>
          <ul className="space-y-2 text-gray-700">
            <li>✓ One-on-one attention</li>
            <li>✓ Try on garments</li>
            <li>✓ Expert styling advice</li>
            <li>✓ Flexible scheduling</li>
          </ul>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-2xl p-8 shadow-lg">
          <h2 className="text-2xl font-bold mb-4 text-blue-600">🎨 Consultation</h2>
          <p className="text-gray-700 mb-4">
            Discuss custom orders, hand lettering projects, or special commissions
          </p>
          <ul className="space-y-2 text-gray-700">
            <li>✓ Custom designs</li>
            <li>✓ Bespoke tailoring</li>
            <li>✓ Calligraphy projects</li>
            <li>✓ Corporate orders</li>
          </ul>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-8 shadow-xl">
        <h3 className="text-2xl font-bold mb-6 text-center">Request a Booking</h3>
        <ContactForm />
        <p className="text-center text-sm text-gray-600 mt-6">
          Or call/WhatsApp directly: <a href="tel:+46706332220" className="text-fuchsia-600 font-bold">+46 70 633 22 20</a>
        </p>
      </div>

      <div className="bg-gradient-to-br from-indigoDeep to-indigoDeep/80 rounded-2xl p-8 text-white text-center">
        <h3 className="text-2xl font-bold mb-4">Opening Hours</h3>
        <p className="text-cream text-lg mb-4">By appointment only</p>
        <p className="text-cream">
          Contact us to schedule your visit at a time that works for you
        </p>
      </div>
    </section>
  );
}


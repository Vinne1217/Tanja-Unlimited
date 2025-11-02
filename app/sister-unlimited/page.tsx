import ContactForm from '@/components/ContactForm';
import Link from 'next/link';

export default function SisterUnlimitedPage() {
  return (
    <section className="max-w-6xl mx-auto space-y-12">
      {/* Hero */}
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold bg-gradient-to-r from-fuchsia-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
          Sister Unlimited
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          A community of empowerment, creativity, and collaboration
        </p>
      </div>

      {/* What is Sister Unlimited */}
      <div className="bg-gradient-to-br from-fuchsia-100 via-pink-100 to-purple-100 rounded-2xl p-10 shadow-xl">
        <h2 className="text-4xl font-bold mb-6 text-fuchsia-700">What is Sister Unlimited?</h2>
        <p className="text-gray-800 leading-relaxed text-lg mb-4">
          Sister Unlimited is more than a concept - it's a movement of women supporting women through creativity, entrepreneurship, and shared experiences. Join us for workshops, networking events, and collaborative projects that celebrate individuality and sisterhood.
        </p>
        <p className="text-gray-700 leading-relaxed">
          Whether you're an artist, entrepreneur, or simply looking for a community of like-minded individuals, Sister Unlimited welcomes you to connect, create, and grow together.
        </p>
      </div>

      {/* How to become a Sister */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-2xl p-8 shadow-lg border-t-4 border-fuchsia-500">
          <h3 className="text-2xl font-bold mb-4 text-fuchsia-600">Hur jag blir en Sister Unlimited</h3>
          <p className="text-gray-700 leading-relaxed mb-6">
            Becoming a Sister Unlimited means joining a supportive network where creativity and collaboration thrive.
          </p>
          <ul className="space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="text-fuchsia-600 font-bold">1.</span>
              <span>Attend one of our events or workshops</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-fuchsia-600 font-bold">2.</span>
              <span>Connect with existing members</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-fuchsia-600 font-bold">3.</span>
              <span>Participate in collaborative projects</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-fuchsia-600 font-bold">4.</span>
              <span>Share your unique talents and skills</span>
            </li>
          </ul>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-lg border-t-4 border-purple-500">
          <h3 className="text-2xl font-bold mb-4 text-purple-600">Boka ditt datum idag</h3>
          <p className="text-gray-700 leading-relaxed mb-6">
            Book your date for a Sister Unlimited event, workshop, or collaborative session. We host regular gatherings for networking, creative projects, and mutual support.
          </p>
          <ContactForm />
        </div>
      </div>

      {/* Events & Activities */}
      <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-8 shadow-lg">
        <h3 className="text-3xl font-bold mb-6 text-center">Sister Unlimited Activities</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl p-6 text-center">
            <span className="text-4xl mb-3 block">🎨</span>
            <h4 className="font-bold text-lg mb-2">Creative Workshops</h4>
            <p className="text-gray-600 text-sm">Textile arts, calligraphy, and design sessions</p>
          </div>
          <div className="bg-white rounded-xl p-6 text-center">
            <span className="text-4xl mb-3 block">🤝</span>
            <h4 className="font-bold text-lg mb-2">Networking Events</h4>
            <p className="text-gray-600 text-sm">Connect with fellow entrepreneurs and creatives</p>
          </div>
          <div className="bg-white rounded-xl p-6 text-center">
            <span className="text-4xl mb-3 block">💡</span>
            <h4 className="font-bold text-lg mb-2">Collaborative Projects</h4>
            <p className="text-gray-600 text-sm">Work together on meaningful initiatives</p>
          </div>
        </div>
      </div>

      {/* Contact */}
      <div className="bg-gradient-to-br from-indigoDeep to-purple-900 rounded-2xl p-8 text-white text-center shadow-2xl">
        <h3 className="text-3xl font-bold mb-4">Join the Sisterhood</h3>
        <p className="text-cream text-lg mb-6">
          Ready to become part of Sister Unlimited? Contact us to learn more and book your first session
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <a href="tel:+46706332220" className="px-8 py-3 bg-fuchsia-600 text-white rounded-full hover:bg-white hover:text-fuchsia-600 transition font-bold shadow-lg">
            📞 Call Tanja
          </a>
          <a href="mailto:info@tanjaunlimited.se" className="px-8 py-3 bg-white text-indigoDeep rounded-full hover:bg-fuchsia-600 hover:text-white transition font-bold shadow-lg">
            ✉️ Email Us
          </a>
          <a href="/book" className="px-8 py-3 bg-purple-600 text-white rounded-full hover:bg-purple-700 transition font-bold shadow-lg">
            📅 Book Now
          </a>
        </div>
      </div>
    </section>
  );
}




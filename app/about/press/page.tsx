export default function PressPage() {
  return (
    <section className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-5xl font-bold mb-6">Press & Media</h1>
      
      <div className="bg-white rounded-2xl p-8 shadow-lg space-y-6">
        <h2 className="text-3xl font-bold">Media Contact</h2>
        <p className="text-gray-700 leading-relaxed">
          For press inquiries, interviews, or media collaborations, please contact:
        </p>
        <div className="bg-gradient-to-br from-fuchsia-50 to-purple-50 rounded-xl p-6">
          <p className="font-semibold text-lg">Tanja Kisker</p>
          <p className="text-gray-700">Founder & Creative Director</p>
          <p className="mt-4">
            Email: <a href="mailto:info@tanjaunlimited.se" className="text-fuchsia-600 font-bold">info@tanjaunlimited.se</a><br/>
            Phone: <a href="tel:+46706332220" className="text-fuchsia-600 font-bold">+46 70 633 22 20</a>
          </p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-pink-100 to-purple-100 rounded-2xl p-8 shadow-lg">
        <h3 className="text-2xl font-bold mb-4">About Tanja Unlimited</h3>
        <p className="text-gray-700 leading-relaxed mb-4">
          Tanja Unlimited creates unique, sustainable fashion from handcrafted textiles sourced from Rajasthan, India. Each piece tells a story, transforming antique camel blankets and wedding saris into modern, reversible jackets and designer garments.
        </p>
        <p className="text-gray-700 leading-relaxed">
          Founded by Swedish designer and calligrapher Tanja Kisker, the brand bridges traditional Indian craftsmanship with Scandinavian design sensibility, creating one-of-a-kind pieces that celebrate cultural heritage and sustainability.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow">
          <h4 className="font-bold text-lg mb-3">🌍 International Presence</h4>
          <p className="text-gray-700 text-sm">Showcased at major European trade fairs and exhibitions</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow">
          <h4 className="font-bold text-lg mb-3">🤝 SCCI Member</h4>
          <p className="text-gray-700 text-sm">Swedish Chamber of Commerce India member</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow">
          <h4 className="font-bold text-lg mb-3">♻️ Sustainable</h4>
          <p className="text-gray-700 text-sm">Upcycling antique textiles into modern fashion</p>
        </div>
        <div className="bg-white rounded-xl p-6 shadow">
          <h4 className="font-bold text-lg mb-3">✋ Handcrafted</h4>
          <p className="text-gray-700 text-sm">Each piece individually made by skilled artisans</p>
        </div>
      </div>
    </section>
  );
}


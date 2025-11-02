type Event = {
  title: string;
  dates: string;
  location: string;
  country?: string;
  address: string;
  isPast?: boolean;
};

export default function EventsPage() {
  const events: Event[] = [
    { title: 'Sy- och Hantverksfestivalen', dates: '21-23 februari', location: 'Stockholm', address: 'Stockholmsmässan, Mässvägen 1, 125 80 Älvsjö, Sweden' },
    { title: 'Handwerk & Design', dates: '12-16 mars', location: 'München', country: 'TYSKLAND', address: 'Messe München, Am Messesee 2, 81829 München, Germany' },
    { title: 'Gewerbemesse Manching', dates: '11-13 april', location: 'Ingolstadt', country: 'TYSKLAND', address: 'Ingolstadt, Germany' },
    { title: 'Fair Handeln 2025', dates: '24-27 april', location: 'Stuttgart', country: 'TYSKLAND', address: 'Messe Stuttgart, Messepiazza 1, 70629 Stuttgart, Germany' },
    { title: 'Sy- och Hantverksfestivalen', dates: '25-27 april', location: 'Malmö', address: 'Malmö Mässan, Mässgatan 6, 215 32 Malmö, Sweden' },
    { title: 'Landpartie Schloss Monrepos', dates: '22-25 maj', location: 'Ludwigsburg', country: 'TYSKLAND', address: 'Schloss Monrepos, 71634 Ludwigsburg, Germany' },
    { title: 'Park & Garden', dates: '5-9 juni', location: 'Stockseehof', country: 'TYSKLAND', address: 'Gut Stockseehof, Stocksee, Germany' },
    { title: 'Landpartie Schloss Lembeck', dates: '19-22 juni', location: 'Lembeck', country: 'TYSKLAND', address: 'Schloss Lembeck, Schloss 1, 46286 Dorsten-Lembeck, Germany' },
    { title: 'SY Göteborg', dates: '29-31 augusti', location: 'Åby Arena, Göteborg', address: 'Åby Arena, Heden, Göteborg, Sweden' },
    { title: 'Munich Fashion Week', dates: '4-7 september', location: 'München', country: 'TYSKLAND', address: 'Munich, Germany' },
    { title: 'Mut zum Hut', dates: '12-14 september', location: 'Neuburg', country: 'TYSKLAND', address: 'Neuburg an der Donau, Germany' },
    { title: 'INFA', dates: '10-19 oktober', location: 'Hannover', country: 'TYSKLAND', address: 'Messe Hannover, Messegelände, 30521 Hannover, Germany' },
    { title: 'Bazaar Berlin', dates: '5-9 november', location: 'Berlin', country: 'TYSKLAND', address: 'Berlin, Germany' },
    { title: 'Heim & Handwerk', dates: '12-16 november', location: 'München', country: 'TYSKLAND', address: 'Messe München, Am Messesee 2, 81829 München, Germany' }
  ];

  const today = new Date();
  const currentMonth = today.getMonth();
  
  const upcoming = events.filter((e) => {
    const monthMap: Record<string, number> = {
      februari: 1, mars: 2, april: 3, maj: 4, juni: 5,
      augusti: 7, september: 8, oktober: 9, november: 10
    };
    const eventMonth = Object.keys(monthMap).find(m => e.dates.includes(m));
    return eventMonth && monthMap[eventMonth] >= currentMonth;
  });

  const past = events.filter((e) => {
    const monthMap: Record<string, number> = {
      februari: 1, mars: 2, april: 3, maj: 4, juni: 5,
      augusti: 7, september: 8, oktober: 9, november: 10
    };
    const eventMonth = Object.keys(monthMap).find(m => e.dates.includes(m));
    return eventMonth && monthMap[eventMonth] < currentMonth;
  });

  function getMapUrl(address: string) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
  }

  return (
    <section className="space-y-12">
      {/* Hero section - patchwork pattern like Tanja Jacket */}
      <div className="relative rounded-2xl overflow-hidden shadow-2xl p-12" style={{
        background: `
          linear-gradient(45deg, #d946ef 0%, #ec4899 8%, #d946ef 8%, #ec4899 16%),
          linear-gradient(135deg, #3b82f6 16%, #0ea5e9 24%, #3b82f6 24%, #0ea5e9 32%),
          linear-gradient(90deg, #fbbf24 32%, #f59e0b 40%, #fbbf24 40%, #f59e0b 48%),
          linear-gradient(0deg, #22c55e 48%, #10b981 56%, #22c55e 56%, #10b981 64%),
          linear-gradient(60deg, #f43f5e 64%, #e11d48 72%, #f43f5e 72%, #e11d48 80%),
          linear-gradient(120deg, #8b5cf6 80%, #7c3aed 88%, #8b5cf6 88%, #7c3aed 96%),
          linear-gradient(180deg, #fb923c 96%, #ea580c 100%)
        `,
        backgroundSize: '100% 100%'
      }}>
        {/* Patchwork pattern overlay */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `
            repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 12px),
            repeating-linear-gradient(-45deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 12px)
          `
        }}></div>
        
        {/* Colorful fabric patches */}
        <div className="absolute top-0 left-0 w-40 h-40 bg-fuchsia-500 opacity-60 rotate-12 -mt-20 -ml-20"></div>
        <div className="absolute top-10 right-20 w-32 h-32 bg-blue-400 opacity-50 -rotate-6"></div>
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-yellow-400 opacity-40 rotate-45 -mb-24 -mr-24"></div>
        <div className="absolute bottom-20 left-32 w-36 h-36 bg-green-500 opacity-50 rotate-12"></div>
        <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-orange-400 opacity-40 -rotate-12"></div>
        <div className="absolute top-1/3 right-1/3 w-28 h-28 bg-purple-500 opacity-50 rotate-6"></div>
        
        {/* Stitching pattern overlay */}
        <div className="absolute inset-0" style={{
          backgroundImage: `
            linear-gradient(90deg, transparent 98%, rgba(255,255,255,0.4) 98%, rgba(255,255,255,0.4) 100%),
            linear-gradient(0deg, transparent 98%, rgba(255,255,255,0.4) 98%, rgba(255,255,255,0.4) 100%)
          `,
          backgroundSize: '40px 40px'
        }}></div>
        
        {/* Content */}
        <div className="relative z-10 max-w-4xl">
          <div className="inline-block px-5 py-2 bg-white/90 backdrop-blur-sm rounded-lg mb-6 border-3 border-yellow-400 shadow-lg transform -rotate-1">
            <span className="text-fuchsia-600 font-black text-sm tracking-wider uppercase">2025 European Tour</span>
          </div>
          <h1 className="text-6xl font-black text-white mb-6 leading-tight drop-shadow-2xl" style={{
            textShadow: '3px 3px 0 #ec4899, -1px -1px 0 #3b82f6, 2px 2px 0 #fbbf24'
          }}>
            Exhibitions & Events
          </h1>
          <div className="h-2 w-32 bg-gradient-to-r from-pink-500 via-yellow-400 to-green-500 mb-6 rounded-full shadow-lg"></div>
          <p className="text-2xl text-white font-bold leading-relaxed max-w-3xl drop-shadow-2xl" style={{
            textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
          }}>
            Meet us at fairs and exhibitions across Europe. Come see <span className="bg-yellow-400 text-fuchsia-600 px-3 py-1 rounded-lg font-black">The Tanja Jacket</span> and our hand-crafted collection in person!
          </p>
          
          {/* Decorative stitching dots */}
          <div className="mt-8 flex gap-3">
            <div className="w-5 h-5 bg-yellow-400 rounded-full shadow-lg border-2 border-white"></div>
            <div className="w-5 h-5 bg-fuchsia-500 rounded-full shadow-lg border-2 border-white"></div>
            <div className="w-5 h-5 bg-blue-400 rounded-full shadow-lg border-2 border-white"></div>
            <div className="w-5 h-5 bg-green-500 rounded-full shadow-lg border-2 border-white"></div>
          </div>
        </div>
      </div>

      {/* Gallery section - full visible images */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="relative rounded-xl overflow-hidden shadow-xl group">
          <img 
            src="/Images/Tanja1.jpg" 
            alt="Tanja at Exhibition" 
            className="w-full h-auto group-hover:scale-105 transition duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-pink-600/80 to-transparent opacity-0 group-hover:opacity-100 transition">
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <p className="text-white text-lg font-bold drop-shadow-lg">At The Fair</p>
            </div>
          </div>
        </div>
        <div className="relative rounded-xl overflow-hidden shadow-xl group">
          <img 
            src="/Images/Tanja2.png" 
            alt="Tanja Unlimited Collection" 
            className="w-full h-auto group-hover:scale-105 transition duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-red-600/80 to-transparent opacity-0 group-hover:opacity-100 transition">
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <p className="text-white text-lg font-bold drop-shadow-lg">Hand-Quilted Masterpieces</p>
            </div>
          </div>
        </div>
        <div className="relative rounded-xl overflow-hidden shadow-xl group">
          <img 
            src="/Images/Tanja3.png" 
            alt="Meet Tanja at Events" 
            className="w-full h-auto group-hover:scale-105 transition duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-600/80 to-transparent opacity-0 group-hover:opacity-100 transition">
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <p className="text-white text-lg font-bold drop-shadow-lg">Visit Our Stands</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="h-1 w-16 bg-gradient-to-r from-ochreRed to-indigoDeep rounded-full"></div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-ochreRed to-indigoDeep bg-clip-text text-transparent">Upcoming Events</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {upcoming.map((e, i) => (
            <div key={i} className="relative border-2 border-transparent rounded-xl p-6 bg-gradient-to-br from-white to-cream hover:border-ochreRed hover:shadow-2xl transition-all duration-300 group overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-ochreRed/10 to-transparent rounded-bl-full -mr-16 -mt-16"></div>
              <div className="relative z-10">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-sm font-bold text-ochreRed uppercase tracking-wider bg-ochreRed/10 px-3 py-1 rounded-full">{e.dates}</div>
                  <a 
                    href={getMapUrl(e.address)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-xs px-4 py-2 bg-indigoDeep text-white rounded-full hover:bg-ochreRed transition shadow-md"
                  >
                    📍 Map
                  </a>
                </div>
                <h3 className="text-xl font-bold mb-3 group-hover:text-ochreRed transition">{e.title}</h3>
                <div className="text-sm">
                  <div className="font-semibold text-indigoDeep">{e.location}</div>
                  {e.country && <div className="text-xs mt-1 text-ochreRed font-medium">{e.country}</div>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {past.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-6">
            <div className="h-1 w-12 bg-gray-400"></div>
            <h2 className="text-2xl font-semibold opacity-60">Past Events</h2>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-75">
            {past.map((e, i) => (
              <div key={i} className="border rounded-lg p-5 bg-white">
                <div className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">{e.dates}</div>
                <h3 className="text-lg font-semibold mb-2">{e.title}</h3>
                <div className="text-sm opacity-80">
                  <div>{e.location}</div>
                  {e.country && <div className="text-xs mt-1">{e.country}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="relative bg-gradient-to-br from-indigoDeep to-indigoDeep/80 rounded-2xl p-8 shadow-2xl overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-ochreRed/20 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-cream/10 rounded-full -ml-24 -mb-24"></div>
        <div className="relative z-10">
          <h3 className="text-2xl font-bold text-white mb-3">Contact for Private Viewings</h3>
          <p className="text-cream mb-5 text-lg">Want to see our collection before these events? Call or WhatsApp Tanja Kisker:</p>
          <div className="flex flex-wrap gap-4">
            <a href="tel:+46706332220" className="inline-flex items-center gap-2 px-6 py-3 bg-ochreRed text-white rounded-full hover:bg-white hover:text-ochreRed transition font-semibold shadow-lg">
              📞 +46 70 633 22 20
            </a>
            <a href="https://wa.me/46706332220" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-6 py-3 bg-white text-indigoDeep rounded-full hover:bg-ochreRed hover:text-white transition font-semibold shadow-lg">
              💬 WhatsApp
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}



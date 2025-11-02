'use client';

import { motion } from 'framer-motion';
import { MapPin, Calendar, Phone, MessageCircle } from 'lucide-react';

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
    <div className="min-h-screen">
      {/* Hero section */}
      <section className="relative py-24 bg-gradient-editorial overflow-hidden">
        <div className="absolute inset-0 pattern-block-print"></div>
        
        {/* Decorative elements */}
        <div className="absolute top-10 right-20 w-64 h-64 bg-warmOchre/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 left-10 w-80 h-80 bg-mutedRose/10 rounded-full blur-3xl"></div>
        
        <div className="relative max-w-7xl mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <p className="text-sm uppercase tracking-widest text-warmOchre mb-6">
              2025 European Tour
            </p>
            <h1 className="text-6xl lg:text-7xl font-serif font-medium text-deepIndigo mb-6">
              Exhibitions & Events
            </h1>
            <div className="w-24 h-1 bg-warmOchre mx-auto mb-8"></div>
            <p className="text-lg text-softCharcoal max-w-2xl mx-auto leading-relaxed">
              Meet us at fairs and exhibitions across Europe. Come see The Tanja Jacket 
              and our hand-crafted collection in person.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Gallery section */}
      <section className="py-16 bg-warmIvory">
        <div className="max-w-7xl mx-auto px-6 lg:px-12">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { src: '/Images/Tanja1.jpg', alt: 'Tanja at Exhibition' },
              { src: '/Images/Tanja2.png', alt: 'Tanja Unlimited Collection' },
              { src: '/Images/Tanja3.png', alt: 'Meet Tanja at Events' }
            ].map((image, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className="group relative overflow-hidden aspect-[4/5]"
              >
                <img 
                  src={image.src} 
                  alt={image.alt} 
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-700"
                />
                <div className="absolute inset-0 bg-deepIndigo/0 group-hover:bg-deepIndigo/20 transition-all duration-500"></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline - Upcoming Events */}
      <section className="py-24 bg-ivory">
        <div className="max-w-5xl mx-auto px-6 lg:px-12">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-serif font-medium text-deepIndigo mb-6">
              Upcoming Events
            </h2>
            <div className="w-24 h-1 bg-warmOchre mx-auto"></div>
          </div>

          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-px bg-warmOchre/30 transform md:-translate-x-1/2"></div>

            {upcoming.map((event, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -30 : 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: idx * 0.1 }}
                className={`relative mb-12 md:mb-16 ${
                  idx % 2 === 0 ? 'md:pr-1/2 md:text-right' : 'md:pl-1/2'
                }`}
              >
                {/* Timeline dot */}
                <div className={`absolute left-0 md:left-1/2 top-6 w-4 h-4 bg-warmOchre rounded-full border-4 border-ivory transform ${
                  idx % 2 === 0 ? 'md:-translate-x-1/2' : 'md:-translate-x-1/2'
                } -translate-y-1/2`}></div>

                <div className={`ml-8 md:ml-0 ${idx % 2 === 0 ? 'md:mr-12' : 'md:ml-12'}`}>
                  <div className="bg-cream border border-warmOchre/20 p-8 hover:border-warmOchre hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start justify-between mb-4 flex-wrap gap-4">
                      <div className="flex items-center gap-2 text-warmOchre">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm font-medium uppercase tracking-wider">
                          {event.dates}
                        </span>
                      </div>
                      <a 
                        href={getMapUrl(event.address)} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-deepIndigo text-ivory text-xs uppercase tracking-wider hover:bg-indigoDeep transition-colors"
                      >
                        <MapPin className="w-3 h-3" />
                        <span>View Map</span>
                      </a>
                    </div>
                    
                    <h3 className="text-2xl font-serif text-deepIndigo mb-3">
                      {event.title}
                    </h3>
                    
                    <div className="space-y-1 text-softCharcoal">
                      <p className="font-medium">{event.location}</p>
                      {event.country && (
                        <p className="text-xs uppercase tracking-widest text-warmOchre">
                          {event.country}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Past Events (if any) */}
      {past.length > 0 && (
        <section className="py-16 bg-warmIvory">
          <div className="max-w-5xl mx-auto px-6 lg:px-12">
            <div className="text-center mb-12">
              <h3 className="text-2xl font-serif text-softCharcoal/60 mb-4">
                Past Events
              </h3>
              <div className="w-16 h-px bg-softCharcoal/20 mx-auto"></div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-60">
              {past.map((event, idx) => (
                <div key={idx} className="bg-cream border border-warmOchre/10 p-6">
                  <p className="text-xs uppercase tracking-widest text-warmOchre mb-3">
                    {event.dates}
                  </p>
                  <h4 className="text-lg font-serif text-deepIndigo mb-2">
                    {event.title}
                  </h4>
                  <p className="text-sm text-softCharcoal">{event.location}</p>
                  {event.country && (
                    <p className="text-xs text-softCharcoal/60 mt-1">{event.country}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact CTA */}
      <section className="relative py-20 bg-deepIndigo text-ivory overflow-hidden">
        <div className="absolute inset-0 pattern-quilted opacity-20"></div>
        
        <div className="relative max-w-4xl mx-auto px-6 lg:px-12 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <h3 className="text-3xl font-serif font-medium mb-6">
              Contact for Private Viewings
            </h3>
            <p className="text-warmIvory/80 text-lg mb-10 leading-relaxed max-w-2xl mx-auto">
              Want to see our collection before these events? Call or WhatsApp Tanja Kisker
            </p>
            
            <div className="flex flex-wrap justify-center gap-4">
              <a 
                href="tel:+46706332220" 
                className="inline-flex items-center gap-3 px-8 py-4 bg-warmOchre text-deepIndigo hover:bg-antiqueGold transition-all duration-300 font-medium"
              >
                <Phone className="w-5 h-5" />
                <span>+46 70 633 22 20</span>
              </a>
              <a 
                href="https://wa.me/46706332220" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-8 py-4 border-2 border-ivory text-ivory hover:bg-ivory hover:text-deepIndigo transition-all duration-300 font-medium"
              >
                <MessageCircle className="w-5 h-5" />
                <span>WhatsApp</span>
              </a>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

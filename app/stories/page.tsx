// Journal / Stories skeleton; will connect to Sanity later
export default function StoriesPage() {
  const stories = [
    { title: 'Behind the Tanja Jacket', excerpt: 'Hand-quilted fabrics and reversible design.' }
  ];
  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold">Journal / Stories</h2>
      <ul className="grid sm:grid-cols-2 gap-4">
        {stories.map((s, i) => (
          <li key={i} className="border p-6 bg-white rounded">
            <div className="font-medium mb-1">{s.title}</div>
            <p className="text-sm opacity-80">{s.excerpt}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}



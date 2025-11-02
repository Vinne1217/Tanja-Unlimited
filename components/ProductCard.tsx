import Link from 'next/link';
import Image from 'next/image';

export default function ProductCard({
  id,
  name,
  image,
  categorySlug
}: {
  id: string;
  name: string;
  image?: string;
  categorySlug: string;
}) {
  return (
    <Link href={`/collection/${categorySlug}/${id}`} className="block border rounded overflow-hidden bg-white">
      {image ? (
        <Image src={image} alt={name} width={800} height={800} className="w-full h-auto object-cover" />
      ) : (
        <div className="w-full aspect-square bg-cream" />
      )}
      <div className="p-4">
        <div className="font-medium">{name}</div>
      </div>
    </Link>
  );
}



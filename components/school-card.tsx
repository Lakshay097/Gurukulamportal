import Link from 'next/link';
import { Building2, MapPin } from 'lucide-react';

interface SchoolCardProps {
  slug: string;
  name: string;
  city: string;
  status: string;
  heroImageUrl?: string | null;
}

export default function SchoolCard({
  slug,
  name,
  city,
  status,
  heroImageUrl,
}: SchoolCardProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Operational':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Under Construction':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'Pre-Launch':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <Link href={`/schools/${slug}`}>
      <div className="group overflow-hidden rounded-lg border bg-white shadow-sm transition-all hover:shadow-md">
        {/* Hero Image (16:9 aspect ratio) */}
        <div className="relative aspect-video w-full bg-gray-100">
          {heroImageUrl ? (
            <img
              src={heroImageUrl}
              alt={`${name} campus`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
              <Building2 className="h-16 w-16 text-gray-300" />
            </div>
          )}
        </div>

        {/* Card Content */}
        <div className="p-4">
          <div className="mb-2 flex items-start justify-between gap-2">
            <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
              {name}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${getStatusColor(status)}`}>
              {status}
            </span>
          </div>
          
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>{city}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

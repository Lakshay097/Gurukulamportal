"use client";

import Link from "next/link";
import { Lock } from "lucide-react";

interface DashboardTileProps {
  title: string;
  description: string;
  href: string;
  hasAccess: boolean;
}

export function DashboardTile({ title, description, href, hasAccess }: DashboardTileProps) {
  return (
    <Link
      href={hasAccess ? href : "#"}
      className={`relative block rounded-xl border-2 p-6 transition-all ${
        hasAccess
          ? "border-amber-200 bg-white hover:border-amber-400 hover:shadow-lg"
          : "border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed"
      }`}
      onClick={(e) => {
        if (!hasAccess) {
          e.preventDefault();
          alert("You do not have permission to access this section. Contact your administrator to request access.");
        }
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="mb-2 text-xl font-semibold text-gray-900">{title}</h3>
          <p className="text-gray-600">{description}</p>
        </div>
        {!hasAccess && (
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
            <Lock className="h-5 w-5 text-gray-500" />
          </div>
        )}
      </div>
    </Link>
  );
}
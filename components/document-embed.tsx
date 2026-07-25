'use client';

import { useState, useEffect } from 'react';

interface DocumentEmbedProps {
  fileId: string;
  resourceType: string;
  resourceId: string;
}

// In-memory cache for thumbnails with metadata
interface CachedThumbnail {
  url: string;
  timestamp: number;
}

const thumbnailCache = new Map<string, CachedThumbnail>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export default function DocumentEmbed({ fileId, resourceType, resourceId }: DocumentEmbedProps) {
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchFreshThumbnail = (cacheKey: string) => {
    const thumbnailSrc = `/api/drive/thumbnail?fileId=${fileId}&resourceType=${resourceType}&resourceId=${resourceId}`;
    
    // Preload the image
    const img = new Image();
    img.onload = () => {
      thumbnailCache.set(cacheKey, { url: thumbnailSrc, timestamp: Date.now() });
      setThumbnailUrl(thumbnailSrc);
      setError(false);
      setIsRefreshing(false);
    };
    img.onerror = () => {
      setError(true);
      setIsRefreshing(false);
    };
    img.src = thumbnailSrc;
  };

  useEffect(() => {
    const cacheKey = `${fileId}-${resourceType}-${resourceId}`;
    const now = Date.now();
    
    // Check cache first - show stale content immediately
    const cached = thumbnailCache.get(cacheKey);
    if (cached) {
      setThumbnailUrl(cached.url);
      setError(false);
      
      // If cache is stale, refresh in background
      if (now - cached.timestamp > CACHE_TTL) {
        setIsRefreshing(true);
        fetchFreshThumbnail(cacheKey);
      }
      return;
    }

    // No cache - fetch fresh thumbnail
    fetchFreshThumbnail(cacheKey);
  }, [fileId, resourceType, resourceId]);

  return (
    <div className="w-full aspect-[1/1.414] rounded-lg border overflow-hidden bg-gray-100 relative">
      {(!thumbnailUrl || error) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
          <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
      )}
      
      {thumbnailUrl && !error && (
        <img
          src={thumbnailUrl}
          alt="Document thumbnail"
          className="w-full h-full object-contain"
        />
      )}
      
      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20">
        <a
          href={`https://drive.google.com/file/d/${fileId}/preview`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 bg-white rounded-lg text-sm font-medium text-gray-900 hover:bg-gray-50 shadow-sm"
        >
          Open Full Preview
        </a>
      </div>
    </div>
  );
}

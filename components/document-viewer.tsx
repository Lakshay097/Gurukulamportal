'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface DocumentViewerProps {
  fileId: string;
  resourceType: string;
  resourceId: string;
  fileName: string;
  mimeType: string;
}

export default function DocumentViewer({ fileId, resourceType, resourceId, fileName, mimeType }: DocumentViewerProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleIframeLoad = () => {
    console.log('[DocumentViewer] iframe loaded successfully');
    setLoading(false);
  };

  const handleIframeError = () => {
    console.error('[DocumentViewer] iframe failed to load');
    setError('Failed to load document. Please try again.');
    setLoading(false);
  };

  // Set a timeout to hide loading state even if iframe doesn't fire onLoad
  useEffect(() => {
    const timeout = setTimeout(() => {
      console.log('[DocumentViewer] Timeout reached, hiding loading state');
      setLoading(false);
    }, 5000); // 5 second timeout

    return () => clearTimeout(timeout);
  }, []);

  // Handle messages from iframe (for close button in error pages)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'close') {
        if (window.history.length > 1) {
          window.history.back();
        } else {
          window.location.href = '/documents';
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading document...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-900 mb-2">Error Loading Document</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <button
              onClick={() => {
                if (window.history.length > 1) {
                  window.history.back();
                } else {
                  window.location.href = '/documents';
                }
              }}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const isPdf = mimeType === 'application/pdf';

  return (
    <div className="h-screen bg-gray-100 flex flex-col">
      {/* Header - hidden for PDFs */}
      {!isPdf && (
        <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between flex-shrink-0">
          <h1 className="text-lg font-semibold text-gray-900 truncate flex-1">
            {fileName || 'Document Viewer'}
          </h1>
          <div className="flex items-center gap-2">
            <div className="text-xs text-gray-500 mr-2">
              {mimeType}
            </div>
            <button
              onClick={() => {
                if (window.history.length > 1) {
                  window.history.back();
                } else {
                  window.location.href = '/documents';
                }
              }}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close"
            >
              <X className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>
      )}

      {/* Close button overlay for PDFs */}
      {isPdf && (
        <button
          onClick={() => {
            if (window.history.length > 1) {
              window.history.back();
            } else {
              window.location.href = '/documents';
            }
          }}
          className="fixed top-4 right-4 z-50 p-2 bg-white rounded-lg shadow-lg hover:bg-gray-100 transition-colors"
          title="Close"
        >
          <X className="h-5 w-5 text-gray-600" />
        </button>
      )}

      {/* Document Viewer */}
      <div className="flex-1 overflow-auto">
        <iframe
          src={`/api/drive/view?fileId=${fileId}&resourceType=${resourceType}&resourceId=${resourceId}#toolbar=0`}
          className="w-full h-full border-0"
          title={fileName || 'Document'}
          onLoad={handleIframeLoad}
          onError={handleIframeError}
        />
      </div>
    </div>
  );
}

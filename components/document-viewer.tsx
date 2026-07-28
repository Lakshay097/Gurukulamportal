'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface DocumentViewerProps {
  fileId: string;
  resourceType: string;
  resourceId: string;
}

export default function DocumentViewer({ fileId, resourceType, resourceId }: DocumentViewerProps) {
  const [fileName, setFileName] = useState<string>('');
  const [mimeType, setMimeType] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('[DocumentViewer] useEffect triggered', { fileId, resourceType, resourceId });
    async function fetchMetadata() {
      try {
        setLoading(true);
        console.log('[DocumentViewer] Fetching file metadata:', fileId);
        
        const response = await fetch(
          `/api/drive/view?fileId=${fileId}&resourceType=${resourceType}&resourceId=${resourceId}`
        );

        console.log('[DocumentViewer] Response status:', response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('[DocumentViewer] Error response:', errorText);
          
          // Check if this is a preview_unavailable error from CloudConvert conversion failure
          try {
            const errorJson = JSON.parse(errorText);
            if (errorJson.error === 'preview_unavailable') {
              throw new Error(errorJson.message || 'This document could not be converted for preview. Please try again shortly.');
            }
          } catch {
            // If parsing fails, use the original error text
          }
          
          throw new Error(`Failed to load document: ${response.status} ${errorText}`);
        }

        // Get content type from response
        const contentType = response.headers.get('Content-Type');
        if (contentType) {
          setMimeType(contentType);
        }

        // Try to get filename from Content-Disposition header
        const contentDisposition = response.headers.get('Content-Disposition');
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="([^"]+)"/);
          if (filenameMatch) {
            setFileName(filenameMatch[1]);
          }
        }

        setLoading(false);
        console.log('[DocumentViewer] Metadata loaded successfully');
      } catch (err) {
        console.error('[DocumentViewer] Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load document');
        setLoading(false);
      }
    }

    fetchMetadata();
  }, [fileId, resourceType, resourceId]);

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
        />
      </div>
    </div>
  );
}

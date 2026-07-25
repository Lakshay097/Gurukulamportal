'use client';

import { useState, useEffect } from 'react';
import FolderTree from './folder-tree';
import EmptyState from './empty-state';
import { Skeleton } from './ui/skeleton';

interface DocumentRowProps {
  title?: string;
  folderId: string | null;
  resourceType: string;
  resourceId: string;
  documentType?: string;
  showFiles?: boolean;
}

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink?: string;
}

interface DriveFolder {
  id: string;
  name: string;
  files: DriveFile[];
  subfolders: DriveFolder[];
  isRoot?: boolean;
}

export default function DocumentRow({ title, folderId, resourceType, resourceId, documentType, showFiles = false }: DocumentRowProps) {
  const [folderStructure, setFolderStructure] = useState<DriveFolder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchFolderStructure() {
      if (!folderId) {
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/drive/list?folderId=${folderId}&resourceType=${resourceType}&resourceId=${resourceId}`
        );
        
        if (!response.ok) {
          if (response.status === 403) {
            // Access denied - let the parent AccessGate handle this
            setError(true);
          } else {
            throw new Error('Failed to fetch folder structure');
          }
          setLoading(false);
          return;
        }

        const data = await response.json();
        
        // Check if the folder is unreadable (Drive permission error)
        if (data.unreadable) {
          setError(true);
          setLoading(false);
          return;
        }
        
        setFolderStructure(data.folderStructure || null);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching folder structure:', err);
        setError(true);
        setLoading(false);
      }
    }

    fetchFolderStructure();
  }, [folderId, resourceType, resourceId]);

  if (loading) {
    return (
      <div 
        className="p-6"
        style={{
          backgroundColor: 'var(--panel)',
          border: '1px solid var(--line-soft)',
          borderRadius: 'var(--r-md)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="p-6"
        style={{
          backgroundColor: 'var(--panel)',
          border: '1px solid var(--line-soft)',
          borderRadius: 'var(--r-md)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <EmptyState variant="error" title="Unable to load documents" description="This folder cannot be accessed. Please verify the Drive folder is shared with the service account and the folder ID is correct." />
      </div>
    );
  }

  if (!folderId || !folderStructure) {
    return (
      <div 
        className="p-6"
        style={{
          backgroundColor: 'var(--panel)',
          border: '1px solid var(--line-soft)',
          borderRadius: 'var(--r-md)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <EmptyState variant="coming-soon" title={`${title} coming soon`} description="Documents will be available here soon." />
      </div>
    );
  }

  // HARD GUARD: Never render the root folder - it's an internal storage concept, not user-facing
  // If a section points to the root folder, it's a data configuration error that must be fixed
  // by creating proper subfolders and updating the section's driveFolderId
  if (folderStructure.isRoot) {
    return (
      <div 
        className="p-6"
        style={{
          backgroundColor: 'var(--panel)',
          border: '1px solid var(--line-soft)',
          borderRadius: 'var(--r-md)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <EmptyState variant="error" title="Configuration Error" description="This section is incorrectly configured to point to the root folder. Please create a dedicated subfolder for this section and update the folder ID in the database." />
      </div>
    );
  }

  return (
    <div 
      className="p-6 transition-all duration-200 hover:shadow-md"
      style={{
        backgroundColor: 'var(--panel)',
        border: '1px solid var(--line-soft)',
        borderRadius: 'var(--r-md)',
        boxShadow: 'var(--shadow-sm)'
      }}
    >
      {title && <h3 className="mb-4 text-lg font-semibold" style={{ fontFamily: 'var(--font-work-sans)', color: 'var(--ink)' }}>{title}</h3>}
      <FolderTree
        folder={folderStructure}
        documentType={documentType || 'documents'}
        resourceType={resourceType}
        resourceId={resourceId}
        showFiles={showFiles}
      />
    </div>
  );
}

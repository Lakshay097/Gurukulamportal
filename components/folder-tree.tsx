'use client';

import { useState } from 'react';
import { Icon } from './icon-sprite';
import DocumentCard from './document-card';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createSlugWithId } from '@/lib/slug-utils';

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

interface FolderTreeProps {
  folder: DriveFolder;
  level?: number;
  basePath?: string;
  documentType: string;
  resourceType: string;
  resourceId: string;
  showFiles?: boolean;
}

export default function FolderTree({ folder, level = 0, basePath = '', documentType, resourceType, resourceId, showFiles = false }: FolderTreeProps) {
  const pathname = usePathname();

  // HARD GUARD: Never render the root folder as a folder card
  // The root folder is an internal storage concept, not user-facing
  if (folder.isRoot) {
    return null;
  }

  const hasContent = folder.files.length > 0 || folder.subfolders.length > 0;
  const folderSlug = createSlugWithId(folder.name, folder.id);
  const folderPath = basePath ? `${basePath}/${folderSlug}` : folderSlug;
  const folderUrl = `/documents/${documentType}/${folderPath}`;
  const isCurrentPath = pathname === folderUrl;

  return (
    <div className="select-none">
      <Link
        href={folderUrl}
        className={`flex items-center gap-3 py-3 px-4 rounded-lg cursor-pointer transition-all duration-200 group ${
          level === 0 ? 'font-semibold' : ''
        } ${isCurrentPath ? 'bg-[rgba(216,155,60,0.08)]' : ''}`}
        style={{
          paddingLeft: level === 0 ? '16px' : `${level * 16 + 16}px`,
          backgroundColor: isCurrentPath ? 'rgba(216,155,60,0.08)' : 'transparent',
          fontFamily: 'var(--font-work-sans)',
          color: 'var(--ink)'
        }}
        onMouseEnter={(e) => {
          if (!isCurrentPath) {
            e.currentTarget.style.backgroundColor = 'rgba(216,155,60,0.06)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isCurrentPath) {
            e.currentTarget.style.backgroundColor = 'transparent';
          }
        }}
      >
        {/* Icon tile */}
        <div 
          className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: 'var(--parchment-deep)' }}
        >
          <Icon 
            name="folder" 
            className="w-5 h-5" 
            style={{ color: 'var(--gold-deep)' }} 
          />
        </div>

        {/* Folder name */}
        <span className="flex-1">{folder.name}</span>

        {/* Count badge */}
        {folder.files.length > 0 && (
          <span 
            className="flex-shrink-0 px-2 py-1 rounded-md text-xs font-medium"
            style={{
              backgroundColor: 'var(--parchment-deep)',
              color: 'var(--ink-faint)',
              fontFamily: 'var(--font-ibm-plex-mono)'
            }}
          >
            {folder.files.length}
          </span>
        )}

        {/* Arrow link on hover */}
        <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Icon name="arrow-right" className="w-4 h-4" style={{ color: 'var(--gold)' }} />
        </div>
      </Link>

      {/* Show files if on detail page and this is the current folder */}
      {showFiles && isCurrentPath && folder.files.length > 0 && (
        <div 
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4 mt-4 p-4 rounded-lg"
          style={{ 
            paddingLeft: level === 0 ? '16px' : `${level * 16 + 16}px`,
            backgroundColor: 'var(--parchment-deep)'
          }}
        >
          {folder.files.map((file) => (
            <DocumentCard key={file.id} file={file} resourceType={resourceType} resourceId={resourceId} />
          ))}
        </div>
      )}

      {/* Subfolders - still shown as navigable items */}
      {folder.subfolders.map((subfolder) => (
        <FolderTree
          key={subfolder.id}
          folder={subfolder}
          level={level + 1}
          basePath={folderPath}
          documentType={documentType}
          resourceType={resourceType}
          resourceId={resourceId}
          showFiles={showFiles}
        />
      ))}
    </div>
  );
}

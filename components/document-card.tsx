'use client';

import { FileText, ExternalLink } from 'lucide-react';
import DocumentEmbed from './document-embed';
import * as HoverCard from '@radix-ui/react-hover-card';
import { Icon } from './icon-sprite';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime: string;
  webViewLink?: string;
}

interface DocumentCardProps {
  file: DriveFile;
  resourceType: string;
  resourceId: string;
}

export default function DocumentCard({ file, resourceType, resourceId }: DocumentCardProps) {
  // Extract shortened label from filename
  const getShortLabel = (filename: string): string => {
    const gurukulamPrefix = 'Gurukulam_';
    const sopSuffix = '_SOP';
    
    // Check if filename matches the pattern Gurukulam_..._SOP
    if (filename.startsWith(gurukulamPrefix)) {
      const afterPrefix = filename.slice(gurukulamPrefix.length);
      const sopIndex = afterPrefix.indexOf(sopSuffix);
      
      if (sopIndex !== -1) {
        const extracted = afterPrefix.slice(0, sopIndex);
        // Trim leading/trailing underscores
        const trimmed = extracted.replace(/^_+|_+$/g, '');
        // Replace remaining underscores with spaces for readability
        return trimmed.replace(/_/g, ' ');
      }
    }
    
    // Fallback: remove file extension
    const lastDotIndex = filename.lastIndexOf('.');
    if (lastDotIndex !== -1) {
      return filename.slice(0, lastDotIndex);
    }
    
    return filename;
  };

  const shortLabel = getShortLabel(file.name);
  const handleCardClick = () => {
    if (file.webViewLink) {
      window.open(file.webViewLink, '_blank', 'noopener,noreferrer');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleCardClick();
    }
  };

  return (
    <HoverCard.Root openDelay={200} closeDelay={100}>
      <HoverCard.Trigger asChild>
        <div
          className="rounded-lg border p-4 transition-all cursor-pointer focus:outline-none hover:-translate-y-[2px] group"
          style={{
            backgroundColor: 'var(--panel)',
            borderColor: 'var(--line-soft)',
            borderRadius: 'var(--r-md)',
            boxShadow: 'var(--shadow-sm)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = 'var(--shadow-md)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = 'var(--shadow-sm)';
          }}
          onClick={handleCardClick}
          onKeyDown={handleKeyDown}
          tabIndex={0}
          role="button"
          aria-label={`Open ${shortLabel}`}
        >
          <div className="flex items-center gap-3">
            {/* File type icon tile */}
            <div 
              className="flex-shrink-0 w-10 h-10 rounded flex items-center justify-center"
              style={{ backgroundColor: 'var(--parchment-deep)', borderRadius: 'var(--r-sm)' }}
            >
              <FileText className="h-5 w-5" style={{ color: 'var(--ink-soft)' }} />
            </div>
            
            {/* Filename */}
            <span 
              className="text-sm font-medium truncate flex-1" 
              style={{ 
                fontFamily: 'var(--font-work-sans)',
                color: 'var(--ink)'
              }}
              title={file.name}
            >
              {shortLabel}
            </span>
            
            {/* External link icon */}
            {file.webViewLink && (
              <div 
                className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{ 
                  color: 'var(--ink-faint)',
                  backgroundColor: 'transparent'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--gold-deep)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--ink-faint)';
                }}
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </div>
            )}
          </div>
        </div>
      </HoverCard.Trigger>
      <HoverCard.Portal>
        <HoverCard.Content
          className="z-50 rounded-lg border shadow-lg p-2 w-[200px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
          style={{
            backgroundColor: 'var(--panel)',
            borderColor: 'var(--line-soft)'
          }}
          side="right"
          align="start"
          sideOffset={8}
          collisionPadding={16}
          avoidCollisions
        >
          <DocumentEmbed fileId={file.id} resourceType={resourceType} resourceId={resourceId} />
        </HoverCard.Content>
      </HoverCard.Portal>
    </HoverCard.Root>
  );
}

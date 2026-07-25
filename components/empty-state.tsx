import { Clock, Lock, AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  variant: 'coming-soon' | 'restricted' | 'error';
  title?: string;
  description?: string;
}

export default function EmptyState({ variant, title, description }: EmptyStateProps) {
  const variants = {
    'coming-soon': {
      icon: Clock,
      defaultTitle: 'Coming Soon',
      defaultDescription: 'This content is not yet available. Check back later.',
      bgColor: 'var(--parchment-deep)',
      iconColor: 'var(--ink-faint)',
    },
    restricted: {
      icon: Lock,
      defaultTitle: 'Access Restricted',
      defaultDescription: 'You do not have permission to view this content. Contact your administrator if you believe this is an error.',
      bgColor: 'rgba(193, 89, 43, 0.08)',
      iconColor: 'var(--terracotta)',
    },
    error: {
      icon: AlertCircle,
      defaultTitle: 'Unable to Load',
      defaultDescription: 'There was a problem loading this content. Please try again later.',
      bgColor: 'rgba(216, 155, 60, 0.08)',
      iconColor: 'var(--gold-deep)',
    },
  };

  const config = variants[variant];
  const Icon = config.icon;

  return (
    <div 
      className="p-8 text-center rounded-lg"
      style={{ backgroundColor: config.bgColor }}
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center">
        <Icon className="h-8 w-8" style={{ color: config.iconColor }} />
      </div>
      <h3 
        className="mt-4 text-lg font-medium"
        style={{ fontFamily: 'var(--font-work-sans)', color: 'var(--ink)' }}
      >
        {title || config.defaultTitle}
      </h3>
      <p 
        className="mt-2 text-sm"
        style={{ fontFamily: 'var(--font-work-sans)', color: 'var(--ink-soft)' }}
      >
        {description || config.defaultDescription}
      </p>
    </div>
  );
}

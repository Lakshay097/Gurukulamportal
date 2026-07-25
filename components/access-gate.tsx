import { canAccess } from '@/lib/permissions';
import EmptyState from './empty-state';

interface AccessGateProps {
  resourceType: string;
  resourceId: string;
  userGroupKeys: string[];
  children: React.ReactNode;
}

export default async function AccessGate({
  resourceType,
  resourceId,
  userGroupKeys,
  children,
}: AccessGateProps) {
  const hasAccess = await canAccess(userGroupKeys, resourceType, resourceId);

  if (!hasAccess) {
    return <EmptyState variant="restricted" />;
  }

  return <>{children}</>;
}

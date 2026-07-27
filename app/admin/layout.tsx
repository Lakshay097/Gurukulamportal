import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import AdminSidebar from '@/components/admin-sidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/login');
  }

  const userGroupKeys = (session as any).userGroupKeys || [];

  if (!userGroupKeys.includes('admin-central')) {
    redirect('/unauthorized');
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className="flex-1 bg-gray-50">
        {children}
      </main>
    </div>
  );
}

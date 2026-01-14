import { Metadata } from 'next';
import { auth } from '@/lib/auth'; // Path to your better-auth instance
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { AccountComponents } from './components';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'User Account Dashboard',
};

export default async function Dashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session || !session.user) {
    redirect('/login');
  }

  // 🔑 Fetch the record to check the LIVE status
  const userRecord = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  return (
    <div className='flex min-h-screen items-center justify-center container m-auto'>
      <AccountComponents loggedinUser={userRecord} />
    </div>
  );
}
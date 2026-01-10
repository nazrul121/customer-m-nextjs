import { Metadata } from 'next';
import AccountComponents from './components';

export const metadata: Metadata = {
  title: 'Dashboard ',
  description: 'A brief description of my awesome website.',
};

export default function Dashboard() {
  return (
    <>
        <div className='flex min-h-screen items-center justify-center container m-auto'>
          <AccountComponents />
        </div>
    </>
  );
}
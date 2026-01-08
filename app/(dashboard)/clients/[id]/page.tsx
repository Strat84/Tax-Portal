import { Metadata } from 'next';

// Define the params type
type PageProps = {
  params: Promise<{ id: string }>;
};

// If using generateMetadata (optional)
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `Client ${id} Details`,
  };
}

export async function generateStaticParams() {
  // Return empty array or sample IDs
  return [
    { id: '1' },
    { id: '2' },
    { id: '3' },
  ];
}

import ClientDetails from './ClientDetails';

export default async function ClientDetailPage({ params }: PageProps) {
  // ✅ Await the params (Next.js 14+)
  const { id } = await params;
  
  // You can fetch data server-side here if needed
  // const clientData = await fetchClientData(id);
  
  return <ClientDetails id={id} />;
}
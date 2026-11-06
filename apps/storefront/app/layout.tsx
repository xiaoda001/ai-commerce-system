import type { ReactNode } from 'react';

export const metadata = {
  title: 'Commerce Storefront',
  description: 'Choose a market to continue.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

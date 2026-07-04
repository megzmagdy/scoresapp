import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';
import type { MetaFunction } from 'react-router';
import { Navbar } from './components/Navbar';
import '@dpt/ui/globals.css';
import './index.css';

// A stale tab navigating client-side after a new deploy tries to dynamic-import
// a route chunk whose hashed filename no longer exists on the server. Vite fires
// this event instead of throwing into the app; reload once to pick up the
// current build rather than leaving the route silently unmounted.
if (typeof window !== 'undefined') {
  window.addEventListener('vite:preloadError', () => {
    window.location.reload();
  });
}

export const meta: MetaFunction = () => [{ title: 'Delta Padel Tour' }];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link rel="icon" type="image/png" href="/favicon.png" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Archivo:ital,wdth,wght@0,75,400;0,75,700;1,75,900&family=Source+Code+Pro:wght@400;600&family=Sora:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
        <Meta />
        <Links />
      </head>
      <body>
        <div className="min-h-screen bg-dpt-bg">
          <Navbar />
          {children}
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  return <Outlet />;
}

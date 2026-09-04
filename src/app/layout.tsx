import type { Metadata, Viewport } from 'next';
import { Providers } from './providers';

export const metadata: Metadata = {
    title: 'Bopomofo Karaoke'
};

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="zh-TW" suppressHydrationWarning>
            <body style={{ margin: 0 }}>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}

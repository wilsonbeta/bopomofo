'use client';

import { useState } from 'react';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { useServerInsertedHTML } from 'next/navigation';
import { ChakraProvider, defaultSystem } from '@chakra-ui/react';

/**
 * Emotion 在 App Router 下要自己把 SSR 期間插入的 <style> 交回給 Next，
 * 否則 server 端會多出一個 `data-emotion="css-global"` 的 style tag、client 端沒有，
 * 造成 hydration mismatch（Chakra 的全域 reset 就是 global style）。
 */
export function Providers({ children }: { children: React.ReactNode }) {
    const [cache] = useState(() => {
        const c = createCache({ key: 'chakra' });
        c.compat = true;
        return c;
    });

    useServerInsertedHTML(() => {
        const names = Object.keys(cache.inserted);
        if (!names.length) return null;
        return (
            <style
                data-emotion={`${cache.key} ${names.join(' ')}`}
                dangerouslySetInnerHTML={{ __html: names.map((n) => cache.inserted[n]).join(' ') }}
            />
        );
    });

    return (
        <CacheProvider value={cache}>
            <ChakraProvider value={defaultSystem}>{children}</ChakraProvider>
        </CacheProvider>
    );
}

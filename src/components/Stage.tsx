import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { PAPER } from '@/lib/palette';

/** 設計基準：1180×820（iPad Air 橫向）。整個 app 就是這麼大的一張畫。 */
export const STAGE_W = 1180;
export const STAGE_H = 820;

/**
 * 舞台的縮放倍率。
 *
 * @dnd-kit 把「指標在螢幕上移動了幾 px」直接當成 CSS transform 的位移量，
 * 但舞台整個被 `scale()` 縮過，local 1px 在螢幕上只有 scale px——
 * 不修正的話卡片會跟不上手指（實測：scale 0.6 時手指走 132px、卡片只走 79px）。
 * 拖曳中的元件要把 transform 除以這個倍率，才會貼著手指走。
 */
const ScaleContext = createContext(1);

export function useStageScale(): number {
    return useContext(ScaleContext);
}

/**
 * 等比縮放的舞台：像遊戲畫面那樣，內容永遠是 1180×820，
 * 外層算出 `min(可用寬/1180, 可用高/820)` 再整個縮放置中。
 *
 * 可用空間直接量外框的 `clientWidth/Height`（外框吃 `100dvh` 與 `env(safe-area-inset-*)`），
 * 所以瀏海、Home indicator、Safari 網址列的伸縮都自動算進去，不需要各自寫死。
 */
export function Stage({ children }: { children: ReactNode }) {
    const boxRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const box = boxRef.current;
        if (!box) return;
        const measure = () => {
            const w = box.clientWidth;
            const h = box.clientHeight;
            if (!w || !h) return;
            setScale(Math.min(w / STAGE_W, h / STAGE_H));
        };
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(box);
        // iOS 上網址列收合不一定觸發 ResizeObserver，visualViewport 才會。
        window.visualViewport?.addEventListener('resize', measure);
        window.addEventListener('orientationchange', measure);
        return () => {
            ro.disconnect();
            window.visualViewport?.removeEventListener('resize', measure);
            window.removeEventListener('orientationchange', measure);
        };
    }, []);

    return (
        <div ref={boxRef} className="stage-box" style={{ background: PAPER }}>
            <div
                className="stage"
                data-stage-scale={scale}
                style={{ width: STAGE_W, height: STAGE_H, transform: `scale(${scale})` }}
            >
                <ScaleContext.Provider value={scale}>{children}</ScaleContext.Provider>
            </div>
        </div>
    );
}

/**
 * 全部按鈕都用 inline SVG 圖示——畫面上不出現任何中文字。
 * 每個圖示都畫在 24×24 的框裡，用 currentColor 上色。
 */

interface IconProps {
    size?: number;
    color?: string;
}

function svgProps(size: number) {
    return {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 2,
        strokeLinecap: 'round' as const,
        strokeLinejoin: 'round' as const,
        'aria-hidden': true
    };
}

/** 鍵盤模式：一個鍵盤外框。 */
export function KeyboardIcon({ size = 24, color = 'currentColor' }: IconProps) {
    return (
        <svg {...svgProps(size)} style={{ color }}>
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
        </svg>
    );
}

/** 海報模式：格狀排列。 */
export function GridIcon({ size = 24, color = 'currentColor' }: IconProps) {
    return (
        <svg {...svgProps(size)} style={{ color }}>
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
    );
}

/** 儲存：往托盤裡放一張卡。 */
export function SaveIcon({ size = 24, color = 'currentColor' }: IconProps) {
    return (
        <svg {...svgProps(size)} style={{ color }}>
            <path d="M12 3v10" />
            <path d="M8 9l4 4 4-4" />
            <path d="M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
        </svg>
    );
}

/** 整列播放：兩個三角形。 */
export function PlayAllIcon({ size = 24, color = 'currentColor' }: IconProps) {
    return (
        <svg {...svgProps(size)} style={{ color }} fill="currentColor" stroke="none">
            <path d="M4 5l8 7-8 7z" />
            <path d="M13 5l8 7-8 7z" />
        </svg>
    );
}

/** 停止：一個方塊。 */
export function StopIcon({ size = 24, color = 'currentColor' }: IconProps) {
    return (
        <svg {...svgProps(size)} style={{ color }} fill="currentColor" stroke="none">
            <rect x="5" y="5" width="14" height="14" rx="2" />
        </svg>
    );
}

/** 匯出 ⤓：箭頭往下進托盤。 */
export function ExportIcon({ size = 24, color = 'currentColor' }: IconProps) {
    return (
        <svg {...svgProps(size)} style={{ color }}>
            <path d="M12 3v11" />
            <path d="M7 10l5 5 5-5" />
            <path d="M4 20h16" />
        </svg>
    );
}

/** 匯入 ⤒：箭頭從托盤往上。 */
export function ImportIcon({ size = 24, color = 'currentColor' }: IconProps) {
    return (
        <svg {...svgProps(size)} style={{ color }}>
            <path d="M12 20V9" />
            <path d="M7 13l5-5 5 5" />
            <path d="M4 4h16" />
        </svg>
    );
}

/** 刪除：叉。 */
export function CloseIcon({ size = 24, color = 'currentColor' }: IconProps) {
    return (
        <svg {...svgProps(size)} style={{ color }} strokeWidth={3}>
            <path d="M6 6l12 12M18 6L6 18" />
        </svg>
    );
}

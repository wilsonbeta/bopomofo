/**
 * 全部按鈕都用 inline SVG 圖示——畫面上不出現任何中文字。
 * 每個圖示都畫在 24×24 的框裡，用 currentColor 上色，尺寸與筆畫與設計稿 `gen.mjs` 的 `I` 相同。
 */

interface IconProps {
    size?: number;
}

function strokeProps(size: number) {
    return {
        width: size,
        height: size,
        viewBox: '0 0 24 24',
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 2.2,
        strokeLinecap: 'round' as const,
        strokeLinejoin: 'round' as const,
        'aria-hidden': true
    };
}

function fillProps(size: number) {
    return { width: size, height: size, viewBox: '0 0 24 24', fill: 'currentColor', 'aria-hidden': true };
}

/** 念一次：實心三角。 */
export function PlayIcon({ size = 34 }: IconProps) {
    return (
        <svg {...fillProps(size)}>
            <path d="M7 4.5v15l12-7.5z" />
        </svg>
    );
}

/** 整列播放：兩個三角形。 */
export function PlayAllIcon({ size = 32 }: IconProps) {
    return (
        <svg {...fillProps(size)}>
            <path d="M3 5v14l8-7z" />
            <path d="M12 5v14l8-7z" />
        </svg>
    );
}

/** 停止：一個方塊。 */
export function StopIcon({ size = 30 }: IconProps) {
    return (
        <svg {...fillProps(size)}>
            <rect x="5" y="5" width="14" height="14" rx="3" />
        </svg>
    );
}

/** 儲存／匯出：箭頭往下落到底線上。 */
export function SaveIcon({ size = 26 }: IconProps) {
    return (
        <svg {...strokeProps(size)}>
            <path d="M12 4v11" />
            <path d="M7 11l5 5 5-5" />
            <path d="M4 19h16" />
        </svg>
    );
}

/** 清除：一條橫線。 */
export function ClearIcon({ size = 26 }: IconProps) {
    return (
        <svg {...strokeProps(size)}>
            <path d="M5 12h14" />
        </svg>
    );
}

/** 匯入：箭頭從底線往上。 */
export function ImportIcon({ size = 22 }: IconProps) {
    return (
        <svg {...strokeProps(size)}>
            <path d="M12 19V8" />
            <path d="M7 12l5-5 5 5" />
            <path d="M4 4h16" />
        </svg>
    );
}

/** 刪除：叉。 */
export function CloseIcon({ size = 14 }: IconProps) {
    return (
        <svg {...strokeProps(size)}>
            <path d="M6 6l12 12" />
            <path d="M18 6L6 18" />
        </svg>
    );
}

import { SLOT_COLOR, WHITE, YELLOW, YELLOW_DEEP } from '@/lib/palette';
import { ClearIcon, PlayIcon, SaveIcon } from './Icons';

export interface ActionRowProps {
    /** 單張播放中：▶ 變深黃。 */
    playing: boolean;
    onPlay: () => void;
    onSave: () => void;
    onClear: () => void;
}

/** 字格底下的三顆：念一次（大、黃）、儲存（藍線框）、清除（紫線框）。 */
export function ActionRow({ playing, onPlay, onSave, onClear }: ActionRowProps) {
    const square = {
        width: 76,
        height: 76,
        borderRadius: 22,
        background: WHITE,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    } as const;
    return (
        <div data-testid="action-row" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <button
                className="press-soft"
                data-testid="play"
                aria-label="play"
                onClick={onPlay}
                style={{
                    width: 168,
                    height: 76,
                    borderRadius: 22,
                    border: 'none',
                    background: playing ? YELLOW_DEEP : YELLOW,
                    color: '#2B2A28',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                <PlayIcon size={34} />
            </button>
            <button
                className="press-soft"
                data-testid="save"
                aria-label="save"
                onClick={onSave}
                style={{ ...square, border: `2.5px solid ${SLOT_COLOR.final}`, color: SLOT_COLOR.final }}
            >
                <SaveIcon size={26} />
            </button>
            <button
                className="press-soft"
                data-testid="clear"
                aria-label="clear"
                onClick={onClear}
                style={{ ...square, border: `2.5px solid ${SLOT_COLOR.tone}`, color: SLOT_COLOR.tone }}
            >
                <ClearIcon size={26} />
            </button>
        </div>
    );
}

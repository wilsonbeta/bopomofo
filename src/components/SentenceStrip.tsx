import { useRef } from 'react';
import {
    DndContext,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent
} from '@dnd-kit/core';
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable';
import type { Card } from '@/lib/deck';
import { DANGER, LINE, PAPER2, SLOT_COLOR, STRIP_GLOW, WHITE, YELLOW, YELLOW_DEEP, YELLOW_SOFT } from '@/lib/palette';
import { ImportIcon, PlayAllIcon, SaveIcon, StopIcon } from './Icons';
import { CARD_H, CARD_W, MiniCard } from './MiniCard';

export interface SentenceStripProps {
    cards: Card[];
    selectedId: string | null;
    /** 整列播放時，目前在念哪一張。 */
    playingId: string | null;
    /** 剛儲存過要彈一下的卡。 */
    flashId: string | null;
    /** 整列播放中：禁用拖曳與刪除。 */
    running: boolean;
    /**
     * 整列播放但拿不到可用的 onboundary（沒插分隔符，或事件沒來）：
     * 整列一起淡淡發光，不假裝逐卡同步。
     */
    glow: boolean;
    /** 匯入失敗，整列閃紅框。 */
    importError: boolean;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onReorder: (fromId: string, toId: string) => void;
    onPlayAll: () => void;
    onExport: () => void;
    onImport: (file: File) => void;
}

/** 最右邊永遠留一個虛線空位：告訴小朋友「還可以再加一張」。 */
function EmptySlot() {
    return (
        <div
            data-testid="card-placeholder"
            style={{
                width: CARD_W,
                height: CARD_H,
                borderRadius: 16,
                border: `2px dashed ${LINE}`,
                flexShrink: 0
            }}
        />
    );
}

export function SentenceStrip({
    cards,
    selectedId,
    playingId,
    flashId,
    running,
    glow,
    importError,
    onSelect,
    onDelete,
    onReorder,
    onPlayAll,
    onExport,
    onImport
}: SentenceStripProps) {
    const fileRef = useRef<HTMLInputElement>(null);

    // distance 5：小於 5px 的位移算點擊（單張播放），超過才進入拖曳。
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const onDragEnd = (e: DragEndEvent) => {
        const { active, over } = e;
        if (over && active.id !== over.id) onReorder(String(active.id), String(over.id));
    };

    const lit = running || glow;

    return (
        <div
            data-testid="sentence-strip"
            data-import-error={importError ? 'true' : 'false'}
            data-deck-glow={glow ? 'true' : 'false'}
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: 18,
                padding: '16px 18px',
                borderRadius: 24,
                background: importError ? '#FFF5F5' : lit ? YELLOW_SOFT : PAPER2,
                boxShadow: importError ? `0 0 0 3px ${DANGER}` : lit ? STRIP_GLOW : 'none',
                transition: 'background 160ms ease-out, box-shadow 160ms ease-out'
            }}
        >
            <button
                className="press-soft"
                data-testid="play-all"
                aria-label="play-all"
                onClick={onPlayAll}
                style={{
                    width: 76,
                    height: 76,
                    borderRadius: 38,
                    border: 'none',
                    background: running ? YELLOW_DEEP : YELLOW,
                    color: '#2B2A28',
                    flexShrink: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                }}
            >
                {running ? <StopIcon size={30} /> : <PlayAllIcon size={32} />}
            </button>

            <div
                data-testid="card-list"
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    flexGrow: 1,
                    overflow: 'hidden',
                    padding: '10px 4px'
                }}
            >
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                    <SortableContext items={cards.map((c) => c.id)} strategy={horizontalListSortingStrategy}>
                        {cards.map((card) => (
                            <MiniCard
                                key={card.id}
                                id={card.id}
                                cells={card.cells}
                                selected={card.id === selectedId}
                                playing={card.id === playingId}
                                flash={card.id === flashId}
                                locked={running}
                                onSelect={onSelect}
                                onDelete={onDelete}
                            />
                        ))}
                    </SortableContext>
                </DndContext>
                <EmptySlot />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                <button
                    className="press-soft"
                    data-testid="export"
                    aria-label="export"
                    onClick={onExport}
                    style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: WHITE,
                        border: `2px solid ${SLOT_COLOR.final}`,
                        color: SLOT_COLOR.final,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <SaveIcon size={22} />
                </button>
                <button
                    className="press-soft"
                    data-testid="import"
                    aria-label="import"
                    onClick={() => fileRef.current?.click()}
                    style={{
                        width: 44,
                        height: 44,
                        borderRadius: 12,
                        background: WHITE,
                        border: `2px solid ${SLOT_COLOR.medial}`,
                        color: SLOT_COLOR.medial,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <ImportIcon size={22} />
                </button>
                <input
                    ref={fileRef}
                    data-testid="import-input"
                    type="file"
                    accept=".json,application/json"
                    style={{ display: 'none' }}
                    onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) onImport(f);
                        // 同一個檔連續匯入兩次也要能觸發 change。
                        e.target.value = '';
                    }}
                />
            </div>
        </div>
    );
}

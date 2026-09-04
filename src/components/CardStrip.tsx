'use client';

import { useRef } from 'react';
import { Box, Flex } from '@chakra-ui/react';
import {
    DndContext,
    PointerSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { isLegalCard, type Card } from '@/lib/deck';
import { EMPTY_BORDER, SLOT_COLOR } from '@/lib/palette';
import { ExportIcon, ImportIcon, PlayAllIcon, StopIcon } from './Icons';
import { MiniCard } from './MiniCard';

export interface CardStripProps {
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
     * 整欄一起淡淡發光，不假裝逐卡同步。
     */
    glow: boolean;
    /** 匯入失敗，整欄閃紅框。 */
    importError: boolean;
    onSelect: (id: string) => void;
    onDelete: (id: string) => void;
    onReorder: (fromId: string, toId: string) => void;
    onPlayAll: () => void;
    onExport: () => void;
    onImport: (file: File) => void;
}

export function CardStrip({
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
}: CardStripProps) {
    const fileRef = useRef<HTMLInputElement>(null);

    // distance 5：小於 5px 的位移算點擊（單張播放），超過才進入拖曳。
    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

    const onDragEnd = (e: DragEndEvent) => {
        const { active, over } = e;
        if (over && active.id !== over.id) onReorder(String(active.id), String(over.id));
    };

    return (
        <Flex
            data-testid="card-strip"
            data-import-error={importError ? 'true' : 'false'}
            direction="column"
            align="center"
            gap="14px"
            padding="12px"
            borderRadius="20px"
            style={{
                border: importError ? '4px solid #E03131' : '4px solid transparent',
                background: importError ? '#FFF5F5' : 'transparent',
                transition: 'border-color 120ms ease-out, background 120ms ease-out'
            }}
        >
            {/* 頂端：整列播放 ／ 播放中變成停止 */}
            <Box
                as="button"
                data-testid="play-all"
                aria-label="play-all"
                onClick={onPlayAll}
                width="120px"
                height="60px"
                borderRadius="18px"
                display="flex"
                alignItems="center"
                justifyContent="center"
                cursor="pointer"
                style={{
                    border: 'none',
                    background: running ? '#FFD43B' : '#FFC078',
                    color: '#212529'
                }}
            >
                {running ? <StopIcon size={30} /> : <PlayAllIcon size={34} />}
            </Box>

            <Flex
                data-testid="card-list"
                direction="column"
                align="center"
                gap="16px"
                maxHeight={{ base: 'none', lg: '58vh' }}
                overflowY={{ base: 'visible', lg: 'auto' }}
                paddingX="12px"
                paddingY="10px"
                minWidth="150px"
                minHeight="90px"
                borderRadius="18px"
                data-deck-glow={glow ? 'true' : 'false'}
                style={{
                    boxShadow: glow ? '0 0 22px 6px rgba(255, 212, 59, 0.75)' : 'none',
                    background: glow ? 'rgba(255, 249, 219, 0.9)' : 'transparent',
                    transition: 'box-shadow 200ms ease-out, background 200ms ease-out'
                }}
            >
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
                    <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                        {cards.map((card) => (
                            <MiniCard
                                key={card.id}
                                id={card.id}
                                cells={card.cells}
                                selected={card.id === selectedId}
                                playing={card.id === playingId}
                                flash={card.id === flashId}
                                illegal={!isLegalCard(card)}
                                locked={running}
                                onSelect={onSelect}
                                onDelete={onDelete}
                            />
                        ))}
                    </SortableContext>
                </DndContext>

                {cards.length === 0 && (
                    <Box
                        width="120px"
                        height="150px"
                        borderRadius="16px"
                        style={{ border: `3px dashed ${EMPTY_BORDER}` }}
                    />
                )}
            </Flex>

            {/* 底部：匯出 ／ 匯入 */}
            <Flex gap="12px">
                <Box
                    as="button"
                    data-testid="export"
                    aria-label="export"
                    onClick={onExport}
                    width="56px"
                    height="56px"
                    borderRadius="16px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    style={{ border: `3px solid ${SLOT_COLOR.final.base}`, color: SLOT_COLOR.final.base, background: '#FFFFFF' }}
                >
                    <ExportIcon size={28} />
                </Box>
                <Box
                    as="button"
                    data-testid="import"
                    aria-label="import"
                    onClick={() => fileRef.current?.click()}
                    width="56px"
                    height="56px"
                    borderRadius="16px"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    cursor="pointer"
                    style={{ border: `3px solid ${SLOT_COLOR.medial.base}`, color: SLOT_COLOR.medial.base, background: '#FFFFFF' }}
                >
                    <ImportIcon size={28} />
                </Box>
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
            </Flex>
        </Flex>
    );
}

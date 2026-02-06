import React, { useEffect, useMemo, useState } from 'react';
import { 
    DndContext, 
    closestCenter, 
    KeyboardSensor, 
    PointerSensor, 
    useSensor, 
    useSensors, 
    DragEndEvent
} from '@dnd-kit/core';
import { 
    SortableContext, 
    sortableKeyboardCoordinates, 
    rectSortingStrategy,
    arrayMove
} from '@dnd-kit/sortable';
import { useCardStore } from '../../stores/cardStore';
import { BaseCard } from './BaseCard';
import { CARD_META } from './types';
import { CARD_COMPONENTS, PlaceholderCard } from './registry';
import { CardConfigModal } from './CardConfigModal';
import styles from './CardManager.module.scss';
import { DesktopCard } from '../../stores/cardStore';

export const CardManager: React.FC = () => {
    const { cards, loading, loadCards, addCard, updateCard, reorderCards } = useCardStore();
    const [editingCard, setEditingCard] = useState<DesktopCard | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 10,
            }
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        loadCards();
    }, [loadCards]);

    /**
     * 过滤重复卡片类型并按置顶状态排序
     */
    /**
     * 过滤重复卡片类型并按置顶状态排序
     */
    const uniqueCards = useMemo(() => {
        const seen = new Set<string>();
        const filtered = cards.filter(card => {
            if (seen.has(card.type)) return false;
            seen.add(card.type);
            return true;
        });
        
        return filtered.sort((a, b) => {
            const aPinned = a.parsedConfig?.isPinned ? 1 : 0;
            const bPinned = b.parsedConfig?.isPinned ? 1 : 0;
            return bPinned - aPinned;
        });
    }, [cards]);

    const initializingRef = React.useRef(new Set<string>());

    useEffect(() => {
        if (loading) return;
        
        const existingTypes = new Set(cards.map(c => c.type));
        const missingTypes = Object.keys(CARD_META).filter(t => 
            !existingTypes.has(t) && !initializingRef.current.has(t)
        );
        
        if (missingTypes.length > 0) {
            missingTypes.forEach(type => {
                initializingRef.current.add(type);
                const meta = CARD_META[type as keyof typeof CARD_META];
                addCard(type, meta.name, {
                    bgColor: '#ffffff',
                    textColor: '#000000',
                    width: meta.defaultWidth,
                    height: meta.defaultHeight
                });
            });
        }
    }, [cards, loading, addCard]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = cards.findIndex((c) => c.id === active.id);
            const newIndex = cards.findIndex((c) => c.id === over.id);
            
            if (oldIndex !== -1 && newIndex !== -1) {
                const newOrder = arrayMove(cards, oldIndex, newIndex).map(c => c.id);
                reorderCards(newOrder);
            }
        }
    };

    return (
        <div className={styles.container}>
            <DndContext 
                sensors={sensors} 
                collisionDetection={closestCenter} 
                onDragEnd={handleDragEnd}
            >
                <SortableContext 
                    items={uniqueCards.map(c => c.id)}
                    strategy={rectSortingStrategy}
                >
                    <div className={styles.grid}>
                        {uniqueCards.map((card) => {
                            const Component = CARD_COMPONENTS[card.type] || PlaceholderCard;
                            const width = card.width || CARD_META[card.type as keyof typeof CARD_META]?.defaultWidth || 300;
                            let size: 'small' | 'medium' | 'large' = 'medium';
                            if (width <= 240) size = 'small';
                            else if (width >= 361) size = 'large';

                            return (
                                <BaseCard 
                                    key={card.id} 
                                    card={card} 
                                    isEditing={true}
                                    onEdit={(c) => setEditingCard(c)}
                                >
                                    <Component 
                                        card={card} 
                                        size={size}
                                        onUpdate={(newConfig: any) => updateCard(card.id, card.title || '', { ...card.parsedConfig, ...newConfig })}
                                    />
                                </BaseCard>
                            );
                        })}
                    </div>
                </SortableContext>
            </DndContext>

            <CardConfigModal 
                visible={!!editingCard}
                card={editingCard}
                onClose={() => setEditingCard(null)}
            />
        </div>
    );
};

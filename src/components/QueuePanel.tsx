import React from 'react';
import { X, GripVertical, Play } from 'lucide-react';
import { motion } from 'framer-motion';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    useSortable,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { usePlayerStore, type Track } from '../stores/usePlayerStore';

interface QueuePanelProps {
    onClose: () => void;
}

interface SortableTrackProps {
    track: Track;
    index: number;
    onPlay: () => void;
    onRemove: () => void;
}

const SortableTrack: React.FC<SortableTrackProps> = ({ track, index, onPlay, onRemove }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: track.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group flex items-center gap-3 p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors ${isDragging ? 'opacity-50' : ''
                }`}
        >
            {/* Drag Handle */}
            <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
                <GripVertical className="w-4 h-4 text-white/40 group-hover:text-white/60" />
            </div>

            {/* Track Number */}
            <span className="text-xs font-mono text-white/40 w-6">{index + 1}</span>

            {/* Album Art */}
            <div className="relative w-10 h-10 flex-shrink-0">
                <img
                    src={track.coverUrl}
                    alt={track.title}
                    className="w-full h-full object-cover rounded"
                />
                <button
                    onClick={onPlay}
                    className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                >
                    <Play className="w-4 h-4 text-white fill-current" />
                </button>
            </div>

            {/* Track Info */}
            <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{track.title}</p>
                <p className="text-xs text-white/60 truncate">{track.artist}</p>
            </div>

            {/* Remove Button */}
            <button
                onClick={onRemove}
                className="w-6 h-6 flex items-center justify-center text-white/40 hover:text-primary transition-colors opacity-0 group-hover:opacity-100"
            >
                <X className="w-4 h-4" />
            </button>
        </div>
    );
};

export const QueuePanel: React.FC<QueuePanelProps> = ({ onClose }) => {
    const { queue, reorderQueue, removeFromQueue, playTrack } = usePlayerStore();

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (over && active.id !== over.id) {
            const oldIndex = queue.findIndex((t) => t.id === active.id);
            const newIndex = queue.findIndex((t) => t.id === over.id);
            reorderQueue(oldIndex, newIndex);
        }
    };

    return (
        <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="w-96 bg-black/60 backdrop-blur-xl border-l border-white/10 rounded-lg overflow-hidden flex flex-col"
        >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10">
                <div>
                    <h3 className="font-display text-xl uppercase tracking-tight text-white">Up Next</h3>
                    <p className="text-xs text-white/60 uppercase tracking-wider mt-1">
                        {queue.length} {queue.length === 1 ? 'track' : 'tracks'}
                    </p>
                </div>
                <button
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            {/* Queue List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {queue.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                            <Play className="w-8 h-8 text-white/40" />
                        </div>
                        <p className="text-sm text-white/60">No tracks in queue</p>
                        <p className="text-xs text-white/40 mt-2">Search for music to get started</p>
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={queue.map((t) => t.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            {queue.map((track, index) => (
                                <SortableTrack
                                    key={track.id}
                                    track={track}
                                    index={index}
                                    onPlay={() => playTrack(track)}
                                    onRemove={() => removeFromQueue(index)}
                                />
                            ))}
                        </SortableContext>
                    </DndContext>
                )}
            </div>
        </motion.div>
    );
};

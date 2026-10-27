import * as React from 'react';
import {useSortable} from '@dnd-kit/sortable';
import {prefixCls} from '../shared/prefixCls';

/**
 * Convert a @dnd-kit transform ({x,y,scaleX,scaleY}) to a CSS transform string
 * without depending on @dnd-kit/utilities (which isn't a direct dep).
 */
function transformStyle(transform: {x: number; y: number; scaleX: number; scaleY: number} | null): string | undefined {
    if (!transform) return undefined;
    return `translate3d(${transform.x}px, ${transform.y}px, 0)`;
}

export interface SortableItemProps {
    /** Stable id for this row (used as the dnd-kit sortable id). */
    id: string;
    /** Zero-based row index. */
    index: number;
    /** Total rows in the array (for disabling up/down on the ends). */
    total: number;
    /** Minimum rows; the remove button disables at or below this. */
    min?: number;
    /** Remove this row. */
    onRemove: () => void;
    /** Move this row up. */
    onMoveUp: () => void;
    /** Move this row down. */
    onMoveDown: () => void;
    /** Row content (rendered inside a FieldContext scoped to this row). */
    children?: React.ReactNode;
}

/**
 * A single draggable array row: a drag handle, the row content, and up/down/
 * remove action buttons. Uses @dnd-kit/sortable's `useSortable` for drag.
 */
export function SortableItem({
    id,
    index,
    total,
    min,
    onRemove,
    onMoveUp,
    onMoveDown,
    children,
}: SortableItemProps): React.ReactElement {
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} =
        useSortable({id});
    const style: React.CSSProperties = {
        transform: transformStyle(transform ?? null),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };
    const atTop = index <= 0;
    const atBottom = index >= total - 1;
    const removeDisabled = min != null && total <= min;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`${prefixCls}-array-item${isDragging ? ` ${prefixCls}-array-item-dragging` : ''}`}
        >
            <span
                className={`${prefixCls}-array-item-handle`}
                {...attributes}
                {...listeners}
                title="拖拽排序"
            >
                ⋮⋮
            </span>
            <div className={`${prefixCls}-array-item-content`}>{children}</div>
            <div className={`${prefixCls}-array-item-actions`}>
                <button
                    type="button"
                    className={`${prefixCls}-array-item-up`}
                    onClick={onMoveUp}
                    disabled={atTop}
                    title="上移"
                >
                    ↑
                </button>
                <button
                    type="button"
                    className={`${prefixCls}-array-item-down`}
                    onClick={onMoveDown}
                    disabled={atBottom}
                    title="下移"
                >
                    ↓
                </button>
                <button
                    type="button"
                    className={`${prefixCls}-array-item-remove`}
                    onClick={onRemove}
                    disabled={removeDisabled}
                    title="删除"
                >
                    ×
                </button>
            </div>
        </div>
    );
}

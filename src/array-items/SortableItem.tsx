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

export interface ArrayRowProps {
    /** Optional drag handle node (rendered when drag-sort is enabled). */
    handle?: React.ReactNode;
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
 * Presentational array row: an optional drag handle slot, the row content, and
 * up/down/remove action buttons. Drag-agnostic — the handle is supplied by the
 * caller (a sortable wrapper when dragable, nothing otherwise).
 */
export function ArrayRow({
    handle,
    index,
    total,
    min,
    onRemove,
    onMoveUp,
    onMoveDown,
    children,
}: ArrayRowProps): React.ReactElement {
    const atTop = index <= 0;
    const atBottom = index >= total - 1;
    const removeDisabled = min != null && total <= min;

    return (
        <div className={`${prefixCls}-array-item`}>
            {handle}
            <div className={`${prefixCls}-array-item-content`}>{children}</div>
            <div className={`${prefixCls}-array-item-actions`}>
                <button
                    type="button"
                    className={`${prefixCls}-array-item-up`}
                    onClick={onMoveUp}
                    disabled={atTop}
                    title="上移"
                    aria-label="上移"
                >
                    ↑
                </button>
                <button
                    type="button"
                    className={`${prefixCls}-array-item-down`}
                    onClick={onMoveDown}
                    disabled={atBottom}
                    title="下移"
                    aria-label="下移"
                >
                    ↓
                </button>
                <button
                    type="button"
                    className={`${prefixCls}-array-item-remove`}
                    onClick={onRemove}
                    disabled={removeDisabled}
                    title="删除"
                    aria-label="删除"
                >
                    ×
                </button>
            </div>
        </div>
    );
}

export interface SortableItemProps extends Omit<ArrayRowProps, 'handle'> {
    /** Stable id for this row (used as the dnd-kit sortable id). */
    id: string;
}

/** A draggable array row wrapping `ArrayRow` with @dnd-kit's `useSortable`. */
export function SortableItem({id, ...rest}: SortableItemProps): React.ReactElement {
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} =
        useSortable({id});
    const style: React.CSSProperties = {
        transform: transformStyle(transform ?? null),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    const handle = (
        <span
            className={`${prefixCls}-array-item-handle`}
            {...attributes}
            {...listeners}
            title="拖拽排序"
        >
            <DragHandleIcon />
        </span>
    );

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`${prefixCls}-array-item${isDragging ? ` ${prefixCls}-array-item-dragging` : ''}`}
        >
            {handle}
            <div className={`${prefixCls}-array-item-content`}>{rest.children}</div>
            <div className={`${prefixCls}-array-item-actions`}>
                <button
                    type="button"
                    className={`${prefixCls}-array-item-up`}
                    onClick={rest.onMoveUp}
                    disabled={rest.index <= 0}
                    title="上移"
                    aria-label="上移"
                >
                    ↑
                </button>
                <button
                    type="button"
                    className={`${prefixCls}-array-item-down`}
                    onClick={rest.onMoveDown}
                    disabled={rest.index >= rest.total - 1}
                    title="下移"
                    aria-label="下移"
                >
                    ↓
                </button>
                <button
                    type="button"
                    className={`${prefixCls}-array-item-remove`}
                    onClick={rest.onRemove}
                    disabled={rest.min != null && rest.total <= rest.min}
                    title="删除"
                    aria-label="删除"
                >
                    ×
                </button>
            </div>
        </div>
    );
}

/** Six-dot grip icon for the drag handle. */
function DragHandleIcon(): React.ReactElement {
    return (
        <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" aria-hidden>
            <circle cx="2" cy="3" r="1.2" />
            <circle cx="8" cy="3" r="1.2" />
            <circle cx="2" cy="8" r="1.2" />
            <circle cx="8" cy="8" r="1.2" />
            <circle cx="2" cy="13" r="1.2" />
            <circle cx="8" cy="13" r="1.2" />
        </svg>
    );
}

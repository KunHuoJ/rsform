import * as React from 'react';
import {ArrayField as FormilyArrayField, useField} from '@formily/react';
import {observer} from '@formily/reactive-react';
import {
    DndContext,
    PointerSensor,
    KeyboardSensor,
    closestCenter,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {prefixCls} from '../shared/prefixCls';
import {FieldContext} from '../shared/FieldContext';
import {useContentName} from '../field/useContentName';
import {ArrayFieldContext} from './useArrayItems';
import {ArrayRow, SortableItem} from './SortableItem';

export interface ArrayItemsProps {
    /** Array field name; may be relative (`.foo`, `..foo`) against the parent context. */
    name: string;
    /** Default value pushed when adding a new row. Defaults to `{}`. */
    itemDefaultValue?: any;
    /** Minimum number of rows; the remove button disables at or below this. */
    min?: number;
    /** Maximum number of rows; the add button disables at or above this. */
    max?: number;
    /**
     * Gate adding a new row. Receives `(values, itemDefaultValue)` and returns
     * `true`/void to allow, `false` to silently block, or a `string` to block and
     * surface as a form error.
     */
    validateBeforeAdd?: (values: any[], itemDefaultValue: any) => boolean | string | void;
    /** Label for the add button. Defaults to '添加'. */
    addText?: React.ReactNode;
    /** Hide the add button entirely. */
    addDisabled?: boolean;
    /**
     * Enable drag-to-sort via @dnd-kit. Defaults to `false` — most forms only
     * need add/remove; set `dragable` for ordered lists (priorities, steps).
     * When off, rows render as a plain list with up/down/remove buttons.
     */
    dragable?: boolean;
    /**
     * Row content. A render-prop `(value, index) => ReactNode` is typical —
     * return relative-name Fields (e.g. `<Field name=".label">`) which resolve
     * against this row's path scope.
     */
    children?: ((value: any, index: number) => React.ReactNode) | React.ReactNode;
}

/** Stable per-row id derived from the array name + row index. */
function rowId(name: string, index: number): string {
    return `${name}#${index}`;
}

function parseRowId(name: string, id: string): number {
    const suffix = String(id).slice(name.length + 1);
    const n = Number(suffix);
    return Number.isFinite(n) ? n : -1;
}

/**
 * The reactive body of ArrayItems: lives inside the Formily `<ArrayField>` so
 * `useField()` returns the array field model. `observer` makes it re-render on
 * value/length changes.
 */
const ArrayItemsBody = observer(function ArrayItemsBody({
    name,
    itemDefaultValue,
    min,
    max,
    validateBeforeAdd,
    addText,
    addDisabled,
    dragable,
    children,
}: Omit<ArrayItemsProps, 'name'> & {name: string}): React.ReactElement {
    const field: any = useField();
    const values: any[] = Array.isArray(field?.value) ? field.value : [];

    const sensors = useSensors(
        useSensor(PointerSensor, {activationConstraint: {distance: 4}}),
        useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates}),
    );

    const ids = values.map((_, i) => rowId(name, i));

    const handleDragEnd = (e: DragEndEvent) => {
        const {active, over} = e;
        if (!over || active.id === over.id) return;
        const from = parseRowId(name, String(active.id));
        const to = parseRowId(name, String(over.id));
        if (from < 0 || to < 0) return;
        field?.move(from, to);
    };

    const atMax = max != null && values.length >= max;
    const handleAdd = async () => {
        if (atMax) return;
        if (validateBeforeAdd) {
            const result = validateBeforeAdd(values, itemDefaultValue);
            if (result === false) return;
            if (typeof result === 'string') {
                field?.setFeedback({type: 'error', messages: [result]});
                return;
            }
        }
        await field?.push(itemDefaultValue ?? {});
    };
    const handleRemove = (index: number) => {
        if (min != null && values.length <= min) return;
        field?.remove(index);
    };

    const renderRow = (value: any, index: number): React.ReactNode => {
        const rowPath = `${name}.${index}`;
        const content =
            typeof children === 'function'
                ? (children as (v: any, i: number) => React.ReactNode)(value, index)
                : children;
        const rowProps = {
            index,
            total: values.length,
            min,
            onRemove: () => handleRemove(index),
            onMoveUp: () => field?.moveUp(index),
            onMoveDown: () => field?.moveDown(index),
            children: content,
        };
        return (
            <FieldContext.Provider
                key={rowId(name, index)}
                value={{preName: rowPath, name: rowPath, state: null}}
            >
                {dragable ? (
                    <SortableItem id={rowId(name, index)} {...rowProps} />
                ) : (
                    <ArrayRow {...rowProps} />
                )}
            </FieldContext.Provider>
        );
    };

    return (
        <ArrayFieldContext.Provider value={field}>
            <div className={`${prefixCls}-array-items`}>
                {dragable ? (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                            {values.map((v, i) => renderRow(v, i))}
                        </SortableContext>
                    </DndContext>
                ) : (
                    values.map((v, i) => renderRow(v, i))
                )}
                {!addDisabled && (
                    <button
                        type="button"
                        className={`${prefixCls}-array-items-add`}
                        onClick={handleAdd}
                        disabled={atMax}
                    >
                        {addText ?? '添加'}
                    </button>
                )}
            </div>
        </ArrayFieldContext.Provider>
    );
});

/**
 * rsform ArrayItems: a draggable, editable array list backed by a Formily
 * `ArrayField`. Each row is sortable via @dnd-kit with up/down/remove buttons;
 * `min`/`max`/`validateBeforeAdd` gate mutations. Row content is a render-prop
 * receiving `(value, index)` and runs inside a FieldContext scoped to that
 * row's path, so relative-name Fields (`.foo`) resolve to `name.index.foo`.
 */
export function ArrayItems(props: ArrayItemsProps): React.ReactElement {
    const {name, ...rest} = props;
    const resolvedName = useContentName(name);
    return (
        <FormilyArrayField name={resolvedName} basePath="">
            <ArrayItemsBody name={resolvedName} {...rest} />
        </FormilyArrayField>
    );
}

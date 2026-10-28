/**
 * rsform/array-items — a draggable, editable array list backed by a Formily
 * ArrayField, with @dnd-kit/sortable drag reordering and min/max/
 * validateBeforeAdd gating. Also exports `arrayUnion` for cross-row
 * uniqueness validation.
 */
import { Form as BaseForm } from '../form/FormNamespace';
import { ArrayItems } from './ArrayItems';

export type { ArrayItemsProps } from './ArrayItems';

import { arrayUnion } from './arrayUnion';
import { ArrayFieldContext, useArrayField } from './useArrayItems';

export type { ArrayUnionValidator } from './arrayUnion';

/**
 * The rsform.Form namespace as exposed by the `rsform/array-items` subpath:
 * the bare Form plus ArrayItems attached as a static property. `Object.assign`
 * mutates the shared Form object in place (so the bare Form also gains
 * ArrayItems once this subpath is imported) and widens the type to include it.
 */
export type ArrayItemsForm = typeof BaseForm & {
    ArrayItems: typeof ArrayItems;
};

export const Form: ArrayItemsForm = Object.assign(BaseForm, {
    ArrayItems,
}) as ArrayItemsForm;

export { ArrayFieldContext, ArrayItems, arrayUnion, useArrayField };

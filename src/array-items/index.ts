/**
 * Lightweight add/remove/move list backed by a Formily ArrayField, in the
 * spirit of antd's Form.List. `min`/`max`/`validateBeforeAdd` gate mutations;
 * up/down buttons reorder via Formily mutators (no drag lib). Also exports
 * `arrayUnion` for cross-row uniqueness validation.
 */
import { Form as BaseForm } from '../form/FormNamespace';
import { ArrayItems } from './ArrayItems';

export type { ArrayItemsProps } from './ArrayItems';

import { arrayUnion } from './arrayUnion';
import { ArrayFieldContext, useArrayField } from './useArrayItems';

export type { ArrayUnionValidator } from './arrayUnion';

/**
 * Form namespace helper: attaches ArrayItems onto the shared Form as
 * `Form.ArrayItems`. rsform's single entry (`src/index.ts`) re-exports
 * `ArrayItems` and attaches it there; this barrel is the implementation
 * surface for the array-items module.
 */
export type ArrayItemsForm = typeof BaseForm & {
    ArrayItems: typeof ArrayItems;
};

export const Form: ArrayItemsForm = Object.assign(BaseForm, {
    ArrayItems,
}) as ArrayItemsForm;

export { ArrayFieldContext, ArrayItems, arrayUnion, useArrayField };

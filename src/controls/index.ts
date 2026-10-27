/**
 * rsform/antd — antd 5 control wrappers.
 *
 * Bare `rsform` keeps Form/Field antd-agnostic; this subpath adds the antd
 * controls and attaches them onto the Form namespace (Form.Input, …).
 */
import {Form} from '../form/FormNamespace';
import {Input, TextArea} from './Input';
import {prefixCls} from '../shared/prefixCls';

// Attach antd controls onto the Form namespace for ergonomic access.
(Form as any).Input = Input;
(Form as any).TextArea = TextArea;

export {Input, TextArea};
export {prefixCls};
export {Form} from '../form/FormNamespace';

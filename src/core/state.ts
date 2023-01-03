import { MutableProperty, ReadableProperty } from "./property";

type Primitive = number | string | boolean | bigint | symbol | undefined | null;
type Builtin = Primitive | Function | Date | Error | RegExp;

/**
 * 変更不可な状態を表す型
 */
export type ReadonlyState<T> = T extends Builtin ? T
  : T extends MutableProperty ? ReadableProperty
  : { readonly [key in keyof T]: ReadonlyState<T[key]> }
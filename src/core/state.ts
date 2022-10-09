import { cloneDeepWith } from "lodash";

type Primitive = number | string | boolean | bigint | symbol | undefined | null;
type Builtin = Primitive | Function | Date | Error | RegExp;

/**
 * 変更不可な状態を表す型
 */
export type ReadonlyState<T> = T extends Builtin
  ? T
  : { readonly [key in keyof T]: ReadonlyState<T[key]> }

/**
 * 状態を再帰的にコピーする
 * @param state 現在の状態
 * @returns 
 */
export function copyState<T>(state: ReadonlyState<T>): T {
  return cloneDeepWith(state, (value) => {
    if (typeof value === "function") return value
  }) as T
}

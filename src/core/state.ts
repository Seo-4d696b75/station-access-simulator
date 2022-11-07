import { cloneDeepWith, merge } from "lodash";
import { MutableProperty } from "./property";

type Primitive = number | string | boolean | bigint | symbol | undefined | null;
type Builtin = Primitive | Function | Date | Error | RegExp;

/**
 * 変更不可な状態を表す型
 */
export type ReadonlyState<T> = T extends Builtin ? T
  : T extends MutableProperty ? Omit<T, keyof MutableProperty>
  : { readonly [key in keyof T]: ReadonlyState<T[key]> }

/**
 * 状態を再帰的にコピーする
 * @param state 現在の状態
 * @returns 新しい状態オブジェクト
 */
export function copyState<T>(state: ReadonlyState<T>): T {
  return cloneDeepWith(state, (value) => {
    if (typeof value === "function") return value
  }) as T
}

/**
 * 状態を再帰的にコピーして更新する（破壊的）
 * 
 * - dstにのみ存在するプロパティ：そのまま
 * - src,dst両方にあるプロパティ：srcの値で上書き
 * 
 * @param src コピーする新しい状態（変更されない）
 * @param dst 更新される現在の状態（変更される）
 */
export function copyStateTo<T>(src: ReadonlyState<T>, dst: T) {
  merge(dst, src)
}

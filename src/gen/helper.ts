import { merge as mergeAny } from "lodash"
import { ReadonlyState } from "../core/state"

type BaseTypeSchema<T extends string> = {
  type: T
}

type PrimitiveSchema = BaseTypeSchema<"primitive">

type ArraySchema<T> = {
  type: "array"
  element: SchemaOf<T>
}

type ObjectSchema<T> = {
  type: "object",
  fields: Required<{
    [key in keyof T]: SchemaOf<T[key]>
  }>
}

type FunctionSchema = BaseTypeSchema<"function">

type CustomSchema<T = any> = {
  type: "custom"
  copy: (src: T) => T
  merge: (dst: T, src: T) => void
  normalize?: (src: T) => T
}


type SchemaOf<T> =
  T extends string | number | boolean ? PrimitiveSchema :
  T extends ((...arg: any[]) => any) ? FunctionSchema | CustomSchema :
  T extends readonly (infer U)[] ? ArraySchema<U> | CustomSchema :
  T extends Object ? ObjectSchema<T> | CustomSchema : never

export function createCopyFunc<T>(schema: SchemaOf<T>): (src: ReadonlyState<T>) => T {
  return (src) => copy(schema, src)
}

export function createMergeFunc<T>(schema: SchemaOf<T>): (dst: T, src: ReadonlyState<T>) => void {
  return (dst, src) => merge(schema, dst, src)
}

export function createMatcher<T>(
  schema: SchemaOf<T>,
): (
  received: T,
  expected: T,
  ...mergeWithExpected: any[]
) => jest.CustomMatcherResult {
  const normalizeFunc = (src: any): any => normalize(schema, src)
  return (received, expected, ...mergeWithExpected) => {
    // Tの型として比較したい場合において、Tのサブタイプのオブジェクトを
    // 直接比較するとサブタイプのみ定義されたプロパティの不一致で検証が失敗する場合がある
    const copyReceived = normalizeFunc(received)
    const copyExpected = mergeAny(normalizeFunc(expected), ...mergeWithExpected)
    try {
      expect(copyReceived).toMatchObject(copyExpected)
      return {
        pass: true,
        message: () => "definitely matched as DencoState",
      }
    } catch (e: any) {
      return {
        pass: false,
        message: () => String(e)
      }
    }
  }
}

function copy<T>(schema: SchemaOf<T>, src: ReadonlyState<T>): T {
  if (src === undefined || src === null) return src as T
  switch (schema.type) {
    case "primitive":
      return src as T
    case "array":
      return copyArray(schema.element, src as any) as any
    case "object":
      return copyObject(schema, src as any)
    case "function":
      return src as T
    case "custom":
      return schema.copy(src)
  }
}

function copyArray<T>(schema: SchemaOf<T>, array: ReadonlyState<T>[]): T[] {
  return array.map(d => copy(schema, d)) as any
}

function copyObject<T>(schema: ObjectSchema<T>, obj: T): T {
  const dst: any = {}
  const keys = Object.getOwnPropertyNames(obj)
  Object.entries(schema.fields).forEach(pair => {
    const [key, s] = pair
    if (keys.includes(key)) {
      dst[key] = copy(s as any, obj[key as keyof T] as any)
    }
  })
  return dst
}

function merge<T>(schema: SchemaOf<T>, dst: any, src: any): any {
  if (src === undefined || src === null) {
    return src
  }
  if (dst === undefined || dst === null) {
    return copy(schema, src)
  }
  switch (schema.type) {
    case "primitive":
      return src
    case "array":
      return mergeArray<T>(schema.element, dst, src)
    case "object":
      return mergeObject(schema, dst, src)
    case "function":
      return src
    case "custom":
      return mergeCustom(schema, dst, src)
  }
}

function mergeArray<T>(schema: SchemaOf<T>, dst: T[], src: ReadonlyState<T>[]): T[] {
  for (let i = 0; i < src.length; i++) {
    if (i < dst.length) {
      // merge item
      merge(schema, dst[i], src[i])
    } else {
      // copy src to dst
      dst.push(copy(schema, src[i]))
    }
  }
  if (dst.length > src.length) {
    // delete from dst
    dst.splice(src.length, dst.length - src.length)
  }
  return dst
}

function mergeObject<T>(schema: ObjectSchema<T>, dst: T, src: T): T {
  const dstKeys = Object.getOwnPropertyNames(dst) as (keyof T)[]
  const srcKeys = Object.getOwnPropertyNames(src) as (keyof T)[]
  Object.entries(schema.fields).forEach(pair => {
    const key = pair[0] as keyof T
    const s = pair[1] as SchemaOf<any>

    if (srcKeys.includes(key)) {
      if (dstKeys.includes(key)) {
        // merge recursively
        dst[key] = merge(s, dst[key], src[key])
      } else {
        // copy src to dst
        dst[key] = copy(s, src[key])
      }
    } else {
      if (dstKeys.includes(key)) {
        // delete
        delete dst[key]
      }
    }
  })
  return dst
}

function mergeCustom<T>(schema: CustomSchema<T>, dst: any, src: any): any {
  schema.merge(dst, src)
  return dst
}

function normalize<T>(schema: SchemaOf<T>, src: any): T {
  if (src === undefined || src === null) return src as T
  switch (schema.type) {
    case "primitive":
      return src as T
    case "array":
      return normalizeArray(schema.element, src as any) as any
    case "object":
      return normalizeObject(schema, src as any)
    case "function":
      return src as T
    case "custom":
      return (schema.normalize ? schema.normalize : schema.copy)(src)
  }
}

function normalizeArray<T>(schema: SchemaOf<T>, array: ReadonlyState<T>[]): T[] {
  return array.map(d => normalize(schema, d)) as any
}

function normalizeObject<T>(schema: ObjectSchema<T>, obj: T): T {
  const dst: any = {}
  const keys = Object.getOwnPropertyNames(obj)
  Object.entries(schema.fields).forEach(pair => {
    const [key, s] = pair
    if (keys.includes(key)) {
      dst[key] = normalize(s as any, obj[key as keyof T] as any)
    }
  })
  return dst
}

export const primitiveSchema: PrimitiveSchema = {
  type: "primitive",
} as const

export const functionSchema: FunctionSchema = {
  type: "function"
} as const

export function objectSchema<T>(fields: Required<{ [key in keyof T]: SchemaOf<T[key]> }>): ObjectSchema<T> {
  return {
    type: "object",
    fields: fields
  }
}

export function arraySchema<T>(element: SchemaOf<T>): ArraySchema<T> {
  return {
    type: "array",
    element: element
  }
}

/**
 * 
 * @param copy deep copyの方法
 * @param merge dstにsrcをコピーする方法
 * @param normalize jestのcustom matcherで比較するとき前処理で変換する方法
 * @returns 
 */
export function customSchema<T>(
  copy: (src: T) => T,
  merge: (dst: T, src: T) => void,
  normalize?: (src: T) => T,
): CustomSchema<T> {
  return {
    type: "custom",
    copy: copy,
    merge: merge,
    normalize: normalize
  }
}

import { ReadonlyState } from "./state"

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
  fields: {
    [key in keyof T]: SchemaOf<T[key]>
  }
}

type FunctionSchema = BaseTypeSchema<"function">

type CustomSchema<T = any> = {
  type: "custom"
  copy: (src: T) => T
  merge: (dst: T, src: T) => void
}


type SchemaOf<T> =
  T extends string | number | boolean ? PrimitiveSchema :
  T extends ((...arg: any[]) => any) ? FunctionSchema | CustomSchema :
  T extends readonly (infer U)[] ? ArraySchema<U> | CustomSchema :
  T extends Object ? ObjectSchema<T> | CustomSchema : never

export interface TypedCopyFunc<T> {
  copy: (src: ReadonlyState<T>) => T
  merge: (dst: T, src: ReadonlyState<T>) => void
}

export function createCopyFunc<T>(schema: ObjectSchema<T>): (src: ReadonlyState<T>) => T {
  return (src) => copy(schema as SchemaOf<T>, src)
}

export function createMergeFunc<T>(schema: ObjectSchema<T>): (dst: T, src: ReadonlyState<T>) => void {
  return (dst, src) => merge(schema as SchemaOf<T>, dst, src)
}

export function defineCopyFunc<T>(schema: ObjectSchema<T>): TypedCopyFunc<T> {
  return {
    copy: (src) => copy(schema as SchemaOf<T>, src),
    merge: (dst, src) => merge(schema as SchemaOf<T>, dst, src)
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
      return copyObject(schema, src as any) as T
    case "function":
      return src as T
    case "custom":
      return copyCustom(schema, src)
  }
}

function copyArray<T>(schema: SchemaOf<T>, array: ReadonlyState<T>[]): T[] {
  return array.map(d => copy(schema, d as any))
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

function copyCustom<T>(schema: CustomSchema<T>, value: any): any {
  return schema.copy(value)
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

export function customSchema<T>(copy: (src: T) => T, merge: (dst: T, src: T) => void): CustomSchema<T> {
  return {
    type: "custom",
    copy: copy,
    merge: merge
  }
}

export function extendSchema<P, C extends P>(parent: ObjectSchema<P>, fields: { [key in Exclude<keyof C, keyof P>]: SchemaOf<C[key]> }): ObjectSchema<C> {
  return {
    type: "object",
    fields: {
      ...parent.fields,
      ...fields,
    } as any
  }
}

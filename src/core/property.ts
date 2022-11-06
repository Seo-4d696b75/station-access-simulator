
/**
 * 名前（アクセス子の名前）と型の一覧
 */
export interface PropertyTypes {
  number: number
  string: string
  boolean: boolean
  numberArray: number[]
  stringArray: string[]
}

/**
 * 読み取り専用の関数
 */
export type PropertyReader<T> = (key: string, defaultValue?: T) => T

/**
 * 書き込み用の関数
 */
export type PropertyWriter<T> = (key: string, value: T) => void

function isPrimitive<T>(typeName: string): (value: any) => value is T {
  let func = (value: any): value is T => {
    return typeof value === typeName
  }
  return func
}

function isPrimitiveArray<T>(typeName: string): (array: any) => array is T[] {
  let func = (array: any): array is T[] => {
    return Array.isArray(array) && array.every(e => typeof e === typeName)
  }
  return func
}

function getPropertyReader<V>(property: Map<string, any>, defaultProperty: Map<string, any> | undefined, typeGuard: (v: any) => v is V): PropertyReader<V> {
  return (key, defaultValue) => {
    let value = property.get(key)
    if (value === undefined) {
      value = defaultProperty?.get(key)
    }
    // if (!value) {
    // Note typeKey === "number"　の場合だと0でうまく機能しない
    if (value === undefined) {
      value = defaultValue
    }
    if (value === undefined) {
      throw new Error(`property not found. key:${key}`)
    }
    if (!typeGuard(value)) {
      throw new Error(`property type mismatched. key:${key} actual:${value}`)
    }
    return value
  }
}

function getPropertyWriter<T>(property: Map<string, any>, typeGuard: (v: any) => v is T): PropertyWriter<T> {
  return (key, value) => {
    const current = property.get(key)
    if (current !== undefined) {
      // 型チェック
      if (!typeGuard(current)) {
        throw new Error(`property type mismatched. key:${key} current:${current} value to be written:${value}`)
      }
    }
    property.set(key, value)
  }
}

export type ReadableProperty = {
  readonly [key in keyof PropertyTypes as `read${Capitalize<key>}`]: PropertyReader<PropertyTypes[key]>
}

export type WritableProperty = {
  readonly [key in keyof PropertyTypes as `put${Capitalize<key>}`]: PropertyWriter<PropertyTypes[key]>
}

export function initReadableProperty(property: Map<string, any>, defaultProperty: Map<string, any> | undefined): ReadableProperty {
  return {
    readBoolean: getPropertyReader<boolean>(property, defaultProperty, isPrimitive("boolean")),
    readString: getPropertyReader<string>(property, defaultProperty, isPrimitive("string")),
    readNumber: getPropertyReader<number>(property, defaultProperty, isPrimitive("number")),
    readStringArray: getPropertyReader<string[]>(property, defaultProperty, isPrimitiveArray("string")),
    readNumberArray: getPropertyReader<number[]>(property, defaultProperty, isPrimitiveArray("number")),
  }
}

export function initWritableProperty(property: Map<string, any>): WritableProperty {
  return {
    putBoolean: getPropertyWriter<boolean>(property, isPrimitive("boolean")),
    putString: getPropertyWriter<string>(property, isPrimitive("string")),
    putNumber: getPropertyWriter<number>(property, isPrimitive("number")),
    putStringArray: getPropertyWriter<string[]>(property, isPrimitiveArray("string")),
    putNumberArray: getPropertyWriter<number[]>(property, isPrimitiveArray("number")),
  }
}
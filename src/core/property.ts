import { SimulatorError } from "./context"

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

export type ReadableProperty = {
  readonly [key in keyof PropertyTypes as `read${Capitalize<key>}`]: PropertyReader<PropertyTypes[key]>
}

export type MutableProperty = {
  readonly [key in keyof PropertyTypes as `put${Capitalize<key>}`]: PropertyWriter<PropertyTypes[key]>
} & {
  /**
   * すべての値を削除します
   */
  readonly clear: () => void
} & ReadableProperty

const isBoolean = (v: any): v is boolean => {
  return typeof v === "boolean"
}

const isNumber = (v: any): v is number => {
  return typeof v === "number"
}

const isString = (v: any): v is string => {
  return typeof v === "string"
}

const isNumberArray = (v: any): v is number[] => {
  return Array.isArray(v) && v.every(e => isNumber(e))
}

const isStringArray = (v: any): v is string[] => {
  return Array.isArray(v) && v.every(e => isString(e))
}

export class TypedMap {
  property: Map<string, any>
  defaultProperty: Map<string, any> | undefined

  constructor(property?: Map<string, any>, defaultProperty?: Map<string, any>) {
    this.property = property ?? new Map()
    this.defaultProperty = defaultProperty
  }

  read<V>(typeGuard: (v: any) => v is V, key: string, defaultValue?: V): V {
    let value = this.property.get(key)
    if (value === undefined) {
      value = this.defaultProperty?.get(key)
    }
    // if (!value) {
    // Note typeKey === "number"　の場合だと0でうまく機能しない
    if (value === undefined) {
      value = defaultValue
    }
    if (value === undefined) {
      throw new SimulatorError(`property not found. key:${key}`)
    }
    if (!typeGuard(value)) {
      throw new SimulatorError(`property type mismatched. key:${key} actual:${value}`)
    }
    return value
  }

  readBoolean(key: string, defaultValue?: boolean): boolean {
    return this.read(isBoolean, key, defaultValue)
  }

  readNumber(key: string, defaultValue?: number): number {
    return this.read(isNumber, key, defaultValue)
  }

  readString(key: string, defaultValue?: string): string {
    return this.read(isString, key, defaultValue)
  }

  readNumberArray(key: string, defaultValue?: number[]): number[] {
    return this.read(isNumberArray, key, defaultValue)
  }

  readStringArray(key: string, defaultValue?: string[]): string[] {
    return this.read(isStringArray, key, defaultValue)
  }

  put<T>(typeGuard: (v: any) => v is T, key: string, value: T, dst: Map<string, any> = this.property) {
    const current = dst.get(key)
    if (current !== undefined) {
      // 型チェック
      if (!typeGuard(current)) {
        throw new SimulatorError(`property type mismatched. key:${key} current:${current} value to be written:${value}`)
      }
    }
    dst.set(key, value)
  }

  putBoolean(key: string, value: boolean) {
    this.put(isBoolean, key, value)
  }

  putNumber(key: string, value: number) {
    this.put(isNumber, key, value)
  }

  putString(key: string, value: string) {
    this.put(isString, key, value)
  }

  putNumberArray(key: string, value: number[]) {
    this.put(isNumberArray, key, value)
  }

  putStringArray(key: string, value: string[]) {
    this.put(isStringArray, key, value)
  }

  clear() {
    this.property.clear()
  }

  merge(other: TypedMap) {
    other.property.forEach((value, key) => {
      this.property.set(key, value)
    })
    if (other.defaultProperty) {
      const dst = this.defaultProperty ?? new Map()
      other.defaultProperty.forEach((value, key) => {
        dst.set(key, value)
      })
      this.defaultProperty = dst
    }
  }

  clone(): TypedMap {
    return new TypedMap(
      new Map(this.property),
      this.defaultProperty ? new Map(this.defaultProperty) : undefined
    )
  }
}
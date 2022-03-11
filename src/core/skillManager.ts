import { SkillHolder, SkillLogic, SkillStateTransition } from "./skill"

interface SkillLevelProperty {
  name: string
  skillLevel: number
  dencoLevel: number
  property: Map<string, any>
}

/**
 * スキルのレベルに応じたプロパティを参照する
 * 
 * see `src/data/skill.json`
 * @param key key値 jsonのkey-valueに対応
 * @param defaultValue 指定したkeyに対するvalueが無い場合のデフォルト値
 * @throws 指定したkeyに対するvalueが無く、デフォルト値も指定が無い場合
 */
export type SkillPropertyReader<T> = (key: string, defaultValue?: T) => T

interface SkillPropertyValues {
  number: number
  string: string
  boolean: boolean
  numberArray: number[]
  stringArray: string[]
}

/**
 * スキルに関する各種データへアクセスするインターフェース  
 * 
 * サポートするデータの型は次の通り  
 * - number
 * - string
 * - boolean
 * - number[]
 * - string[]
 */
export type SkillProperty = {
  readonly [key in keyof SkillPropertyValues as `read${Capitalize<key>}`]: SkillPropertyReader<SkillPropertyValues[key]>
}

interface SkillDataset {
  numbering: string
  moduleName: string
  skill: SkillLogic
  transition: SkillStateTransition
  evaluateInPink: boolean
  skillProperties: SkillLevelProperty[]
  skillDefaultProperties: Map<string, any>
}

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

function getSkillPropertyReader<V>(property: Map<string, any>, defaultProperty: Map<string, any>, typeGuard: (v: any) => v is V): SkillPropertyReader<V> {
  return (key, defaultValue) => {
    let value = property.get(key)
    if (value === undefined) {
      value = defaultProperty.get(key)
    }
    // if (!value) {
    // Note typeKey === "number"　の場合だと0でうまく機能しない
    if (value === undefined) {
      value = defaultValue
    }
    if (value === undefined) {
      throw new Error(`skill property not found. key:${key}`)
    }
    if (!typeGuard(value)) {
      throw new Error(`skill property type mismatched. key:${key} actual:${value}`)
    }
    return value
  }
}

export class SkillManager {

  map: Map<string, SkillDataset> = new Map()

  async load(data?: string) {
    const list = data ? JSON.parse(data) : await import("../data/skill.json").then(o => o.default).catch(e => [])
    if (!Array.isArray(list)) throw Error("fail to load skill property")
    for (let e of list) {
      if (!e.numbering || !e.class || !e.list) {
        throw Error(`invalid skill lacking some property ${JSON.stringify(e)}`)
      }
      const numbering = e.numbering as string
      const moduleName = e.class as string
      const type = e.type as SkillStateTransition
      const properties = (e.list as any[]).map(d => {
        let skill = d.skill_level as number
        let denco = d.denco_level as number
        let name = d.name as string
        const values = Object.assign({}, d)
        delete values.skill_level
        delete values.denco_level
        delete values.name
        let map = new Map<string, any>()
        for (let [key, value] of Object.entries(values)) {
          map.set(key, value)
        }
        let p: SkillLevelProperty = {
          name: name,
          skillLevel: skill,
          dencoLevel: denco,
          property: map,
        }
        return p
      })
      properties.sort((a, b) => a.skillLevel - b.skillLevel)
      const logic = await import("../skill/" + moduleName)
        .then(o => o.default)
        .catch(() => {
          console.warn("fail to import skill logic", moduleName)
          return {}
        })
      // default property
      const defaultValue = Object.assign({}, e)
      delete defaultValue.numbering
      delete defaultValue.class
      delete defaultValue.type
      delete defaultValue.list
      delete defaultValue.step
      let map = new Map<string, any>()
      for (let [key, value] of Object.entries(defaultValue)) {
        map.set(key, value)
      }
      let dataset: SkillDataset = {
        numbering: numbering,
        moduleName: moduleName,
        skill: logic,
        skillProperties: properties,
        skillDefaultProperties: map,
        transition: type,
        evaluateInPink: false,
      }
      this.map.set(numbering, dataset)
    }
  }

  clear() {
    this.map.clear()
  }

  getSkill(numbering: string, level: number): SkillHolder {
    const data = this.map.get(numbering)
    if (data) {
      let idx = data.skillProperties.length - 1
      while (idx >= 0) {
        if (level >= data.skillProperties[idx].dencoLevel) break
        idx -= 1
      }
      if (idx < 0) {
        return {
          type: "not_acquired",
        }
      } else if (idx < data.skillProperties.length) {
        const property = data.skillProperties[idx]
        return {
          type: "possess",
          level: property.skillLevel,
          name: property.name,
          state: {
            type: "not_init",
            transition: data.transition,
            data: undefined,
          },
          evaluateInPink: data.evaluateInPink,
          property: {
            readBoolean: getSkillPropertyReader<boolean>(property.property, data.skillDefaultProperties, isPrimitive("boolean")),
            readString: getSkillPropertyReader<string>(property.property, data.skillDefaultProperties, isPrimitive("string")),
            readNumber: getSkillPropertyReader<number>(property.property, data.skillDefaultProperties, isPrimitive("number")),
            readStringArray: getSkillPropertyReader<string[]>(property.property, data.skillDefaultProperties, isPrimitiveArray("string")),
            readNumberArray: getSkillPropertyReader<number[]>(property.property, data.skillDefaultProperties, isPrimitiveArray("number"))
          },
          ...data.skill,
        }
      } else {
        throw new Error(`no skill property found for level: ${level} ${numbering}`)
      }
    } else {
      return {
        type: "none"
      }
    }
  }

  readSkillProperty(numbering: string, level: number): SkillLevelProperty | null {
    const dataset = this.map.get(numbering)
    if (!dataset) throw new Error(`no skill property found: ${numbering}`)
    for (let property of dataset.skillProperties) {
      if (level <= property.dencoLevel) {
        return property
      }
    }
    throw new Error(`no skill property found for level: ${level} ${numbering}`)
  }
}

const manager = new SkillManager()

export default manager
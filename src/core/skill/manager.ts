import { initReadableProperty, initWritableProperty, ReadableProperty } from "../property"
import { SkillHolder } from "./holder"
import { SkillLogic } from "./logic"
import { SkillTransitionType } from "./transition"

/**
 * スキルに関する各種データへアクセスするインターフェース  
 * 
 * `src/data/skill.json`で定義したデータを読み取る方法を定義します  
 * 読み取る値はスキルレベルに依存して変化する場合があります
 * 
 * ## サポートするデータ型  
 * - number
 * - string
 * - boolean
 * - number[]
 * - string[]
 * 
 * ## 利用例
 * (例)スキルデータ  
 * ```json
 * [
 *   {
 *     "numbering":"1",
 *     "key": "value2",
 *     "list": [
 *       {
 *         "skill_level": 1,
 *         "denco_level": 5,
 *         "key": "value1"
 *       },
 *       {
 *         "skill_level": 2,
 *         "denco_level": 15
 *       }
 *     ]
 *   }
 * ]
 * ```
 * 
 * 各関数`read**`を呼び出すと、
 * 
 * 1. 対応するスキルレベルのJSON Objectを調べて指定した`key`が存在すれば返す  
 *    （例）"skill_level": 1 の場合は "value1"
 * 2. スキルデータ直下のJSON Objectを調べて指定した`key`が存在すれば値を返す  
 *    （例）"skill_level": 2 の場合は "value2"
 * 3. デフォルト値`defaultValue`を返す
 * 
 * **例外の発生**  
 * - 1.2. において指定した`key`で見つかった値が予期した型と異なる場合
 * - 指定した`key`に対する値が存在せず、かつデフォルト値も指定が無い場合
 */
export type SkillProperty = ReadableProperty

interface SkillLevelProperty {
  name: string
  skillLevel: number
  dencoLevel: number
  property: Map<string, any>
}

interface SkillDataset {
  numbering: string
  moduleName: string
  skill: SkillLogic
  transition: SkillTransitionType
  evaluateInPink: boolean
  skillProperties: SkillLevelProperty[]
  skillDefaultProperties: Map<string, any>
}

export class SkillManager {

  map: Map<string, SkillDataset> = new Map()

  async load(data?: string) {
    const list = data ? JSON.parse(data) : await import("../../data/skill.json").then(o => o.default).catch(e => [])
    if (!Array.isArray(list)) throw Error("fail to load skill property")
    for (let e of list) {
      if (!e.numbering || !e.class || !e.list) {
        throw Error(`invalid skill lacking some property ${JSON.stringify(e)}`)
      }
      const numbering = e.numbering as string
      const moduleName = e.class as string
      const type = e.type as SkillTransitionType
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
      const logic = await import("../../skill/" + moduleName)
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
        const customData = new Map<string, any>()
        return {
          type: "possess",
          level: property.skillLevel,
          name: property.name,
          transition: {
            state: "not_init",
            type: data.transition,
            data: undefined,
          },
          evaluateInPink: data.evaluateInPink,
          property: initReadableProperty(property.property, data.skillDefaultProperties),
          data: {
            clear: () => customData.clear(),
            ...initReadableProperty(customData, undefined),
            ...initWritableProperty(customData),
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
}
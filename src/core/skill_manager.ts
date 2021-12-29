import { SkillLogic, SkillPossess, SkillPossessType, SkillState, SkillStateTransition } from "./skill"

interface SkillProperty {
  skill_name: string
  skill_level: number
  denco_level: number
  property: Map<string, number>
}

export type SkillPropertyReader = (key: string) => number

interface SkillDataset {
  numbering: string
  class_name: string
  skill: SkillLogic
  transaction_type: SkillStateTransition
  evaluate_in_pink: boolean
  skill_properties: Array<SkillProperty>
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
      const class_name = e.class as string
      const properties = (e.list as Array<any>).map(d => {
        var skill = d.skill_level as number
        var denco = d.denco_level as number
        var name = d.name as string
        delete d.skill_level
        delete d.denco_level
        delete d.name
        var map = new Map<string, number>()
        for (var [key, value] of Object.entries(d)) {
          map.set(key, value as number)
        }
        var p: SkillProperty = {
          skill_name: name,
          skill_level: skill,
          denco_level: denco,
          property: map,
        }
        return p
      })
      properties.sort((a, b) => a.skill_level - b.skill_level)
      const logic = await import("../skill/" + class_name + ".ts")
        .then(o => o.default)
        .catch(() => {
          console.warn("fail to import skill logic", class_name)
          return {}
        })
      // TODO
      var dataset: SkillDataset = {
        numbering: numbering,
        class_name: class_name,
        skill: logic,
        skill_properties: properties,
        transaction_type: "always",
        evaluate_in_pink: false,
      }
      this.map.set(numbering, dataset)
    }
  }

  getSkill(numbering: string, level: number): SkillPossess {
    const data = this.map.get(numbering)
    if (data) {
      var idx = data.skill_properties.length - 1
      while (idx >= 0) {
        if (level >= data.skill_properties[idx].denco_level) break
        idx -= 1
      }
      if (idx < 0) {
        return {
          type: "not_aquired",
          skill: undefined
        }
      } else if (idx < data.skill_properties.length) {
        const property = data.skill_properties[idx]
        return {
          type: "possess",
          skill: {
            ...data.skill,
            level: property.skill_level,
            name: property.skill_name,
            state: "active",
            transition_type: data.transaction_type,
            evaluate_in_pink: data.evaluate_in_pink,
            property_reader: (key: string) => {
              var value = property.property.get(key)
              if (!value) throw new Error(`skill property not found. key:${key}`)
              return value
            }
          }
        }
      } else {
        throw new Error(`no skill property found for level: ${level} ${numbering}`)
      }
    } else {
      return {
        type: "none",
        skill: undefined
      }
    }
  }

  readSkillProperty(numbering: string, level: number): SkillProperty | null {
    const dataset = this.map.get(numbering)
    if (!dataset) throw new Error(`no skill property found: ${numbering}`)
    for (var property of dataset.skill_properties) {
      if (level <= property.denco_level) {
        return property
      }
    }
    throw new Error(`no skill property found for level: ${level} ${numbering}`)
  }
}

const manager = new SkillManager()

export default manager
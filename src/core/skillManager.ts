import { SkillLogic, SkillPossess, SkillStateTransition } from "./skill"

interface SkillProperty {
  name: string
  skillLevel: number
  dencoLevel: number
  property: Map<string, number>
}

export type SkillPropertyReader = (key: string) => number

interface SkillDataset {
  numbering: string
  moduleName: string
  skill: SkillLogic
  transactionType: SkillStateTransition
  evaluateInPink: boolean
  skillProperties: SkillProperty[]
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
          name: name,
          skillLevel: skill,
          dencoLevel: denco,
          property: map,
        }
        return p
      })
      properties.sort((a, b) => a.skillLevel - b.skillLevel)
      const logic = await import("../skill/" + moduleName + ".ts")
        .then(o => o.default)
        .catch(() => {
          console.warn("fail to import skill logic", moduleName)
          return {}
        })
      // TODO
      var dataset: SkillDataset = {
        numbering: numbering,
        moduleName: moduleName,
        skill: logic,
        skillProperties: properties,
        transactionType: type,
        evaluateInPink: false,
      }
      this.map.set(numbering, dataset)
    }
  }

  getSkill(numbering: string, level: number): SkillPossess {
    const data = this.map.get(numbering)
    if (data) {
      var idx = data.skillProperties.length - 1
      while (idx >= 0) {
        if (level >= data.skillProperties[idx].dencoLevel) break
        idx -= 1
      }
      if (idx < 0) {
        return {
          type: "not_aquired",
          skill: undefined
        }
      } else if (idx < data.skillProperties.length) {
        const property = data.skillProperties[idx]
        return {
          type: "possess",
          skill: {
            ...data.skill,
            level: property.skillLevel,
            name: property.name,
            state: {
              type: "not_init",
              data: undefined,
            },
            transitionType: data.transactionType,
            evaluateInPink: data.evaluateInPink,
            propertyReader: (key: string) => {
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
    for (var property of dataset.skillProperties) {
      if (level <= property.dencoLevel) {
        return property
      }
    }
    throw new Error(`no skill property found for level: ${level} ${numbering}`)
  }
}

const manager = new SkillManager()

export default manager
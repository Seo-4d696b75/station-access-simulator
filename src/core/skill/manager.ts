import { SimulatorError } from "../context"
import { TypedMap } from "../property"
import { SkillHolder } from "./holder"
import { SkillLogic } from "./logic"


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
  triggerInPink: boolean
  skillProperties: SkillLevelProperty[]
  skillDefaultProperties: Map<string, any>
}

export class SkillManager {

  map: Map<string, SkillDataset> = new Map()

  async load(data?: string) {
    const list = data ? JSON.parse(data) : await import(
      /* webpackMode: "lazy" */
      /* webpackChunkName: "skill-property" */
      "../../data/skill.json"
    ).then(o => o.default).catch(e => [])
    if (!Array.isArray(list)) throw new SimulatorError("fail to load skill property")
    for (let e of list) {
      if (!e.numbering || !e.class || !e.list) {
        throw new SimulatorError(`invalid skill lacking some property ${JSON.stringify(e)}`)
      }
      const numbering = e.numbering as string
      const moduleName = e.class as string
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
      const logic = await import(
        /* webpackMode: "lazy" */
        /* webpackChunkName: "skill" */
        "../../skill/" + moduleName
      )
        .then(o => o.default)
        .catch(() => {
          throw new SimulatorError(`fail to import skill logic: ${moduleName}`)
        })
      // default property
      const defaultValue = Object.assign({}, e)
      // 特別な意味を持つプロパティを除く
      delete defaultValue.numbering
      delete defaultValue.class
      delete defaultValue.list
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
        triggerInPink: false,
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
          transition: {
            state: "not_init",
            data: undefined,
          },
          property: new TypedMap(property.property, data.skillDefaultProperties),
          data: new TypedMap(),
          ...data.skill,
        }
      } else {
        throw new SimulatorError(`no skill property found for level: ${level} ${numbering}`)
      }
    } else {
      return {
        type: "none"
      }
    }
  }
}
import moment from "moment-timezone"
import { activateSkill, deactivateSkill, getSkill, initContext, initUser, refreshState } from ".."
import DencoManager from "../core/dencoManager"

export interface ManualSkillTestOption {
  number: string
  name: string
  active: number
  cooldown: number
  level?: number
}

export function testManualSkill(option: ManualSkillTestOption) {
  test("スキル状態", () => {
    const context = initContext("test", "test", false)
    let denco = DencoManager.getDenco(context, option.number, option?.level ?? 50)
    expect(denco.skill.type).toBe("possess")
    let defense = initUser(context, "とあるマスター", [denco])
    const now = moment().valueOf()
    context.clock = now
    denco = defense.formation[0]
    expect(denco.name).toBe(option.name)
    let skill = getSkill(denco)
    expect(skill.state.transition).toBe("manual")
    expect(skill.state.type).toBe("idle")
    expect(() => deactivateSkill(context, defense, 0)).toThrowError()
    defense = activateSkill(context, defense, 0)
    denco = defense.formation[0]
    skill = getSkill(denco)
    expect(skill.state.type).toBe("active")
    expect(skill.state.transition).toBe("manual")
    expect(skill.state.data).not.toBeUndefined()
    if (skill.state.type === "active" && skill.state.transition === "manual" && skill.state.data) {
      let data = skill.state.data
      expect(data.activeTimeout).toBe(now + option.active * 1000)
      expect(data.cooldownTimeout).toBe(now + option.active * 1000 + option.cooldown * 1000)
    }
    expect(() => deactivateSkill(context, defense, 0)).toThrowError()

    // まだアクティブ
    context.clock = now + option.active / 2 * 1000
    defense = refreshState(context, defense)
    denco = defense.formation[0]
    skill = getSkill(denco)
    expect(skill.state.type).toBe("active")

    // ちょうどCoolDown
    context.clock = now + option.active * 1000
    defense = refreshState(context, defense)
    denco = defense.formation[0]
    skill = getSkill(denco)
    expect(skill.state.type).toBe("cooldown")
    expect(skill.state.transition).toBe("manual")
    if (skill.state.type === "cooldown" && skill.state.transition === "manual") {
      let timeout = skill.state.data
      expect(timeout.cooldownTimeout).toBe(now + (option.active + option.cooldown) * 1000)
    }

    // CoolDown終わり
    context.clock = now + (option.active + option.cooldown) * 1000
    defense = refreshState(context, defense)
    denco = defense.formation[0]
    skill = getSkill(denco)
    expect(skill.state.type).toBe("idle")
  })
}

export interface AlwaysSkillTestOption {
  number: string
  name: string
  level?: number
  time?: number[]
}

export function testAlwaysSkill(option: AlwaysSkillTestOption) {
  test("スキル状態", () => {
    const context = initContext("test", "test", false)
    let denco = DencoManager.getDenco(context, option.number, option?.level ?? 50)
    expect(denco.skill.type).toBe("possess")
    expect(denco.name).toBe(option.name)
    let state = initUser(context, "とあるマスター", [denco])

    const now = moment().valueOf()
    const params = option?.time ?? [
      now,
      now + 600 * 1000,
    ]
    params.forEach(t => {
      context.clock = t
      state = refreshState(context, state)
      denco = state.formation[0]
      let skill = getSkill(denco)
      expect(skill.state.transition).toBe("always")
      expect(skill.state.type).toBe("active")

      expect(() => activateSkill(context, state, 0)).toThrowError()
      expect(() => deactivateSkill(context, state, 0)).toThrowError()
    })
  })
}
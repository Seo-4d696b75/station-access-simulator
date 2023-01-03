import assert from "assert"
import dayjs from "dayjs"
import { activateSkill, deactivateSkill, getSkill, initContext, initUser, refreshState } from "../.."
import DencoManager from "../../core/dencoManager"

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
    const now = dayjs().valueOf()
    context.clock = now
    denco = defense.formation[0]
    expect(denco.name).toBe(option.name)
    let skill = getSkill(denco)
    expect(skill.transitionType).toBe("manual")
    expect(skill.transition.state).toBe("idle")
    expect(() => deactivateSkill(context, defense, 0)).toThrowError()
    defense = activateSkill(context, defense, 0)
    denco = defense.formation[0]
    skill = getSkill(denco)
    assert(skill.transition.state === "active")
    assert(skill.transitionType === "manual")
    assert(skill.transition.data)

    let data = skill.transition.data
    expect(data.activeTimeout).toBe(now + option.active * 1000)
    expect(data.cooldownTimeout).toBe(now + option.active * 1000 + option.cooldown * 1000)

    expect(() => deactivateSkill(context, defense, 0)).toThrowError()

    // まだアクティブ
    context.clock = now + option.active / 2 * 1000
    defense = refreshState(context, defense)
    denco = defense.formation[0]
    skill = getSkill(denco)
    expect(skill.transition.state).toBe("active")

    // ちょうどCoolDown
    context.clock = now + option.active * 1000
    defense = refreshState(context, defense)
    denco = defense.formation[0]
    skill = getSkill(denco)
    assert(skill.transition.state === "cooldown")
    assert(skill.transitionType === "manual")

    let timeout = skill.transition.data
    expect(timeout.cooldownTimeout).toBe(now + (option.active + option.cooldown) * 1000)


    // CoolDown終わり
    context.clock = now + (option.active + option.cooldown) * 1000
    defense = refreshState(context, defense)
    denco = defense.formation[0]
    skill = getSkill(denco)
    expect(skill.transition.state).toBe("idle")
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

    const now = dayjs().valueOf()
    const params = option?.time ?? [
      now,
      now + 600 * 1000,
    ]
    params.forEach(t => {
      context.clock = t
      state = refreshState(context, state)
      denco = state.formation[0]
      let skill = getSkill(denco)
      expect(skill.transitionType).toBe("always")
      expect(skill.transition.state).toBe("active")

      expect(() => activateSkill(context, state, 0)).toThrowError()
      expect(() => deactivateSkill(context, state, 0)).toThrowError()
    })
  })
}
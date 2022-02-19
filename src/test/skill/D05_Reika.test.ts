import moment from "moment-timezone"
import { init } from "../.."
import { getAccessDenco, hasSkillTriggered, startAccess } from "../../core/access"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { activateSkill, getSkill, isSkillActive, SkillActiveTimeout, SkillCooldownTimeout } from "../../core/skill"
import { initUser, refreshState } from "../../core/user"

describe("レイカのスキル", () => {
  beforeAll(init)

  test("スキル状態", () => {
    const context = initContext("test", "test", false)
    let reika = DencoManager.getDenco(context, "5", 50)
    expect(reika.skill.type).toBe("possess")
    let defense = initUser(context, "とあるマスター", [reika])
    const now = moment().valueOf()
    context.clock = now
    defense = refreshState(context, defense)
    reika = defense.formation[0]
    expect(reika.name).toBe("reika")
    let skill = getSkill(reika)
    expect(skill.state.transition).toBe("manual")
    expect(skill.state.type).toBe("idle")
    defense = activateSkill(context, defense, 0)
    reika = defense.formation[0]
    skill = getSkill(reika)
    expect(skill.state.type).toBe("active")
    expect(skill.state.data).not.toBeUndefined()
    let data = skill.state.data as SkillActiveTimeout
    expect(data.activeTimeout).toBe(now + 900 * 1000)
    expect(data.cooldownTimeout).toBe(now + 900 * 1000 + 5400 * 1000)

    // 10分経過
    context.clock = now + 600 * 1000
    defense = refreshState(context, defense)
    reika = defense.formation[0]
    skill = getSkill(reika)
    expect(skill.state.type).toBe("active")

    // 15分経過
    context.clock = now + 900 * 1000
    defense = refreshState(context, defense)
    reika = defense.formation[0]
    skill = getSkill(reika)
    expect(skill.state.type).toBe("cooldown")
    let timeout = skill.state.data as SkillCooldownTimeout
    expect(timeout.cooldownTimeout).toBe(now + (900 + 5400) * 1000)

    // 1時間45分経過
    context.clock = now + (900 + 5400) * 1000
    defense = refreshState(context, defense)
    reika = defense.formation[0]
    skill = getSkill(reika)
    expect(skill.state.type).toBe("idle")
  })
  test("発動なし-非アクティブ", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [reika, seria])
    let defense = initUser(context, "とあるマスター２", [charlotte])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: charlotte.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.access.offense, reika)).toBe(false)
    expect(result.access.attackPercent).toBe(0)
  })
  test("発動なし-守備側", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [reika, seria])
    defense = activateSkill(context, defense, 0)
    reika = defense.formation[0]
    expect(isSkillActive(reika.skill)).toBe(true)
    let offense = initUser(context, "とあるマスター２", [charlotte])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: reika.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.access.defense, reika)).toBe(false)
    expect(result.access.attackPercent).toBe(0)
  })
  test("発動あり-攻撃側", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [reika, seria])
    offense = activateSkill(context, offense, 0)
    reika = offense.formation[0]
    expect(isSkillActive(reika.skill)).toBe(true)
    let defense = initUser(context, "とあるマスター２", [charlotte])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: charlotte.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.access.offense, reika)).toBe(true)
    expect(result.access.attackPercent).toBe(25)
  })
  test("発動あり-確率ブースト", () => {
    const context = initContext("test", "test", false)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [reika, hiiru])
    offense = activateSkill(context, offense, 0)
    reika = offense.formation[0]
    expect(isSkillActive(reika.skill)).toBe(true)
    offense = activateSkill(context, offense, 1)
    hiiru = offense.formation[1]
    expect(isSkillActive(hiiru.skill)).toBe(true)
    let defense = initUser(context, "とあるマスター２", [charlotte])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: charlotte.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.access.offense, reika)).toBe(true)
    expect(hasSkillTriggered(result.access.offense, hiiru)).toBe(false)
    expect(result.access.attackPercent).toBe(25)
  })
  test("発動あり-編成内", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [reika, seria])
    offense = activateSkill(context, offense, 0)
    reika = offense.formation[0]
    expect(isSkillActive(reika.skill)).toBe(true)
    let defense = initUser(context, "とあるマスター２", [charlotte])
    const config = {
      offense: {
        state: offense,
        carIndex: 1
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: charlotte.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.access.offense, reika)).toBe(true)
    expect(result.access.attackPercent).toBe(25)
    let accessSeria = getAccessDenco(result.access, "offense")
    expect(accessSeria.name).toBe("seria")
  })
})
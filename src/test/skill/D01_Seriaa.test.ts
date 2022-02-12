import StationManager from "../..//core/stationManager"
import SkillManager from "../../core/skillManager"
import DencoManager from "../../core/dencoManager"
import { initContext } from "../../core/context"
import { initUser, UserState } from "../../core/user"
import { activateSkill, getSkill, refreshSkillState, SkillActiveTimeout, SkillCooldownTimeout } from "../../core/skill"
import { getAccessDenco, startAccess } from "../../core/access"
import { EventTriggeredSkill } from "../../core/skillEvent"
import moment from "moment-timezone"

describe("セリアのスキル", () => {
  test("setup", async () => {
    await StationManager.load()
    await SkillManager.load()
    await DencoManager.load()
    expect(StationManager.data.length).toBeGreaterThan(0)
    expect(SkillManager.map.size).toBeGreaterThan(0)
    expect(DencoManager.data.size).toBeGreaterThan(0)
  })
  test("スキル状態", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    expect(seria.skill.type).toBe("possess")
    let defense = initUser(context, "とあるマスター", [reika, seria])
    const now = moment().valueOf()
    context.clock = now
    defense = refreshSkillState(context, defense)
    seria = defense.formation[1]
    let skill = getSkill(seria)
    expect(skill.state.transition).toBe("manual")
    expect(skill.state.type).toBe("idle")
    defense = activateSkill(context, defense, 1)
    seria = defense.formation[1]
    skill = getSkill(seria)
    expect(skill.state.type).toBe("active")
    expect(skill.state.data).not.toBeUndefined()
    let data = skill.state.data as SkillActiveTimeout
    expect(data.activeTimeout).toBe(now + 1800 * 1000)
    expect(data.cooldownTimeout).toBe(now + 1800 * 1000 + 10800 * 1000)

    // 10分経過
    context.clock = now + 600 * 1000
    defense = refreshSkillState(context, defense)
    seria = defense.formation[1]
    skill = getSkill(seria)
    expect(skill.state.type).toBe("active")

    // 30分経過
    context.clock = now + 1800 * 1000
    defense = refreshSkillState(context, defense)
    seria = defense.formation[1]
    skill = getSkill(seria)
    expect(skill.state.type).toBe("cooldown")
    let timeout = skill.state.data as SkillCooldownTimeout
    expect(timeout.cooldownTimeout).toBe(now + (1800 + 10800) * 1000)

    // 30分+3時間経過
    context.clock = now + (1800 + 10800) * 1000
    defense = refreshSkillState(context, defense)
    seria = defense.formation[1]
    skill = getSkill(seria)
    expect(skill.state.type).toBe("idle")
  })
  test("発動なし-HP30%未満なし", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 10)
    let defense = initUser(context, "とあるマスター", [reika, seria])
    defense = activateSkill(context, defense, 1)
    let offense = initUser(context, "とあるマスター２", [charlotte])
    const config = {
      offense: {
        carIndex: 0,
        ...offense
      },
      defense: {
        carIndex: 0,
        ...defense
      },
      station: reika.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    defense = result.defense as UserState
    reika = defense.formation[0]
    expect(reika.currentHp).toBe(116)
    expect(defense.event.length).toBe(1)
  })
  test("発動なし-Reboot", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 80)
    let defense = initUser(context, "とあるマスター", [reika, seria])
    defense = activateSkill(context, defense, 1)
    let offense = initUser(context, "とあるマスター２", [charlotte])
    const config = {
      offense: {
        carIndex: 0,
        ...offense
      },
      defense: {
        carIndex: 0,
        ...defense
      },
      station: reika.link[0],
    }
    const result = startAccess(context, config)
    const accessReika = getAccessDenco(result.access, "defense")
    expect(accessReika.hpAfter).toBe(0)
    expect(accessReika.reboot).toBe(true)
    expect(result.defense).not.toBeUndefined()
    defense = result.defense as UserState
    reika = defense.formation[0]
    expect(reika.currentHp).toBe(reika.maxHp)
    expect(defense.event.length).toBe(2)
  })
  test("発動なし-確率", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "ignore"
    let seria = DencoManager.getDenco(context, "1", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [reika, seria])
    defense = activateSkill(context, defense, 1)
    let offense = initUser(context, "とあるマスター２", [charlotte])
    const config = {
      offense: {
        carIndex: 0,
        ...offense
      },
      defense: {
        carIndex: 0,
        ...defense
      },
      station: reika.link[0],
    }
    const result = startAccess(context, config)
    const accessReika = getAccessDenco(result.access, "defense")
    expect(accessReika.hpAfter).toBe(22)
    expect(accessReika.reboot).toBe(false)
    expect(result.defense).not.toBeUndefined()
    defense = result.defense as UserState
    reika = defense.formation[0]
    expect(reika.currentHp).toBe(22)
    expect(defense.event.length).toBe(1)
  })
  test("発動あり-回復×1", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let seria = DencoManager.getDenco(context, "1", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [reika, seria])
    defense = activateSkill(context, defense, 1)
    let offense = initUser(context, "とあるマスター２", [charlotte])
    const config = {
      offense: {
        carIndex: 0,
        ...offense
      },
      defense: {
        carIndex: 0,
        ...defense
      },
      station: reika.link[0],
    }
    const result = startAccess(context, config)
    const accessReika = getAccessDenco(result.access, "defense")
    expect(accessReika.hpAfter).toBe(22)
    expect(accessReika.reboot).toBe(false)
    expect(result.defense).not.toBeUndefined()
    defense = result.defense as UserState
    ([reika, seria] = defense.formation)
    expect(reika.currentHp).toBe(22 + 45)
    expect(defense.event.length).toBe(2)
    const heal = defense.event[1]
    expect(heal.type).toBe("skill_trigger")
    const data = heal.data as EventTriggeredSkill
    expect(data.denco).toMatchObject(seria)
    expect(data.time).toBe(result.access.time)
    expect(data.carIndex).toBe(1)
    const skill = getSkill(seria)
    expect(data.skillName).toBe(skill.name)
    expect(data.step).toBe("self")
  })
})
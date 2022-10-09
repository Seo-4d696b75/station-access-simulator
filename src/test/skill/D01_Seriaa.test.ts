import moment from "moment-timezone"
import { init, refreshState } from "../.."
import { getAccessDenco, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { activateSkill, getSkill, SkillActiveTimeout, SkillCooldownTimeout } from "../../core/skill"
import { initUser, UserState } from "../../core/user"

describe("セリアのスキル", () => {
  beforeAll(init)
  test("スキル状態", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    expect(seria.skill.type).toBe("possess")
    let defense = initUser(context, "とあるマスター", [reika, seria])
    const now = moment().valueOf()
    context.clock = now
    defense = refreshState(context, defense)
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
    defense = refreshState(context, defense)
    seria = defense.formation[1]
    skill = getSkill(seria)
    expect(skill.state.type).toBe("active")

    // 30分経過
    context.clock = now + 1800 * 1000
    defense = refreshState(context, defense)
    seria = defense.formation[1]
    skill = getSkill(seria)
    expect(skill.state.type).toBe("cooldown")
    let timeout = skill.state.data as SkillCooldownTimeout
    expect(timeout.cooldownTimeout).toBe(now + (1800 + 10800) * 1000)

    // 30分+3時間経過
    context.clock = now + (1800 + 10800) * 1000
    defense = refreshState(context, defense)
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
    const accessReika = getAccessDenco(result, "defense")
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
    const accessReika = getAccessDenco(result, "defense")
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
    const accessReika = getAccessDenco(result, "defense")
    expect(accessReika.hpAfter).toBe(22)
    expect(accessReika.reboot).toBe(false)
    expect(result.defense).not.toBeUndefined()
    if (result.defense) {
      ([reika, seria] = result.defense.formation)
      expect(reika.currentHp).toBe(22 + 45)
      expect(result.defense.event.length).toBe(2)
      const heal = result.defense.event[1]
      expect(heal.type).toBe("skill_trigger")
      if (heal.type === "skill_trigger") {
        const data = heal.data
        expect(seria).toMatchObject(data.denco)
        expect(data.time).toBe(result.time)
        expect(data.carIndex).toBe(1)
        const skill = getSkill(seria)
        expect(data.skillName).toBe(skill.name)
        expect(data.step).toBe("self")
      }
    }
  })
})
import { DencoManager, init } from "../.."
import { initContext } from "../../core/context"
import { initUser, refreshState } from "../../core/user"
import moment from "moment-timezone"
import { activateSkill, deactivateSkill, getSkill } from "../../core/skill"
import { hasSkillTriggered, startAccess } from "../../core/access"

describe("ベアトリスのスキル", () => {
  beforeAll(init)
  test("スキル状態", () => {
    const context = initContext("test", "test", false)
    let beatrice = DencoManager.getDenco(context, "24", 50)
    expect(beatrice.skill.type).toBe("possess")
    let defense = initUser(context, "とあるマスター", [beatrice])
    const now = moment().valueOf()
    context.clock = now
    beatrice = defense.formation[0]
    expect(beatrice.name).toBe("beatrice")
    let skill = getSkill(beatrice)
    expect(skill.state.transition).toBe("manual")
    expect(skill.state.type).toBe("idle")
    expect(() => deactivateSkill(context, defense, 0)).toThrowError()
    defense = activateSkill(context, defense, 0)
    beatrice = defense.formation[0]
    skill = getSkill(beatrice)
    expect(skill.state.type).toBe("active")
    expect(skill.state.transition).toBe("manual")
    expect(skill.state.data).not.toBeUndefined()
    if (skill.state.type === "active" && skill.state.transition === "manual" && skill.state.data) {
      let data = skill.state.data
      expect(data.activeTimeout).toBe(now + 14400 * 1000)
      expect(data.cooldownTimeout).toBe(now + 14400 * 1000 + 3600 * 1000)
    }
    expect(() => deactivateSkill(context, defense, 0)).toThrowError()

    // 10分経過
    context.clock = now + 600 * 1000
    defense = refreshState(context, defense)
    beatrice = defense.formation[0]
    skill = getSkill(beatrice)
    expect(skill.state.type).toBe("active")

    // ４時間経過
    context.clock = now + 14400 * 1000
    defense = refreshState(context, defense)
    beatrice = defense.formation[0]
    skill = getSkill(beatrice)
    expect(skill.state.type).toBe("cooldown")
    expect(skill.state.transition).toBe("manual")
    if (skill.state.type === "cooldown" && skill.state.transition === "manual") {
      let timeout = skill.state.data
      expect(timeout.cooldownTimeout).toBe(now + (14400 + 3600) * 1000)
    }

    // 5時間経過
    context.clock = now + (14400 + 3600) * 1000
    defense = refreshState(context, defense)
    beatrice = defense.formation[0]
    skill = getSkill(beatrice)
    expect(skill.state.type).toBe("idle")
  })
  test("発動なし-非アクティブ", () => {
    const context = initContext("test", "test", false)
    let beatrice = DencoManager.getDenco(context, "24", 50, 1)
    let saya = DencoManager.getDenco(context, "8", 50)
    let offense = initUser(context, "とあるマスター", [saya])
    let defense = initUser(context, "とあるマスター２", [beatrice])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: beatrice.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, beatrice)).toBe(false)
    expect(result.defendPercent).toBe(0)
  })
  test("発動あり", () => {
    const context = initContext("test", "test", false)
    let beatrice = DencoManager.getDenco(context, "24", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50)
    let saya = DencoManager.getDenco(context, "8", 50)
    let offense = initUser(context, "とあるマスター", [saya, reika])
    offense = activateSkill(context, offense, 1)
    let defense = initUser(context, "とあるマスター２", [beatrice])
    defense = activateSkill(context, defense, 0)
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: beatrice.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.offense, reika)).toBe(true)
    expect(hasSkillTriggered(result.defense, beatrice)).toBe(true)
    expect(getSkill(beatrice).property.readNumber("DEF")).toBe(75)
    expect(result.defendPercent).toBe(Math.floor(75 * (saya.ap - beatrice.ap) / saya.ap))
    expect(result.attackPercent).toBe(25)
  })
  test("発動なし-自身APの方が高い場合", () => {
    const context = initContext("test", "test", false)
    let beatrice = DencoManager.getDenco(context, "24", 80, 1)
    let saya = DencoManager.getDenco(context, "8", 10)
    expect(beatrice.ap).toBeGreaterThan(saya.ap)
    let offense = initUser(context, "とあるマスター", [saya])
    let defense = initUser(context, "とあるマスター２", [beatrice])
    defense = activateSkill(context, defense, 0)
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: beatrice.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, beatrice)).toBe(false)
    expect(result.defendPercent).toBe(0)
  })
  test("発動なし-攻撃側", () => {
    const context = initContext("test", "test", false)
    let beatrice = DencoManager.getDenco(context, "24", 50)
    let saya = DencoManager.getDenco(context, "8", 50, 1)
    let offense = initUser(context, "とあるマスター", [beatrice])
    let defense = initUser(context, "とあるマスター２", [saya])
    offense = activateSkill(context, offense, 0)
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: saya.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.offense, beatrice)).toBe(false)
    expect(result.defendPercent).toBe(0)
  })
  test("発動なし-守備側編成内", () => {
    const context = initContext("test", "test", false)
    let beatrice = DencoManager.getDenco(context, "24", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let saya = DencoManager.getDenco(context, "8", 50)
    let offense = initUser(context, "とあるマスター", [saya])
    let defense = initUser(context, "とあるマスター２", [reika, beatrice])
    defense = activateSkill(context, defense, 0, 1)
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
    expect(hasSkillTriggered(result.defense, beatrice)).toBe(false)
    expect(result.defendPercent).toBe(0)
  })
})
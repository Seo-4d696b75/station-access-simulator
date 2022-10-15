import moment from "moment-timezone"
import { activateSkill, deactivateSkill, getSkill, init, initContext, initUser, isSkillActive } from "../.."
import { hasSkillTriggered, startAccess } from "../../core/access/index"
import DencoManager from "../../core/dencoManager"

describe("やちよスキル", () => {
  beforeAll(init)


  test("スキル状態", () => {
    const context = initContext("test", "test", false)
    let yachiyo = DencoManager.getDenco(context, "27", 50)
    expect(yachiyo.skill.type).toBe("possess")
    let defense = initUser(context, "とあるマスター", [yachiyo])
    const now = moment().valueOf()
    context.clock = now
    yachiyo = defense.formation[0]
    expect(yachiyo.name).toBe("yachiyo")
    let skill = getSkill(yachiyo)
    expect(skill.state.transition).toBe("always")
    expect(skill.state.type).toBe("active")
    expect(() => activateSkill(context, defense, 0)).toThrowError()
    expect(() => deactivateSkill(context, defense, 0)).toThrowError()
  })

  test("発動なし-攻撃側(アクセス)", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let yachiyo = DencoManager.getDenco(context, "27", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [yachiyo, seria])
    // ぜんぶ地元駅
    offense.user.isHomeStation = (s) => true
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
    expect(hasSkillTriggered(result.offense, yachiyo)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })
  test("発動なし-守備側(被アクセス)", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let yachiyo = DencoManager.getDenco(context, "27", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [yachiyo, seria])
    // 地元駅など無い
    defense.user.isHomeStation = (s) => false
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
      station: yachiyo.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, yachiyo)).toBe(false)
    expect(result.defendPercent).toBe(0)
  })
  test("発動なし-守備側(編成内)", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50, 1)
    let yachiyo = DencoManager.getDenco(context, "27", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [seria, yachiyo])
    // ぜんぶ地元駅
    defense.user.isHomeStation = (s) => true
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
      station: seria.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, yachiyo)).toBe(false)
    expect(result.defendPercent).toBe(0)
  })
  test("発動あり-守備側(被アクセス)", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let yachiyo = DencoManager.getDenco(context, "27", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [yachiyo, seria])
    // ぜんぶ地元駅
    defense.user.isHomeStation = (s) => true
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
      station: yachiyo.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, yachiyo)).toBe(true)
    expect(result.defendPercent).toBe(24)
  })
  test("発動あり-守備側(被アクセス)-確率ブースト", () => {
    const context = initContext("test", "test", false)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let yachiyo = DencoManager.getDenco(context, "27", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [yachiyo, hiiru])
    // ぜんぶ地元駅
    defense.user.isHomeStation = (s) => true
    defense = activateSkill(context, defense, 1)
    hiiru = defense.formation[1]
    expect(isSkillActive(hiiru.skill)).toBe(true)
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
      station: yachiyo.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, yachiyo)).toBe(true)
    // 確率補正は効かない
    expect(hasSkillTriggered(result.defense, hiiru)).toBe(false)
    expect(result.defendPercent).toBe(24)
  })

})
import moment from "moment-timezone"
import { DencoManager, init } from "../.."
import { getDefense, hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import { activateSkill, deactivateSkill, getSkill } from "../../core/skill"
import { initUser, refreshState } from "../../core/user"

describe("ハルのスキル", () => {
  beforeAll(init)
  test("スキル状態", () => {
    const context = initContext("test", "test", false)
    let haru = DencoManager.getDenco(context, "40", 50)
    expect(haru.skill.type).toBe("possess")
    expect(haru.name).toBe("haru")
    let state = initUser(context, "とあるマスター", [haru])
    const now = moment().valueOf()
    context.clock = now
    state = refreshState(context, state)
    haru = state.formation[0]
    let skill = getSkill(haru)
    expect(skill.state.transition).toBe("always")
    expect(skill.state.type).toBe("active")

    expect(() => activateSkill(context, state, 0)).toThrowError()
    expect(() => deactivateSkill(context, state, 0)).toThrowError()


    context.clock = now + 600 * 1000
    state = refreshState(context, state)
    haru = state.formation[0]
    skill = getSkill(haru)
    expect(skill.state.transition).toBe("always")
    expect(skill.state.type).toBe("active")
  })
  test("発動あり-相手編成", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let haru = DencoManager.getDenco(context, "40", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let fubu = DencoManager.getDenco(context, "14", 50)
    let defense = initUser(context, "とあるマスター", [charlotte, fubu])
    defense = activateSkill(context, defense, 1)
    let offense = initUser(context, "とあるマスター２", [haru])
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
    expect(hasSkillTriggered(result.offense, haru)).toBe(true)
    expect(hasSkillTriggered(result.defense, fubu)).toBe(false)
    // スキル無効化の確認
    let d = getDefense(result).formation[1]
    expect(d.skillInvalidated).toBe(true)
    expect(result.defendPercent).toBe(0)
  })
  test("発動なし-非アクティブなサポーター", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let haru = DencoManager.getDenco(context, "40", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let fubu = DencoManager.getDenco(context, "14", 50)
    let defense = initUser(context, "とあるマスター", [charlotte, fubu])
    let offense = initUser(context, "とあるマスター２", [haru])
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
    expect(hasSkillTriggered(result.offense, haru)).toBe(false)
    expect(hasSkillTriggered(result.defense, fubu)).toBe(false)
    // スキル無効化の確認
    let d = getDefense(result).formation[1]
    expect(d.skillInvalidated).toBe(false)
    expect(result.defendPercent).toBe(0)
  })
  test("発動なし-フットバース", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let haru = DencoManager.getDenco(context, "40", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let fubu = DencoManager.getDenco(context, "14", 50)
    let defense = initUser(context, "とあるマスター", [charlotte, fubu])
    defense = activateSkill(context, defense, 1)
    let offense = initUser(context, "とあるマスター２", [haru])
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
      usePink: true,
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.offense, haru)).toBe(false)
    expect(hasSkillTriggered(result.defense, fubu)).toBe(false)
  })
  test("発動なし-相手なし", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let haru = DencoManager.getDenco(context, "40", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50)
    let offense = initUser(context, "とあるマスター２", [haru, reika])
    offense = activateSkill(context, offense, 1)
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      station: charlotte.link[0],
      usePink: true,
    }
    const result = startAccess(context, config)
    expect(result.defense).toBeUndefined()
    expect(hasSkillTriggered(result.offense, haru)).toBe(false)
    expect(hasSkillTriggered(result.defense, reika)).toBe(false)
    let d = result.offense.formation[1]
    expect(d.skillInvalidated).toBe(false)
  })
  test("発動なし-サポーター以外", () => {
    const context = initContext("test", "test", false)
    context.clock = moment('2022-01-01T23:00:00+0900').valueOf()
    context.random.mode = "force"
    let haru = DencoManager.getDenco(context, "40", 50)
    let luna = DencoManager.getDenco(context, "3", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [luna, charlotte])
    let offense = initUser(context, "とあるマスター２", [haru])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: luna.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.offense, haru)).toBe(false)
    expect(hasSkillTriggered(result.defense, luna)).toBe(true)
    // スキル無効化の確認
    let d = getDefense(result).formation[0]
    expect(d.skillInvalidated).toBe(false)
    expect(result.defendPercent).toBe(25)
  })
  test("発動なし-確率", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "ignore"
    let haru = DencoManager.getDenco(context, "40", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let fubu = DencoManager.getDenco(context, "14", 50)
    let defense = initUser(context, "とあるマスター", [charlotte, fubu])
    defense = activateSkill(context, defense, 1)
    let offense = initUser(context, "とあるマスター２", [haru])
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
    expect(hasSkillTriggered(result.offense, haru)).toBe(false)
    expect(hasSkillTriggered(result.defense, fubu)).toBe(true)
    // スキル無効化の確認
    let d = getDefense(result).formation[1]
    expect(d.skillInvalidated).toBe(false)
    expect(result.defendPercent).toBe(19)
  })
  test("発動あり-確率補正あり", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let haru = DencoManager.getDenco(context, "40", 50)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let fubu = DencoManager.getDenco(context, "14", 50)
    let defense = initUser(context, "とあるマスター", [charlotte, fubu])
    defense = activateSkill(context, defense, 1)
    let offense = initUser(context, "とあるマスター２", [haru, hiiru])
    offense = activateSkill(context, offense, 1)
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
    expect(hasSkillTriggered(result.offense, haru)).toBe(true)
    expect(hasSkillTriggered(result.offense, hiiru)).toBe(true)
    expect(hasSkillTriggered(result.defense, fubu)).toBe(false)
    // スキル無効化の確認
    let d = getDefense(result).formation[1]
    expect(d.skillInvalidated).toBe(true)
    expect(result.defendPercent).toBe(0)
  })
  test("発動なし-確率補正あり", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "ignore"
    let haru = DencoManager.getDenco(context, "40", 50)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let fubu = DencoManager.getDenco(context, "14", 50)
    let defense = initUser(context, "とあるマスター", [charlotte, fubu])
    defense = activateSkill(context, defense, 1)
    let offense = initUser(context, "とあるマスター２", [haru, hiiru])
    offense = activateSkill(context, offense, 1)
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
    expect(hasSkillTriggered(result.offense, haru)).toBe(false)
    expect(hasSkillTriggered(result.offense, hiiru)).toBe(true)
    expect(hasSkillTriggered(result.defense, fubu)).toBe(true)
    // スキル無効化の確認
    let d = getDefense(result).formation[1]
    expect(d.skillInvalidated).toBe(false)
    expect(result.defendPercent).toBe(19)
  })
  test("発動あり-両編成", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let haru = DencoManager.getDenco(context, "40", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let fubu = DencoManager.getDenco(context, "14", 50)
    let defense = initUser(context, "とあるマスター", [charlotte, fubu])
    defense = activateSkill(context, defense, 1)
    let offense = initUser(context, "とあるマスター２", [haru, reika])
    offense = activateSkill(context, offense, 1)
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
    expect(hasSkillTriggered(result.offense, haru)).toBe(true)
    expect(hasSkillTriggered(result.offense, reika)).toBe(false)
    expect(hasSkillTriggered(result.defense, fubu)).toBe(false)
    // スキル無効化の確認
    let d = getDefense(result).formation[1]
    expect(d.skillInvalidated).toBe(true)
    d = result.offense.formation[1]
    expect(d.skillInvalidated).toBe(true)
    expect(result.defendPercent).toBe(0)
    expect(result.attackPercent).toBe(0)
  })

})
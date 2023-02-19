import dayjs from "dayjs"
import { DencoManager, init } from "../.."
import { getDefense, getSkillTrigger, hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import { activateSkill } from "../../core/skill"
import { initUser } from "../../core/user"
import "../../gen/matcher"
import { testAlwaysSkill } from "../tool/skillState"

describe("ハルのスキル", () => {
  beforeAll(init)

  testAlwaysSkill({
    number: "40",
    name: "haru"
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
    expect(hasSkillTriggered(result, "offense", haru)).toBe(true)
    expect(hasSkillTriggered(result, "defense", fubu)).toBe(false)
    // スキル無効化の確認
    let t = getSkillTrigger(result, "defense", fubu)[0]
    expect(t.skillName).toBe("根性入れてやるかー Lv.4")
    expect(t.invalidated).toBe(true)
    expect(t.canTrigger).toBe(false)
    expect(t.triggered).toBe(false)
    expect(t.probability).toBe(100)
    expect(t.boostedProbability).toBe(0)
    expect(t.denco.which).toBe("defense")
    expect(t.denco.who).toBe("other")
    expect(t.denco.carIndex).toBe(1)
    expect(t.denco).toMatchDenco(fubu)
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
    expect(hasSkillTriggered(result, "offense", haru)).toBe(false)
    expect(hasSkillTriggered(result, "defense", fubu)).toBe(false)
    // スキル無効化の確認
    let t = getSkillTrigger(result, "defense", fubu)
    expect(t.length).toBe(0)
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
    expect(hasSkillTriggered(result, "offense", haru)).toBe(false)
    expect(hasSkillTriggered(result, "defense", fubu)).toBe(false)
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
    expect(hasSkillTriggered(result, "offense", haru)).toBe(false)
    expect(hasSkillTriggered(result, "defense", reika)).toBe(false)
    let d = result.offense.formation[1]
    expect(d.skillInvalidated).toBe(false)
  })
  test("発動なし-サポーター以外", () => {
    const context = initContext("test", "test", false)
    context.clock = dayjs('2022-01-01T23:00:00+0900').valueOf()
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
    expect(hasSkillTriggered(result, "offense", haru)).toBe(false)
    expect(hasSkillTriggered(result, "defense", luna)).toBe(true)
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
    expect(hasSkillTriggered(result, "offense", haru)).toBe(false)
    expect(hasSkillTriggered(result, "defense", fubu)).toBe(true)
    let t = getSkillTrigger(result, "offense", haru)[0]
    expect(t.skillName).toBe("ウィルパワー Lv.4")
    expect(t.invalidated).toBe(false)
    expect(t.canTrigger).toBe(false)
    expect(t.triggered).toBe(false)
    expect(t.probability).toBe(24)
    expect(t.boostedProbability).toBe(24)
    expect(t.denco.which).toBe("offense")
    expect(t.denco.who).toBe("offense")
    expect(t.denco.carIndex).toBe(0)
    expect(t.denco).toMatchDenco(haru)

    // スキル無効化の確認
    t = getSkillTrigger(result, "defense", fubu)[0]
    expect(t.skillName).toBe("根性入れてやるかー Lv.4")
    expect(t.invalidated).toBe(false)
    expect(t.canTrigger).toBe(true)
    expect(t.triggered).toBe(true)
    expect(t.probability).toBe(100)
    expect(t.boostedProbability).toBe(100)
    expect(t.denco.which).toBe("defense")
    expect(t.denco.who).toBe("other")
    expect(t.denco.carIndex).toBe(1)
    expect(t.denco).toMatchDenco(fubu)

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
    expect(hasSkillTriggered(result, "offense", haru)).toBe(true)
    expect(hasSkillTriggered(result, "offense", hiiru)).toBe(true)
    expect(hasSkillTriggered(result, "defense", fubu)).toBe(false)
    expect(result.defendPercent).toBe(0)

    let t = getSkillTrigger(result, "offense", haru)[0]
    expect(t.skillName).toBe("ウィルパワー Lv.4")
    expect(t.invalidated).toBe(false)
    expect(t.canTrigger).toBe(true)
    expect(t.triggered).toBe(true)
    expect(t.probability).toBe(24)
    expect(t.boostedProbability).toBe(24 * 1.2)
    // スキル無効化の確認
    t = getSkillTrigger(result, "defense", fubu)[0]
    expect(t.skillName).toBe("根性入れてやるかー Lv.4")
    expect(t.invalidated).toBe(true)
    expect(t.canTrigger).toBe(false)
    expect(t.triggered).toBe(false)
    expect(t.probability).toBe(100)
    expect(t.boostedProbability).toBe(0)
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
    expect(hasSkillTriggered(result, "offense", haru)).toBe(false)
    expect(hasSkillTriggered(result, "offense", hiiru)).toBe(true)
    expect(hasSkillTriggered(result, "defense", fubu)).toBe(true)

    let t = getSkillTrigger(result, "offense", haru)[0]
    expect(t.skillName).toBe("ウィルパワー Lv.4")
    expect(t.invalidated).toBe(false)
    expect(t.canTrigger).toBe(false)
    expect(t.triggered).toBe(false)
    expect(t.probability).toBe(24)
    expect(t.boostedProbability).toBe(24 * 1.2)
    // スキル無効化の確認
    t = getSkillTrigger(result, "defense", fubu)[0]
    expect(t.skillName).toBe("根性入れてやるかー Lv.4")
    expect(t.invalidated).toBe(false)
    expect(t.canTrigger).toBe(true)
    expect(t.triggered).toBe(true)
    expect(t.probability).toBe(100)
    expect(t.boostedProbability).toBe(100)
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
    expect(hasSkillTriggered(result, "offense", haru)).toBe(true)
    expect(hasSkillTriggered(result, "offense", reika)).toBe(false)
    expect(hasSkillTriggered(result, "defense", fubu)).toBe(false)
    let t = getSkillTrigger(result, "offense", haru)[0]
    
    expect(t.skillName).toBe("ウィルパワー Lv.4")
    expect(t.invalidated).toBe(false)
    expect(t.canTrigger).toBe(true)
    expect(t.triggered).toBe(true)
    expect(t.probability).toBe(24)
    expect(t.boostedProbability).toBe(24)
    // スキル無効化の確認
    t = getSkillTrigger(result, "offense", reika)[0]
    expect(t.skillName).toBe("起動加速度向上 Lv.4")
    expect(t.invalidated).toBe(true)
    expect(t.canTrigger).toBe(false)
    expect(t.triggered).toBe(false)
    expect(t.probability).toBe(100)
    expect(t.boostedProbability).toBe(0)
    t = getSkillTrigger(result, "defense", fubu)[0]
    expect(t.skillName).toBe("根性入れてやるかー Lv.4")
    expect(t.invalidated).toBe(true)
    expect(t.canTrigger).toBe(false)
    expect(t.triggered).toBe(false)
    expect(t.probability).toBe(100)
    expect(t.boostedProbability).toBe(0)
  })
  test("発動なし-相手編成-フットバース", () => {
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
    expect(hasSkillTriggered(result, "offense", haru)).toBe(false)
    expect(hasSkillTriggered(result, "defense", fubu)).toBe(false)
  })
  test("発動なし-両編成-フットバース", () => {
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
      usePink: true,
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "offense", haru)).toBe(false)
    expect(hasSkillTriggered(result, "offense", reika)).toBe(false)
    expect(hasSkillTriggered(result, "defense", fubu)).toBe(false)
  })

})
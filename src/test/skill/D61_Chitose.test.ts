import dayjs from "dayjs"
import { DencoManager, init } from "../.."
import { getSkillTrigger, hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import { activateSkill, isSkillActive } from "../../core/skill"
import { initUser } from "../../core/user"
import "../../gen/matcher"
import { testManualSkill } from "../tool/skillState"

describe("ちとせのスキル", () => {
  beforeAll(init)


  testManualSkill({
    number: "61",
    name: "chitose",
    active: 900,
    cooldown: 14400,
  })

  test("発動あり-攻撃側", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let chitose = DencoManager.getDenco(context, "61", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let fubu = DencoManager.getDenco(context, "14", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let defense = initUser(context, "とあるマスター", [charlotte, fubu])
    defense = activateSkill(context, defense, 1)
    let offense = initUser(context, "とあるマスター２", [chitose, reika])
    offense = activateSkill(context, offense, 0, 1)
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
    expect(hasSkillTriggered(result, "offense", chitose)).toBe(true)
    expect(hasSkillTriggered(result, "offense", reika)).toBe(false)
    expect(hasSkillTriggered(result, "defense", fubu)).toBe(false)
    // スキル無効化の確認
    let t = getSkillTrigger(result, "offense", reika)[0]
    expect(t.denco).toMatchDenco(reika)
    expect(t.skillName).toBe("起動加速度向上 Lv.4")
    expect(t.probability).toBe(100)
    expect(t.boostedProbability).toBe(0)
    expect(t.invalidated).toBe(true)
    expect(t.canTrigger).toBe(false)
    expect(t.triggered).toBe(false)
    t = getSkillTrigger(result, "defense", fubu)[0]
    expect(t.denco).toMatchDenco(fubu)
    expect(t.skillName).toBe("根性入れてやるかー Lv.4")
    expect(t.probability).toBe(100)
    expect(t.boostedProbability).toBe(0)
    expect(t.invalidated).toBe(true)
    expect(t.canTrigger).toBe(false)
    expect(t.triggered).toBe(false)
    expect(result.defendPercent).toBe(0)
    expect(result.attackPercent).toBe(0)
  })
  test("発動あり-守備側", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let chitose = DencoManager.getDenco(context, "61", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let fubu = DencoManager.getDenco(context, "14", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let defense = initUser(context, "とあるマスター", [charlotte, fubu, chitose])
    defense = activateSkill(context, defense, 1, 2)
    let offense = initUser(context, "とあるマスター２", [reika])
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
      station: charlotte.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "offense", reika)).toBe(false)
    expect(hasSkillTriggered(result, "defense", chitose)).toBe(true)
    expect(hasSkillTriggered(result, "defense", fubu)).toBe(false)
    // スキル無効化の確認
    let t = getSkillTrigger(result, "offense", reika)[0]
    expect(t.denco).toMatchDenco(reika)
    expect(t.skillName).toBe("起動加速度向上 Lv.4")
    expect(t.invalidated).toBe(true)
    expect(t.canTrigger).toBe(false)
    expect(t.triggered).toBe(false)
    t = getSkillTrigger(result, "defense", fubu)[0]
    expect(t.denco).toMatchDenco(fubu)
    expect(t.skillName).toBe("根性入れてやるかー Lv.4")
    expect(t.invalidated).toBe(true)
    expect(t.canTrigger).toBe(false)
    expect(t.triggered).toBe(false)
    expect(result.defendPercent).toBe(0)
    expect(result.attackPercent).toBe(0)
  })
  test("発動なし-非アクティブなサポーター", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let chitose = DencoManager.getDenco(context, "61", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let fubu = DencoManager.getDenco(context, "14", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let defense = initUser(context, "とあるマスター", [charlotte, fubu])
    let offense = initUser(context, "とあるマスター２", [chitose, reika])
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
      station: charlotte.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "offense", chitose)).toBe(false)
    expect(hasSkillTriggered(result, "offense", reika)).toBe(false)
    expect(hasSkillTriggered(result, "defense", fubu)).toBe(false)
    // スキル無効化の確認
    let t = getSkillTrigger(result, "offense", reika)
    expect(t.length).toBe(0)
    t = getSkillTrigger(result, "defense", fubu)
    expect(t.length).toBe(0)
    expect(result.defendPercent).toBe(0)
    expect(result.attackPercent).toBe(0)
  })

  test("発動なし-アクセス時に影響しないサポーター", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let chitose = DencoManager.getDenco(context, "61", 50)
    let charlotte = DencoManager.getDenco(context, "6", 80, 1)
    charlotte.currentHp = charlotte.maxHp - 1
    let moe = DencoManager.getDenco(context, "9", 50)
    let defense = initUser(context, "とあるマスター", [charlotte, moe])
    // もえactive
    expect(isSkillActive(defense.formation[1].skill)).toBe(true)
    let offense = initUser(context, "とあるマスター２", [chitose])
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
      station: charlotte.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "offense", chitose)).toBe(false)
    // スキル無効化の確認スキル無効化の確認
    let t = getSkillTrigger(result, "defense", moe)
    expect(t.length).toBe(0)
  })
  test("発動なし-フットバース", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let chitose = DencoManager.getDenco(context, "61", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let fubu = DencoManager.getDenco(context, "14", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let defense = initUser(context, "とあるマスター", [charlotte, fubu])
    defense = activateSkill(context, defense, 1)
    let offense = initUser(context, "とあるマスター２", [chitose, reika])
    offense = activateSkill(context, offense, 0, 1)
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
    expect(hasSkillTriggered(result, "offense", chitose)).toBe(false)
    expect(hasSkillTriggered(result, "offense", reika)).toBe(false)
    expect(hasSkillTriggered(result, "defense", fubu)).toBe(false)
  })
  test("発動なし-相手なし", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let chitose = DencoManager.getDenco(context, "61", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50)
    let offense = initUser(context, "とあるマスター２", [chitose, reika])
    offense = activateSkill(context, offense, 0, 1)
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      station: charlotte.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).toBeUndefined()
    expect(hasSkillTriggered(result, "offense", chitose)).toBe(false)
    expect(hasSkillTriggered(result, "offense", reika)).toBe(false)
    let t = getSkillTrigger(result, "defense", reika)
    expect(t.length).toBe(0)
  })
  test("発動なし-サポーター以外", () => {
    const context = initContext("test", "test", false)
    context.clock = dayjs('2022-01-01T23:00:00+0900').valueOf()
    context.random.mode = "force"
    let luna = DencoManager.getDenco(context, "3", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let hokone = DencoManager.getDenco(context, "26", 50)
    let chitose = DencoManager.getDenco(context, "61", 50)
    let defense = initUser(context, "とあるマスター", [luna, charlotte])
    let offense = initUser(context, "とあるマスター２", [hokone, chitose])
    offense = activateSkill(context, offense, 0, 1)
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
    expect(hasSkillTriggered(result, "offense", hokone)).toBe(true)
    expect(hasSkillTriggered(result, "offense", chitose)).toBe(false)
    expect(hasSkillTriggered(result, "defense", luna)).toBe(true)
  })
  test("発動なし-確率", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "ignore"
    let chitose = DencoManager.getDenco(context, "61", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let fubu = DencoManager.getDenco(context, "14", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let defense = initUser(context, "とあるマスター", [charlotte, fubu])
    defense = activateSkill(context, defense, 1)
    let offense = initUser(context, "とあるマスター２", [chitose, reika])
    offense = activateSkill(context, offense, 0, 1)
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
    expect(hasSkillTriggered(result, "offense", chitose)).toBe(false)
    expect(hasSkillTriggered(result, "offense", reika)).toBe(true)
    expect(hasSkillTriggered(result, "defense", fubu)).toBe(true)
  })
  test("発動あり-確率補正", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let chitose = DencoManager.getDenco(context, "61", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let fubu = DencoManager.getDenco(context, "14", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let defense = initUser(context, "とあるマスター", [charlotte, fubu])
    defense = activateSkill(context, defense, 1)
    let offense = initUser(context, "とあるマスター２", [chitose, reika, hiiru])
    offense = activateSkill(context, offense, 0, 1, 2)
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
    expect(hasSkillTriggered(result, "offense", chitose)).toBe(true)
    expect(hasSkillTriggered(result, "offense", hiiru)).toBe(true)
    expect(hasSkillTriggered(result, "offense", reika)).toBe(false)
    expect(hasSkillTriggered(result, "defense", fubu)).toBe(false)
    // スキル無効化の確認
    let t = getSkillTrigger(result, "offense", reika)[0]
    expect(t.denco).toMatchDenco(reika)
    expect(t.skillName).toBe("起動加速度向上 Lv.4")
    expect(t.invalidated).toBe(true)
    expect(t.canTrigger).toBe(false)
    expect(t.triggered).toBe(false)
    t = getSkillTrigger(result, "defense", fubu)[0]
    expect(t.denco).toMatchDenco(fubu)
    expect(t.skillName).toBe("根性入れてやるかー Lv.4")
    expect(t.invalidated).toBe(true)
    expect(t.canTrigger).toBe(false)
    expect(t.triggered).toBe(false)

    expect(result.defendPercent).toBe(0)
    expect(result.attackPercent).toBe(0)

    // ひいるのサポータなので無効化影響を受けるが無効化の前に評価・発動する
    t = getSkillTrigger(result, "offense", hiiru)[0]
    expect(t.denco).toMatchDenco(hiiru)
    expect(t.skillName).toBe("テンションAGEAGE↑↑ Lv.4")
    expect(t.invalidated).toBe(false)
    expect(t.canTrigger).toBe(true)
    expect(t.triggered).toBe(true)
    t = getSkillTrigger(result, "offense", chitose)[0]
    expect(t.denco).toMatchDenco(chitose)
    expect(t.skillName).toBe("うつろうひととせ Lv.4")
    expect(t.probability).toBe(55)
    expect(t.boostedProbability).toBe(55 * 1.2)
    expect(t.invalidated).toBe(false)
    expect(t.canTrigger).toBe(true)
    expect(t.triggered).toBe(true)
  })
  test("発動あり-確率補正なし", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let chitose = DencoManager.getDenco(context, "61", 80)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let fubu = DencoManager.getDenco(context, "14", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let defense = initUser(context, "とあるマスター", [charlotte, fubu])
    defense = activateSkill(context, defense, 1)
    let offense = initUser(context, "とあるマスター２", [chitose, reika, hiiru])
    offense = activateSkill(context, offense, 0, 1, 2)
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
    expect(hasSkillTriggered(result, "offense", chitose)).toBe(true)
    expect(hasSkillTriggered(result, "offense", hiiru)).toBe(false) // 確率依存の発動スキルなし
    expect(hasSkillTriggered(result, "offense", reika)).toBe(false)
    expect(hasSkillTriggered(result, "defense", fubu)).toBe(false)
    // スキル無効化の確認
    let t = getSkillTrigger(result, "offense", reika)[0]
    expect(t.denco).toMatchDenco(reika)
    expect(t.skillName).toBe("起動加速度向上 Lv.4")
    expect(t.invalidated).toBe(true)
    expect(t.canTrigger).toBe(false)
    expect(t.triggered).toBe(false)
    t = getSkillTrigger(result, "defense", fubu)[0]
    expect(t.denco).toMatchDenco(fubu)
    expect(t.skillName).toBe("根性入れてやるかー Lv.4")
    expect(t.invalidated).toBe(true)
    expect(t.canTrigger).toBe(false)
    expect(t.triggered).toBe(false)

    expect(result.defendPercent).toBe(0)
    expect(result.attackPercent).toBe(0)
    // ひいるのサポータなので無効化影響を受けるが無効化の前に評価・発動する
    t = getSkillTrigger(result, "offense", hiiru)[0]
    expect(t.denco).toMatchDenco(hiiru)
    expect(t.skillName).toBe("テンションAGEAGE↑↑ Lv.4")
    expect(t.invalidated).toBe(false)
    expect(t.canTrigger).toBe(true)
    expect(t.triggered).toBe(false)
    t = getSkillTrigger(result, "offense", chitose)[0]
    expect(t.denco).toMatchDenco(chitose)
    expect(t.skillName).toBe("見果てぬ景色")
    expect(t.probability).toBe(100)
    expect(t.boostedProbability).toBe(100)
    expect(t.invalidated).toBe(false)
    expect(t.canTrigger).toBe(true)
    expect(t.triggered).toBe(true)
  })
})
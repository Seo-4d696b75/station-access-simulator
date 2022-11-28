import dayjs from "dayjs"
import { DencoManager, init } from "../.."
import { getDefense, hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import { activateSkill } from "../../core/skill"
import { initUser } from "../../core/user"
import { testManualSkill } from "../skillState"

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
    expect(hasSkillTriggered(result.offense, chitose)).toBe(true)
    expect(hasSkillTriggered(result.offense, reika)).toBe(false)
    expect(hasSkillTriggered(result.defense, fubu)).toBe(false)
    // スキル無効化の確認
    let d = getDefense(result).formation[1]
    expect(d.skillInvalidated).toBe(true)
    expect(result.defendPercent).toBe(0)
    d = result.offense.formation[1]
    expect(d.skillInvalidated).toBe(true)
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
    expect(hasSkillTriggered(result.offense, reika)).toBe(false)
    expect(hasSkillTriggered(result.defense, chitose)).toBe(true)
    expect(hasSkillTriggered(result.defense, fubu)).toBe(false)
    // スキル無効化の確認
    let d = getDefense(result).formation[1]
    expect(d.skillInvalidated).toBe(true)
    expect(result.defendPercent).toBe(0)
    d = result.offense.formation[0]
    expect(d.skillInvalidated).toBe(true)
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
    expect(hasSkillTriggered(result.offense, chitose)).toBe(false)
    expect(hasSkillTriggered(result.offense, reika)).toBe(false)
    expect(hasSkillTriggered(result.defense, fubu)).toBe(false)
    // スキル無効化の確認
    let d = getDefense(result).formation[1]
    expect(d.skillInvalidated).toBe(false)
    expect(result.defendPercent).toBe(0)
    d = result.offense.formation[1]
    expect(d.skillInvalidated).toBe(false)
    expect(result.attackPercent).toBe(0)
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
    expect(hasSkillTriggered(result.offense, chitose)).toBe(false)
    expect(hasSkillTriggered(result.offense, reika)).toBe(false)
    expect(hasSkillTriggered(result.defense, fubu)).toBe(false)
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
    expect(hasSkillTriggered(result.offense, chitose)).toBe(false)
    expect(hasSkillTriggered(result.offense, reika)).toBe(false)
    let d = result.offense.formation[1]
    expect(d.skillInvalidated).toBe(false)
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
    expect(hasSkillTriggered(result.offense, hokone)).toBe(true)
    expect(hasSkillTriggered(result.offense, chitose)).toBe(false)
    expect(hasSkillTriggered(result.defense, luna)).toBe(true)
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
    expect(hasSkillTriggered(result.offense, chitose)).toBe(false)
    expect(hasSkillTriggered(result.offense, reika)).toBe(true)
    expect(hasSkillTriggered(result.defense, fubu)).toBe(true)
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
    expect(hasSkillTriggered(result.offense, chitose)).toBe(true)
    expect(hasSkillTriggered(result.offense, hiiru)).toBe(true)
    expect(hasSkillTriggered(result.offense, reika)).toBe(false)
    expect(hasSkillTriggered(result.defense, fubu)).toBe(false)
    // スキル無効化の確認
    let d = getDefense(result).formation[1]
    expect(d.skillInvalidated).toBe(true)
    expect(result.defendPercent).toBe(0)
    d = result.offense.formation[1]
    expect(d.skillInvalidated).toBe(true)
    expect(result.attackPercent).toBe(0)
    // ひいるのサポータなので無効化影響を受けるが無効化の前に評価・発動する
    d = result.offense.formation[2]
    expect(d.skillInvalidated).toBe(true)
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
    expect(hasSkillTriggered(result.offense, chitose)).toBe(true)
    expect(hasSkillTriggered(result.offense, hiiru)).toBe(false) // 確率依存の発動スキルなし
    expect(hasSkillTriggered(result.offense, reika)).toBe(false)
    expect(hasSkillTriggered(result.defense, fubu)).toBe(false)
    // スキル無効化の確認
    let d = getDefense(result).formation[1]
    expect(d.skillInvalidated).toBe(true)
    expect(result.defendPercent).toBe(0)
    d = result.offense.formation[1]
    expect(d.skillInvalidated).toBe(true)
    expect(result.attackPercent).toBe(0)
    // ひいるのサポータなので無効化影響を受けるが無効化の前に評価・発動する
    d = result.offense.formation[2]
    expect(d.skillInvalidated).toBe(true)
  })
})
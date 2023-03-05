import dayjs from "dayjs"
import { activateSkill, DencoState, getSkillTrigger, hasSkillTriggered, init, initContext, initUser, isSkillActive, startAccess } from "../.."
import DencoManager from "../../core/dencoManager"
import { testManualSkill } from "../tool/skillState"


const targetList = ["15", "19", "26", "30", "42", "59", "66", "68", "72", "76", "80", "83", "87", "97"]
/*
  特定条件でないとダメージ増加スキルが発動しない
  とりあえず個別にテストする
  28 Riona 駅アクセス数の差
  32 Kotan アクセス駅数
  44 Saika 移動距離
  46 Ataru 被アクセス数
  53 Malin 編成
  64 Akehi 移動距離
  75 Nina 経験値付与は発動する
  78 Naru 確率でスコア増加orATK増加
  85 Meguru アクセス回数
*/

describe("エリアのスキル", () => {
  beforeAll(init)

  testManualSkill({
    number: "33",
    name: "eria",
    active: 14400,
    cooldown: 3600
  })

  test.each(targetList)("発動あり-守備側(被アクセス)-相手:%s", (number) => {
    const context = initContext("test", "test", false)
    // 一部対象は特定時間帯のみ
    // TODO 時間帯に依存するスキルの場合はここで処理を追加
    if (number === "15") {
      context.clock = dayjs('2022-01-01T12:00:00+0900').valueOf()
    } else if (number === "30") {
      context.clock = dayjs('2022-01-01T20:00:00+0900').valueOf()
    } else if (number === "42") {
      context.clock = dayjs('2022-11-02T12:00:00+0900').valueOf()
    }
    let seria = DencoManager.getDenco(context, "1", 50)
    let eria = DencoManager.getDenco(context, "33", 50, 1)
    let test: DencoState | null = null
    try {
      // TODO 未実装の対象に関してはスキップで対応
      test = DencoManager.getDenco(context, number, 50)
    } catch {
      console.warn(`number: ${number} not found`)
      return
    }
    let defense = initUser(context, "とあるマスター", [eria, seria])
    defense = activateSkill(context, defense, 0)
    eria = defense.formation[0]
    expect(isSkillActive(eria.skill)).toBe(true)
    let offense = initUser(context, "とあるマスター２", [test])
    test = offense.formation[0]
    if (!isSkillActive(test.skill)) {
      offense = activateSkill(context, offense, 0)
      test = offense.formation[0]
    }
    expect(isSkillActive(test.skill)).toBe(true)
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: eria.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "defense", eria)).toBe(true)
    expect(hasSkillTriggered(result, "offense", test)).toBe(false)
    // 無効化の確認
    let t = getSkillTrigger(result, "offense", test)[0]
    expect(t.invalidated).toBe(true)
    expect(t.canTrigger).toBe(false)
    expect(t.triggered).toBe(false)
    t = getSkillTrigger(result, "defense", eria)[0]
    expect(t.skillName).toBe("天真爛漫 Lv.4")
    expect(t.probability).toBe(100)
    expect(t.triggered).toBe(true)
  })

  test("発動あり-守備側(被アクセス)-確率ブースト", () => {
    const context = initContext("test", "test", false)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let eria = DencoManager.getDenco(context, "33", 50, 1)
    let imura = DencoManager.getDenco(context, "19", 50)
    let defense = initUser(context, "とあるマスター", [eria, hiiru])
    defense = activateSkill(context, defense, 0, 1)
    let offense = initUser(context, "とあるマスター２", [imura])
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
      station: eria.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "defense", eria)).toBe(true)
    expect(hasSkillTriggered(result, "defense", hiiru)).toBe(false)
    let t = getSkillTrigger(result, "defense", eria)[0]
    expect(t.skillName).toBe("天真爛漫 Lv.4")
    expect(t.probability).toBe(100)
    expect(t.boostedProbability).toBe(100)
    expect(t.triggered).toBe(true)
    expect(result.attackPercent).toBe(0)
  })

  test("発動なし-守備側(編成内)-イムラ相手", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50, 1)
    let eria = DencoManager.getDenco(context, "33", 50)
    let imura = DencoManager.getDenco(context, "19", 50)
    let defense = initUser(context, "とあるマスター", [seria, eria])
    defense = activateSkill(context, defense, 1)
    eria = defense.formation[1]
    expect(isSkillActive(eria.skill)).toBe(true)
    let offense = initUser(context, "とあるマスター２", [imura])
    offense = activateSkill(context, offense, 0)
    imura = offense.formation[0]
    expect(isSkillActive(imura.skill)).toBe(true)
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
    expect(hasSkillTriggered(result, "defense", eria)).toBe(false)
    expect(hasSkillTriggered(result, "offense", imura)).toBe(true)
    expect(result.attackPercent).toBeGreaterThan(0)
  })
  test("発動なし-守備側(被アクセス)-レーの相手-昼間", () => {
    const context = initContext("test", "test", false)
    context.clock = dayjs('2022-01-01T12:00:00+0900').valueOf()
    let seria = DencoManager.getDenco(context, "1", 50)
    let eria = DencoManager.getDenco(context, "33", 50, 1)
    let reno = DencoManager.getDenco(context, "30", 50)
    let defense = initUser(context, "とあるマスター", [eria, seria])
    defense = activateSkill(context, defense, 0)
    eria = defense.formation[0]
    expect(isSkillActive(eria.skill)).toBe(true)
    let offense = initUser(context, "とあるマスター２", [reno])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: eria.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "defense", eria)).toBe(false)
    expect(hasSkillTriggered(result, "offense", reno)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })
})

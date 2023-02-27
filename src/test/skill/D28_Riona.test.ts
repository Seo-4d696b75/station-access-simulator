import { activateSkill, init, initContext, initUser, isSkillActive } from "../.."
import { getSkillTrigger, hasSkillTriggered, startAccess } from "../../core/access/index"
import DencoManager from "../../core/dencoManager"
import { calcATK } from "../../skill/D28_Riona"
import { testManualSkill } from "../tool/skillState"

describe("リオナのスキル", () => {
  beforeAll(init)

  testManualSkill({
    number: "28",
    name: "riona",
    active: 1500,
    cooldown: 7200,
  })

  test("発動あり-攻撃側(アクセス)", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let riona = DencoManager.getDenco(context, "28", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [riona, seria])
    offense = activateSkill(context, offense, 0)
    riona = offense.formation[0]
    expect(isSkillActive(riona.skill)).toBe(true)
    let defense = initUser(context, "とあるマスター２", [charlotte])
    // 10駅差
    offense.user.history = {
      getStationAccessCount: (s) => 10
    }
    defense.user.history = {
      getStationAccessCount: (s) => 20
    }
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
    expect(hasSkillTriggered(result, "offense", riona)).toBe(true)
    const atk = calcATK(55, 10)
    expect(result.attackPercent).toBe(atk)
  })

  test("発動あり-攻撃側(アクセス)-確率ブースト", () => {
    const context = initContext("test", "test", false)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let riona = DencoManager.getDenco(context, "28", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [riona, hiiru])
    offense = activateSkill(context, offense, 0)
    riona = offense.formation[0]
    expect(isSkillActive(riona.skill)).toBe(true)
    offense = activateSkill(context, offense, 1)
    hiiru = offense.formation[1]
    expect(isSkillActive(hiiru.skill)).toBe(true)
    let defense = initUser(context, "とあるマスター２", [charlotte])
    // 10駅差
    offense.user.history = {
      getStationAccessCount: (s) => 10
    }
    defense.user.history = {
      getStationAccessCount: (s) => 20
    }
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
    expect(hasSkillTriggered(result, "offense", riona)).toBe(true)
    const t = getSkillTrigger(result, "offense", riona)[0]
    expect(t.skillName).toBe("データアクセラレーター Lv.4")
    expect(t.probability).toBe(100)
    expect(t.boostedProbability).toBe(100)
    // 確率補正は効かない
    expect(hasSkillTriggered(result, "offense", hiiru)).toBe(false)
    expect(result.attackPercent).toBe(calcATK(55, 10))
  })
  test("発動なし-攻撃側(アクセス)-非アクティブ", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let riona = DencoManager.getDenco(context, "28", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [riona, seria])
    let defense = initUser(context, "とあるマスター２", [charlotte])
    // 10駅差
    offense.user.history = {
      getStationAccessCount: (s) => 10
    }
    defense.user.history = {
      getStationAccessCount: (s) => 20
    }
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
    expect(hasSkillTriggered(result, "offense", riona)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })
  test("発動なし-攻撃側(アクセス)-駅数差なし", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let riona = DencoManager.getDenco(context, "28", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [riona, seria])
    offense = activateSkill(context, offense, 0)
    riona = offense.formation[0]
    expect(isSkillActive(riona.skill)).toBe(true)
    let defense = initUser(context, "とあるマスター２", [charlotte])
    // 0駅差
    offense.user.history = {
      getStationAccessCount: (s) => 20
    }
    defense.user.history = {
      getStationAccessCount: (s) => 20
    }
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
    expect(hasSkillTriggered(result, "offense", riona)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })
  test("発動なし-攻撃側(アクセス)-相手なし", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let riona = DencoManager.getDenco(context, "28", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [riona, seria])
    offense = activateSkill(context, offense, 0)
    riona = offense.formation[0]
    expect(isSkillActive(riona.skill)).toBe(true)
    offense.user.history = {
      getStationAccessCount: (s) => 20
    }
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      station: charlotte.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).toBeUndefined()
    expect(hasSkillTriggered(result, "offense", riona)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })

  test("発動なし-攻撃側(編成内)", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let riona = DencoManager.getDenco(context, "28", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [seria, riona])
    offense = activateSkill(context, offense, 0)
    riona = offense.formation[0]
    expect(isSkillActive(riona.skill)).toBe(true)
    let defense = initUser(context, "とあるマスター２", [charlotte])
    // 10駅差
    offense.user.history = {
      getStationAccessCount: (s) => 10
    }
    defense.user.history = {
      getStationAccessCount: (s) => 20
    }
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
    expect(hasSkillTriggered(result, "offense", riona)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })

  test("発動なし-守備側(被アクセス)", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let riona = DencoManager.getDenco(context, "28", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [riona, seria])
    defense = activateSkill(context, defense, 0)
    riona = defense.formation[0]
    expect(isSkillActive(riona.skill)).toBe(true)
    let offense = initUser(context, "とあるマスター２", [charlotte])
    // 10駅差
    offense.user.history = {
      getStationAccessCount: (s) => 20
    }
    defense.user.history = {
      getStationAccessCount: (s) => 10
    }
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: riona.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "defense", riona)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })



  test("発動なし-エリア無効化", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let riona = DencoManager.getDenco(context, "28", 50)
    let eria = DencoManager.getDenco(context, "33", 50, 1)
    let offense = initUser(context, "とあるマスター", [riona, seria])
    offense = activateSkill(context, offense, 0)
    let defense = initUser(context, "とあるマスター２", [eria])
    defense = activateSkill(context, defense, 0)
    // 10駅差
    offense.user.history = {
      getStationAccessCount: (s) => 10
    }
    defense.user.history = {
      getStationAccessCount: (s) => 20
    }
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
    expect(hasSkillTriggered(result, "offense", riona)).toBe(false)
    expect(result.attackPercent).toBe(0)

    let t = getSkillTrigger(result, "offense", riona)[0]
    expect(t.skillName).toBe("データアクセラレーター Lv.4")
    expect(t.canTrigger).toBe(false)
    expect(t.invalidated).toBe(true)
    expect(t.triggered).toBe(false)
  })

})
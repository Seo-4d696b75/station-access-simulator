import moment from "moment-timezone"
import { activateSkill, deactivateSkill, getSkill, init, initContext, initUser, isSkillActive, refreshState } from "../.."
import { hasSkillTriggered, startAccess } from "../../core/access/index"
import DencoManager from "../../core/dencoManager"
import { calcATK } from "../../skill/D28_Riona"

describe("リオナのスキル", () => {
  beforeAll(init)


  // $SKILL_ACTIVE_TIME 有効な時間(sec)
  const SKILL_ACTIVE_TIME = 1500
  // $SKILL_COOLDOWN_TIME CoolDownの時間(sec)
  const SKILL_COOLDOWN_TIME = 7200

  test("スキル状態", () => {
    const context = initContext("test", "test", false)
    let riona = DencoManager.getDenco(context, "28", 50)
    expect(riona.skill.type).toBe("possess")
    let defense = initUser(context, "とあるマスター", [riona])
    const now = moment().valueOf()
    context.clock = now
    riona = defense.formation[0]
    expect(riona.name).toBe("riona")
    let skill = getSkill(riona)
    expect(skill.state.transition).toBe("manual")
    expect(skill.state.type).toBe("idle")
    expect(() => deactivateSkill(context, defense, 0)).toThrowError()
    defense = activateSkill(context, defense, 0)
    riona = defense.formation[0]
    skill = getSkill(riona)
    expect(skill.state.type).toBe("active")
    expect(skill.state.transition).toBe("manual")
    expect(skill.state.data).not.toBeUndefined()
    if (skill.state.type === "active" && skill.state.transition === "manual" && skill.state.data) {
      let data = skill.state.data
      expect(data.activeTimeout).toBe(now + SKILL_ACTIVE_TIME * 1000)
      expect(data.cooldownTimeout).toBe(now + SKILL_ACTIVE_TIME * 1000 + SKILL_COOLDOWN_TIME * 1000)
    }
    expect(() => deactivateSkill(context, defense, 0)).toThrowError()

    // まだアクティブ
    context.clock = now + SKILL_ACTIVE_TIME / 2 * 1000
    defense = refreshState(context, defense)
    riona = defense.formation[0]
    skill = getSkill(riona)
    expect(skill.state.type).toBe("active")

    // ちょうどCoolDown
    context.clock = now + SKILL_ACTIVE_TIME * 1000
    defense = refreshState(context, defense)
    riona = defense.formation[0]
    skill = getSkill(riona)
    expect(skill.state.type).toBe("cooldown")
    expect(skill.state.transition).toBe("manual")
    if (skill.state.type === "cooldown" && skill.state.transition === "manual") {
      let timeout = skill.state.data
      expect(timeout.cooldownTimeout).toBe(now + (SKILL_ACTIVE_TIME + SKILL_COOLDOWN_TIME) * 1000)
    }

    // CoolDown終わり
    context.clock = now + (SKILL_ACTIVE_TIME + SKILL_COOLDOWN_TIME) * 1000
    defense = refreshState(context, defense)
    riona = defense.formation[0]
    skill = getSkill(riona)
    expect(skill.state.type).toBe("idle")
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
    expect(hasSkillTriggered(result.offense, riona)).toBe(true)
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
    expect(hasSkillTriggered(result.offense, riona)).toBe(true)
    // 確率補正は効かない
    expect(hasSkillTriggered(result.offense, hiiru)).toBe(false)
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
    expect(hasSkillTriggered(result.offense, riona)).toBe(false)
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
    expect(hasSkillTriggered(result.offense, riona)).toBe(false)
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
    expect(hasSkillTriggered(result.offense, riona)).toBe(false)
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
    expect(hasSkillTriggered(result.offense, riona)).toBe(false)
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
    expect(hasSkillTriggered(result.defense, riona)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })
})
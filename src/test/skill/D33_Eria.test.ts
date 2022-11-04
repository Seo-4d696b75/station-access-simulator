import moment from "moment-timezone"
import { activateSkill, deactivateSkill, DencoState, getAccessDenco, getSkill, hasSkillTriggered, init, initContext, initUser, isSkillActive, refreshState, startAccess } from "../.."
import DencoManager from "../../core/dencoManager"

// $SKILL_ACTIVE_TIME 有効な時間(sec)
const SKILL_ACTIVE_TIME = 14400
// $SKILL_COOLDOWN_TIME CoolDownの時間(sec)
const SKILL_COOLDOWN_TIME = 3600

const targetList = ["15", "19", "26", "28", "30", "32", "42", "44", "46", "53", "59", "64", "66", "68", "72", "75", "76", "78", "80"]

describe("エリアのスキル", () => {
  beforeAll(init)


  test("スキル状態", () => {
    const context = initContext("test", "test", false)
    let eria = DencoManager.getDenco(context, "33", 50)
    expect(eria.skill.type).toBe("possess")
    let defense = initUser(context, "とあるマスター", [eria])
    const now = moment().valueOf()
    context.clock = now
    eria = defense.formation[0]
    expect(eria.name).toBe("eria")
    let skill = getSkill(eria)
    expect(skill.state.transition).toBe("manual")
    expect(skill.state.type).toBe("idle")
    expect(() => deactivateSkill(context, defense, 0)).toThrowError()
    defense = activateSkill(context, defense, 0)
    eria = defense.formation[0]
    skill = getSkill(eria)
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
    eria = defense.formation[0]
    skill = getSkill(eria)
    expect(skill.state.type).toBe("active")

    // ちょうどCoolDown
    context.clock = now + SKILL_ACTIVE_TIME * 1000
    defense = refreshState(context, defense)
    eria = defense.formation[0]
    skill = getSkill(eria)
    expect(skill.state.type).toBe("cooldown")
    expect(skill.state.transition).toBe("manual")
    if (skill.state.type === "cooldown" && skill.state.transition === "manual") {
      let timeout = skill.state.data
      expect(timeout.cooldownTimeout).toBe(now + (SKILL_ACTIVE_TIME + SKILL_COOLDOWN_TIME) * 1000)
    }

    // CoolDown終わり
    context.clock = now + (SKILL_ACTIVE_TIME + SKILL_COOLDOWN_TIME) * 1000
    defense = refreshState(context, defense)
    eria = defense.formation[0]
    skill = getSkill(eria)
    expect(skill.state.type).toBe("idle")
  })

  test.each(targetList)("発動あり-守備側(被アクセス)-相手:%s", (number) => {
    const context = initContext("test", "test", false)
    // 一部対象は特定時間帯のみ
    // TODO 時間帯に依存するスキルの場合はここで処理を追加
    // TODO 保守面倒！どうする？
    if (number === "15") {
      context.clock = moment('2022-01-01T12:00:00+0900').valueOf()
    } else if (number === "30") {
      context.clock = moment('2022-01-01T20:00:00+0900').valueOf()
    } else if (number === "42") {
      context.clock = moment('2022-11-02T12:00:00+0900').valueOf()
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
    expect(hasSkillTriggered(result.defense, eria)).toBe(true)
    expect(hasSkillTriggered(result.offense, test)).toBe(false)
    expect(getAccessDenco(result, "offense").skillInvalidated).toBe(true)
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
    expect(hasSkillTriggered(result.defense, eria)).toBe(true)
    expect(hasSkillTriggered(result.defense, hiiru)).toBe(false)
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
    expect(hasSkillTriggered(result.defense, eria)).toBe(false)
    expect(hasSkillTriggered(result.offense, imura)).toBe(true)
    expect(result.attackPercent).toBeGreaterThan(0)
  })
  test("発動なし-守備側(被アクセス)-レーの相手-昼間", () => {
    const context = initContext("test", "test", false)
    context.clock = moment('2022-01-01T12:00:00+0900').valueOf()
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
    expect(hasSkillTriggered(result.defense, eria)).toBe(false)
    expect(hasSkillTriggered(result.offense, reno)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })
})
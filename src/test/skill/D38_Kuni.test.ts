import moment from "moment-timezone"
import { activateSkill, deactivateSkill, getAccessDenco, getSkill, hasSkillTriggered, init, initContext, initUser, refreshState, startAccess } from "../.."
import DencoManager from "../../core/dencoManager"

// $SKILL_ACTIVE_TIME 有効な時間(sec)
const SKILL_ACTIVE_TIME = 1800
// $SKILL_COOLDOWN_TIME CoolDownの時間(sec)
const SKILL_COOLDOWN_TIME = 7200

describe("くにのスキル", () => {
  beforeAll(init)


  test("スキル状態", () => {
    const context = initContext("test", "test", false)
    let kuni = DencoManager.getDenco(context, "38", 50)
    expect(kuni.skill.type).toBe("possess")
    let defense = initUser(context, "とあるマスター", [kuni])
    const now = moment().valueOf()
    context.clock = now
    kuni = defense.formation[0]
    expect(kuni.name).toBe("kuni")
    let skill = getSkill(kuni)
    expect(skill.state.transition).toBe("manual")
    expect(skill.state.type).toBe("idle")
    expect(() => deactivateSkill(context, defense, 0)).toThrowError()
    defense = activateSkill(context, defense, 0)
    kuni = defense.formation[0]
    skill = getSkill(kuni)
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
    kuni = defense.formation[0]
    skill = getSkill(kuni)
    expect(skill.state.type).toBe("active")

    // ちょうどCoolDown
    context.clock = now + SKILL_ACTIVE_TIME * 1000
    defense = refreshState(context, defense)
    kuni = defense.formation[0]
    skill = getSkill(kuni)
    expect(skill.state.type).toBe("cooldown")
    expect(skill.state.transition).toBe("manual")
    if (skill.state.type === "cooldown" && skill.state.transition === "manual") {
      let timeout = skill.state.data
      expect(timeout.cooldownTimeout).toBe(now + (SKILL_ACTIVE_TIME + SKILL_COOLDOWN_TIME) * 1000)
    }

    // CoolDown終わり
    context.clock = now + (SKILL_ACTIVE_TIME + SKILL_COOLDOWN_TIME) * 1000
    defense = refreshState(context, defense)
    kuni = defense.formation[0]
    skill = getSkill(kuni)
    expect(skill.state.type).toBe("idle")
  })

  test("発動あり-守備側(編成内)", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let mikoto = DencoManager.getDenco(context, "37", 50, 1)
    let kuni = DencoManager.getDenco(context, "38", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [mikoto, kuni])
    defense = activateSkill(context, defense, 1)
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
      station: mikoto.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    // みことのダメージ量 = シャルのAP 170 - 回復量 196 * 0.3
    let d = getAccessDenco(result, "defense")
    expect(d.reboot).toBe(false)
    expect(d.damage?.value).toBe(170 - Math.floor(196 * 0.3))
    expect(hasSkillTriggered(result.defense, kuni)).toBe(true)
    // カウンター発動 くにAP 180 * (1 + みことATK12%)
    expect(hasSkillTriggered(result.defense, mikoto)).toBe(true)
    d = getAccessDenco(result, "offense")
    expect(d.damage).not.toBeUndefined()
    expect(d.damage?.value).toBe(Math.floor(180 * 1.12))
    expect(d.maxHp).toBe(228)
    expect(d.hpAfter).toBe(228 - 201)
    expect(d.currentHp).toBe(228 - 201)
  })
  test("発動あり-守備側(編成内)-確率ブースト", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let mikoto = DencoManager.getDenco(context, "37", 50, 1)
    let kuni = DencoManager.getDenco(context, "38", 50)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [mikoto, kuni, hiiru])
    defense = activateSkill(context, defense, 1, 2)
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
      station: mikoto.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, kuni)).toBe(true)
    expect(hasSkillTriggered(result.defense, mikoto)).toBe(true)
    expect(hasSkillTriggered(result.defense, hiiru)).toBe(true)
    let d = getAccessDenco(result, "offense")
    expect(d.damage).not.toBeUndefined()
    expect(d.damage?.value).toBeGreaterThan(0)
  })

  test("発動あり（カウンターのみ）-守備側(編成内)-確率", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "ignore"
    let mikoto = DencoManager.getDenco(context, "37", 50, 1)
    let kuni = DencoManager.getDenco(context, "38", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [mikoto, kuni])
    defense = activateSkill(context, defense, 1)
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
      station: mikoto.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    // カウンターは確定
    expect(hasSkillTriggered(result.defense, kuni)).toBe(true)
    // 回復は確率依存
    expect(hasSkillTriggered(result.defense, mikoto)).toBe(false)
    let d = getAccessDenco(result, "offense")
    expect(d.damage).not.toBeUndefined()
    expect(d.damage?.value).toBeGreaterThan(0)
  })
  test("発動なし-守備側(編成内)-HP30%より大", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let mikoto = DencoManager.getDenco(context, "37", 50, 1)
    let kuni = DencoManager.getDenco(context, "38", 50)
    let charlotte = DencoManager.getDenco(context, "6", 10)
    let defense = initUser(context, "とあるマスター", [mikoto, kuni])
    defense = activateSkill(context, defense, 1)
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
      station: mikoto.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    let d = getAccessDenco(result, "defense")
    expect(d.damage).not.toBeUndefined()
    expect(d.hpAfter).toBeGreaterThan(d.maxHp * 0.3)
    expect(hasSkillTriggered(result.defense, kuni)).toBe(false)
    expect(hasSkillTriggered(result.defense, mikoto)).toBe(false)
    d = getAccessDenco(result, "offense")
    expect(d.damage).toBeUndefined()
  })
  test("発動なし-守備側(編成内)-リブート", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let mikoto = DencoManager.getDenco(context, "37", 50, 1)
    let kuni = DencoManager.getDenco(context, "38", 50)
    let charlotte = DencoManager.getDenco(context, "6", 80)
    let defense = initUser(context, "とあるマスター", [mikoto, kuni])
    defense = activateSkill(context, defense, 1)
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
      station: mikoto.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    let d = getAccessDenco(result, "defense")
    expect(d.damage).not.toBeUndefined()
    expect(d.damage?.value).toBeGreaterThan(d.maxHp)
    expect(d.reboot).toBe(true)
    expect(hasSkillTriggered(result.defense, kuni)).toBe(false)
    expect(hasSkillTriggered(result.defense, mikoto)).toBe(false)
    d = getAccessDenco(result, "offense")
    expect(d.damage).toBeUndefined()
  })
})
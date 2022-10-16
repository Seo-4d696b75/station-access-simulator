import moment from "moment-timezone"
import { activateSkill, deactivateSkill, getDefense, getSkill, hasSkillTriggered, init, initContext, initUser, refreshState, startAccess } from "../.."
import DencoManager from "../../core/dencoManager"

// $SKILL_ACTIVE_TIME 有効な時間(sec)
const SKILL_ACTIVE_TIME = 3600
// $SKILL_COOLDOWN_TIME CoolDownの時間(sec)
const SKILL_COOLDOWN_TIME = 5400

describe("ひいるのスキル", () => {
  beforeAll(init)


  test("スキル状態", () => {
    const context = initContext("test", "test", false)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    expect(hiiru.skill.type).toBe("possess")
    let defense = initUser(context, "とあるマスター", [hiiru])
    const now = moment().valueOf()
    context.clock = now
    hiiru = defense.formation[0]
    expect(hiiru.name).toBe("hiiru")
    let skill = getSkill(hiiru)
    expect(skill.state.transition).toBe("manual")
    expect(skill.state.type).toBe("idle")
    expect(() => deactivateSkill(context, defense, 0)).toThrowError()
    defense = activateSkill(context, defense, 0)
    hiiru = defense.formation[0]
    skill = getSkill(hiiru)
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
    hiiru = defense.formation[0]
    skill = getSkill(hiiru)
    expect(skill.state.type).toBe("active")

    // ちょうどCoolDown
    context.clock = now + SKILL_ACTIVE_TIME * 1000
    defense = refreshState(context, defense)
    hiiru = defense.formation[0]
    skill = getSkill(hiiru)
    expect(skill.state.type).toBe("cooldown")
    expect(skill.state.transition).toBe("manual")
    if (skill.state.type === "cooldown" && skill.state.transition === "manual") {
      let timeout = skill.state.data
      expect(timeout.cooldownTimeout).toBe(now + (SKILL_ACTIVE_TIME + SKILL_COOLDOWN_TIME) * 1000)
    }

    // CoolDown終わり
    context.clock = now + (SKILL_ACTIVE_TIME + SKILL_COOLDOWN_TIME) * 1000
    defense = refreshState(context, defense)
    hiiru = defense.formation[0]
    skill = getSkill(hiiru)
    expect(skill.state.type).toBe("idle")
  })

  test("確率補正あり", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let siira = DencoManager.getDenco(context, "11", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let offense = initUser(context, "とあるマスター", [reika])
    let defense = initUser(context, "とあるマスター２", [hiiru, siira])
    defense = activateSkill(context, defense, 0)
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 1
      },
      station: siira.link[0],
    }
    const result = startAccess(context, config)
    const d = getDefense(result)
    // 確率補正の確認
    expect(hasSkillTriggered(result.defense, siira)).toBe(true)
    expect(hasSkillTriggered(result.defense, hiiru)).toBe(true)
    let trigger = d.triggeredSkills[0]
    expect(trigger.name).toBe(hiiru.name)
    expect(trigger.step).toBe("probability_check")
    expect(d.probabilityBoostPercent).toBe(20)
    expect(d.probabilityBoosted).toBe(true)
  })
})
import moment from "moment-timezone"
import { activateSkill, deactivateSkill, getSkill, initContext, initUser, refreshState } from "../.."
import DencoManager from "../../core/dencoManager"

// $SKILL_ACTIVE_TIME 有効な時間(sec)
const SKILL_ACTIVE_TIME = 1800
// $SKILL_COOLDOWN_TIME CoolDownの時間(sec)
const SKILL_COOLDOWN_TIME = 7200

test("スキル状態", () => {
  const context = initContext("test", "test", false)
  let denco_name = DencoManager.getDenco(context, "DENCO_NUMBER", 50)
  expect(denco_name.skill.type).toBe("possess")
  let defense = initUser(context, "とあるマスター", [denco_name])
  const now = moment().valueOf()
  context.clock = now
  denco_name = defense.formation[0]
  expect(denco_name.name).toBe("denco_name")
  let skill = getSkill(denco_name)
  expect(skill.state.transition).toBe("manual")
  expect(skill.state.type).toBe("idle")
  expect(() => deactivateSkill(context, defense, 0)).toThrowError()
  defense = activateSkill(context, defense, 0)
  denco_name = defense.formation[0]
  skill = getSkill(denco_name)
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
  denco_name = defense.formation[0]
  skill = getSkill(denco_name)
  expect(skill.state.type).toBe("active")

  // ちょうどCoolDown
  context.clock = now + SKILL_ACTIVE_TIME * 1000
  defense = refreshState(context, defense)
  denco_name = defense.formation[0]
  skill = getSkill(denco_name)
  expect(skill.state.type).toBe("cooldown")
  expect(skill.state.transition).toBe("manual")
  if (skill.state.type === "cooldown" && skill.state.transition === "manual") {
    let timeout = skill.state.data
    expect(timeout.cooldownTimeout).toBe(now + (SKILL_ACTIVE_TIME + SKILL_COOLDOWN_TIME) * 1000)
  }

  // CoolDown終わり
  context.clock = now + (SKILL_ACTIVE_TIME + SKILL_COOLDOWN_TIME) * 1000
  defense = refreshState(context, defense)
  denco_name = defense.formation[0]
  skill = getSkill(denco_name)
  expect(skill.state.type).toBe("idle")
})
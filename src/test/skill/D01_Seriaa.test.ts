import StationManager from "../..//core/stationManager"
import SkillManager from "../../core/skillManager"
import DencoManager from "../../core/dencoManager"
import { initContext } from "../../core/context"
import { initUser } from "../../core/user"
import { activateSkill, refreshSkillState, SkillActiveTimeout, SkillCooldownTimeout } from "../../core/skill"
import { getSkill } from "../../core/denco"

describe("セリアのスキル", ()=>{
  test("setup", async () => {
    await StationManager.load()
    await SkillManager.load()
    await DencoManager.load()
    expect(StationManager.data.length).toBeGreaterThan(0)
    expect(SkillManager.map.size).toBeGreaterThan(0)
    expect(DencoManager.data.size).toBeGreaterThan(0)
  })
  test("スキル状態", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    expect(seria.skillHolder.type).toBe("possess")
    let defense = initUser(context, "とあるマスター", [reika, seria])
    const now = Date.now()
    defense = refreshSkillState(context, defense, now)
    seria = defense.formation[1]
    let skill = getSkill(seria)
    expect(skill.transitionType).toBe("manual")
    expect(skill.state.type).toBe("idle")
    defense = activateSkill(context, {...defense, carIndex: 1}, now)
    seria = defense.formation[1]
    skill = getSkill(seria)
    expect(skill.state.type).toBe("active")
    expect(skill.state.data).not.toBeUndefined()
    let data = skill.state.data as SkillActiveTimeout
    expect(data.activeTimeout).toBe(now + 1800 * 1000)
    expect(data.cooldownTimeout).toBe(now + 1800 * 1000 + 10800 * 1000)

    // 10分経過
    defense = refreshSkillState(context, defense, now + 600 * 1000)
    seria = defense.formation[1]
    skill = getSkill(seria)
    expect(skill.state.type).toBe("active")

    // 30分経過
    defense = refreshSkillState(context, defense, now + 1800 * 1000)
    seria = defense.formation[1]
    skill = getSkill(seria)
    expect(skill.state.type).toBe("cooldown")
    let timeout = skill.state.data as SkillCooldownTimeout
    expect(timeout.cooldownTimeout).toBe(now + (1800 + 10800) * 1000)

    // 30分+3時間経過
    defense = refreshSkillState(context, defense, now + (1800 + 10800) * 1000)
    seria = defense.formation[1]
    skill = getSkill(seria)
    expect(skill.state.type).toBe("idle")
  })
})
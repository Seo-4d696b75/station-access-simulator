import StationManager from "../..//core/stationManager"
import SkillManager from "../../core/skillManager"
import DencoManager from "../../core/dencoManager"
import { initContext } from "../../core/context"
import { initUser } from "../../core/user"
import { activateSkill, disactivateSkill } from "../../core/skill"

describe("さやのスキル", () => {
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
    let saya = DencoManager.getDenco(context, "8", 1)
    expect(saya.skillHolder.type).toBe("none")
    saya = DencoManager.getDenco(context, "8", 50)
    expect(saya.skillHolder.type).toBe("none")
    let state = initUser(context, "とあるマスター", [saya])
    saya = state.formation[0]
    expect(saya.skillHolder.type).toBe("none")
    expect(() => activateSkill(context, { ...state, carIndex: 0 })).toThrowError()
    expect(() => disactivateSkill(context, { ...state, carIndex: 0 })).toThrowError()
  })
})
import { init } from "../.."
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { activateSkill, disactivateSkill } from "../../core/skill"
import { initUser } from "../../core/user"

describe("さやのスキル", () => {
  beforeAll(init)
  test("スキル状態", () => {
    const context = initContext("test", "test", false)
    let saya = DencoManager.getDenco(context, "8", 1)
    expect(saya.skill.type).toBe("none")
    saya = DencoManager.getDenco(context, "8", 50)
    expect(saya.skill.type).toBe("none")
    let state = initUser(context, "とあるマスター", [saya])
    saya = state.formation[0]
    expect(saya.skill.type).toBe("none")
    expect(() => activateSkill(context, state, 0)).toThrowError()
    expect(() => disactivateSkill(context, state, 0)).toThrowError()
  })
})
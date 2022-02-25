import moment from "moment-timezone"
import { init } from "../.."
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { activateSkill, disactivateSkill, getSkill } from "../../core/skill"
import { initUser, refreshState } from "../../core/user"

describe("もえのスキル", () => {
  beforeAll(init)
  test("スキル状態", () => {
    const context = initContext("test", "test", false)
    let moe = DencoManager.getDenco(context, "9", 1)
    expect(moe.skill.type).toBe("not_acquired")
    moe = DencoManager.getDenco(context, "9", 50)
    expect(moe.skill.type).toBe("possess")
    let state = initUser(context, "とあるマスター", [moe])
    moe = state.formation[0]
    let skill = getSkill(moe)
    expect(skill.state.type).toBe("unable")
    expect(skill.state.transition).toBe("auto-condition")
    expect(() => activateSkill(context, state, 0)).toThrowError()
    expect(() => disactivateSkill(context, state, 0)).toThrowError()
  })
  test("スキル発動-1", () => {
    const context = initContext("test", "test", false)
    const now = moment("2020-01-01T12:50:00.000").valueOf()
    context.clock = now
    let moe = DencoManager.getDenco(context, "9", 50)
    let charlotte = DencoManager.getDenco(context, "6", 80)
    let state = initUser(context, "とあるマスター", [moe, charlotte])
    expect(state.queue.length).toBe(1)
    expect(state.queue[0].type).toBe("hour_cycle")
    expect(state.queue[0].time).toBe(moment("2020-01-01T13:00:00.000").valueOf())
    moe = state.formation[0]
    let skill = getSkill(moe)
    expect(skill.state.type).toBe("unable")
    // 13:00
    context.clock = now + 600 * 1000
    state = refreshState(context, state)
    expect(state.event.length).toBe(0)
    expect(state.queue.length).toBe(1)
    expect(state.queue[0].type).toBe("hour_cycle")
    expect(state.queue[0].time).toBe(moment("2020-01-01T14:00:00.000").valueOf())
    charlotte = state.formation[1]
    charlotte.currentHp = Math.floor(charlotte.maxHp * 0.9)
    state = refreshState(context, state)
    moe = state.formation[0]
    skill = getSkill(moe)
    expect(skill.state.type).toBe("active")
    // 14:00
    context.clock = now + 70 * 60 * 1000
    state = refreshState(context, state)
    expect(state.event.length).toBe(1)
    let event = state.event[0]
    expect(event.type).toBe("skill_trigger")
    if (event.type === "skill_trigger") {
      expect(event.data.time).toBe(moment("2020-01-01T14:00:00.000").valueOf())
      expect(event.data.step).toBe("self")
      expect(event.data.denco.name).toBe("moe")
    }
    charlotte = state.formation[1]
    expect(charlotte.currentHp).toBe(charlotte.maxHp)
    moe = state.formation[0]
    skill = getSkill(moe)
    expect(skill.state.type).toBe("unable")
    expect(state.queue.length).toBe(1)
    expect(state.queue[0].type).toBe("hour_cycle")
    expect(state.queue[0].time).toBe(moment("2020-01-01T15:00:00.000").valueOf())
  })
  test("スキル発動-2", () => {
    const context = initContext("test", "test", false)
    const now = moment("2020-01-01T12:50:00.000").valueOf()
    context.clock = now
    let moe = DencoManager.getDenco(context, "9", 80)
    let charlotte = DencoManager.getDenco(context, "6", 80)
    let sheena = DencoManager.getDenco(context, "7", 50)
    let state = initUser(context, "とあるマスター", [moe, charlotte, sheena])
    expect(state.queue.length).toBe(1)
    expect(state.queue[0].type).toBe("hour_cycle")
    expect(state.queue[0].time).toBe(moment("2020-01-01T13:00:00.000").valueOf())
    moe = state.formation[0]
    let skill = getSkill(moe)
    expect(skill.state.type).toBe("unable")

    // chage HP
    charlotte = state.formation[1]
    sheena = state.formation[2]
    moe.currentHp = Math.floor(moe.maxHp * 0.9)
    charlotte.currentHp = Math.floor(charlotte.maxHp * 0.6)
    sheena.currentHp = Math.floor(sheena.maxHp * 0.2)

    // update skill state
    state = refreshState(context, state)
    moe = state.formation[0]
    skill = getSkill(moe)
    expect(skill.state.type).toBe("active")

    // time
    context.clock = now + 600 * 1000
    state = refreshState(context, state)
    moe = state.formation[0]
    charlotte = state.formation[1]
    sheena = state.formation[2]
    skill = getSkill(moe)
    // まだ回復できる
    expect(skill.state.type).toBe("active")
    expect(state.event.length).toBe(1)
    // スキル発動のイベント
    let event = state.event[0]
    expect(event.type).toBe("skill_trigger")
    if (event.type === "skill_trigger") {
      expect(event.data.time).toBe(moment("2020-01-01T13:00:00.000").valueOf())
      expect(event.data.step).toBe("self")
      expect(event.data.denco.name).toBe("moe")
    }
    // check current hp
    expect(moe.currentHp).toBe(moe.maxHp)
    expect(charlotte.currentHp).toBe(Math.floor(charlotte.maxHp * 0.6) + Math.floor(charlotte.maxHp * 0.4))
    expect(sheena.currentHp).toBe(Math.floor(sheena.maxHp * 0.2) + Math.floor(sheena.maxHp * 0.4))
  })
})
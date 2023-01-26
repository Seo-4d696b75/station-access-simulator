import assert from "assert"
import dayjs from "dayjs"
import { init } from "../.."
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { activateSkill, deactivateSkill, getSkill } from "../../core/skill"
import { initUser, refreshState } from "../../core/user"
import "../../gen/matcher"

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
    expect(skill.transition.state).toBe("unable")
    expect(skill.transitionType).toBe("auto-condition")
    expect(() => activateSkill(context, state, 0)).toThrowError()
    expect(() => deactivateSkill(context, state, 0)).toThrowError()
  })
  test("スキル発動-1", () => {
    const context = initContext("test", "test", false)
    const now = dayjs("2020-01-01T12:50:00.000").valueOf()
    context.clock = now
    let moe = DencoManager.getDenco(context, "9", 50)
    let charlotte = DencoManager.getDenco(context, "6", 80)
    let state = initUser(context, "とあるマスター", [moe, charlotte])
    expect(state.queue.length).toBe(1)
    expect(state.queue[0].type).toBe("hour_cycle")
    expect(state.queue[0].time).toBe(dayjs("2020-01-01T13:00:00.000").valueOf())
    moe = state.formation[0]
    let skill = getSkill(moe)
    expect(skill.transition.state).toBe("unable")
    // 13:00
    context.clock = now + 600 * 1000
    state = refreshState(context, state)
    expect(state.event.length).toBe(0)
    expect(state.queue.length).toBe(1)
    expect(state.queue[0].type).toBe("hour_cycle")
    expect(state.queue[0].time).toBe(dayjs("2020-01-01T14:00:00.000").valueOf())
    charlotte = state.formation[1]
    charlotte.currentHp = Math.floor(charlotte.maxHp * 0.9)
    state = refreshState(context, state)
    moe = state.formation[0]
    skill = getSkill(moe)
    expect(skill.transition.state).toBe("active")
    // 14:00
    context.clock = now + 70 * 60 * 1000
    state = refreshState(context, state)
    expect(state.event.length).toBe(1)
    let event = state.event[0]
    expect(event.type).toBe("skill_trigger")
    assert(event.type === "skill_trigger")
    expect(event.data.time).toBe(dayjs("2020-01-01T14:00:00.000").valueOf())
    expect(event.data.probability).toBe(100)
    expect(event.data.boostedProbability).toBe(100)
    expect(event.data.skillName).toBe("定時メンテナンス Lv.4")
    expect(event.data.denco.carIndex).toBe(0)
    expect(event.data.denco.who).toBe("self")
    expect(event.data.denco).toMatchDencoState(moe)

    charlotte = state.formation[1]
    expect(charlotte.currentHp).toBe(charlotte.maxHp)
    moe = state.formation[0]
    skill = getSkill(moe)
    expect(skill.transition.state).toBe("unable")
    expect(state.queue.length).toBe(1)
    expect(state.queue[0].type).toBe("hour_cycle")
    expect(state.queue[0].time).toBe(dayjs("2020-01-01T15:00:00.000").valueOf())
  })

  test("スキル発動-2", () => {
    const context = initContext("test", "test", false)
    const now = dayjs("2020-01-01T12:50:00.000").valueOf()
    context.clock = now
    let moe = DencoManager.getDenco(context, "9", 80)
    let charlotte = DencoManager.getDenco(context, "6", 80)
    let sheena = DencoManager.getDenco(context, "7", 50)
    let state = initUser(context, "とあるマスター", [moe, charlotte, sheena])
    expect(state.queue.length).toBe(1)
    expect(state.queue[0].type).toBe("hour_cycle")
    expect(state.queue[0].time).toBe(dayjs("2020-01-01T13:00:00.000").valueOf())
    moe = state.formation[0]
    let skill = getSkill(moe)
    expect(skill.transition.state).toBe("unable")

    // change HP
    charlotte = state.formation[1]
    sheena = state.formation[2]
    moe.currentHp = Math.floor(moe.maxHp * 0.9)
    charlotte.currentHp = Math.floor(charlotte.maxHp * 0.6)
    sheena.currentHp = Math.floor(sheena.maxHp * 0.2)

    // update skill state
    state = refreshState(context, state)
    moe = state.formation[0]
    skill = getSkill(moe)
    expect(skill.transition.state).toBe("active")

    // time
    context.clock = now + 600 * 1000
    state = refreshState(context, state)
    moe = state.formation[0]
    charlotte = state.formation[1]
    sheena = state.formation[2]
    skill = getSkill(moe)
    // まだ回復できる
    expect(skill.transition.state).toBe("active")
    expect(state.event.length).toBe(1)
    // スキル発動のイベント
    let event = state.event[0]
    expect(event.type).toBe("skill_trigger")
    assert(event.type === "skill_trigger")
    expect(event.data.time).toBe(dayjs("2020-01-01T13:00:00.000").valueOf())
    expect(event.data.probability).toBe(100)
    expect(event.data.boostedProbability).toBe(100)
    expect(event.data.skillName).toBe("ご主人様も一緒にいかが!?")
    expect(event.data.denco.carIndex).toBe(0)
    expect(event.data.denco.who).toBe("self")
    expect(event.data.denco).toMatchDencoState(state.formation[0])

    // check current hp
    expect(moe.currentHp).toBe(moe.maxHp)
    expect(charlotte.currentHp).toBe(Math.floor(charlotte.maxHp * 0.6) + Math.floor(charlotte.maxHp * 0.4))
    expect(sheena.currentHp).toBe(Math.floor(sheena.maxHp * 0.2) + Math.floor(sheena.maxHp * 0.4))
  })

  test("スキル発動-確率補正", () => {
    const context = initContext("test", "test", false)
    const now = dayjs("2020-01-01T12:50:00.000").valueOf()
    context.clock = now
    context.random.mode = "ignore"

    let moe = DencoManager.getDenco(context, "9", 50)
    moe.film = {
      type: "film",
      theme: "test",
      skill: {
        probability: -10
      }
    }
    let charlotte = DencoManager.getDenco(context, "6", 80)
    charlotte.currentHp = Math.floor(charlotte.maxHp * 0.9)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let state = initUser(context, "とあるマスター", [moe, charlotte, hiiru])
    
    // 13:00
    context.clock = now + 600 * 1000
    state = refreshState(context, state)
    // 発動なし
    expect(state.event.length).toBe(0)
    // 確率補正
    context.clock = now + 60 * 60 * 1000
    state = activateSkill(context, state, 2)
    moe = state.formation[0]
    
    // 14:00
    context.clock = now + 70 * 60 * 1000
    state = refreshState(context, state)
    expect(state.event.length).toBe(2)

    let event = state.event[0]
    expect(event.type).toBe("skill_trigger")
    assert(event.type === "skill_trigger")
    expect(event.data.time).toBe(context.currentTime)
    expect(event.data.probability).toBe(100)
    expect(event.data.boostedProbability).toBe(100)
    expect(event.data.skillName).toBe("テンションAGEAGE↑↑ Lv.4")
    expect(event.data.denco.carIndex).toBe(2)
    expect(event.data.denco.who).toBe("other")
    expect(event.data.denco).toMatchDencoState(state.formation[2])

    event = state.event[1]
    expect(event.type).toBe("skill_trigger")
    assert(event.type === "skill_trigger")
    expect(event.data.time).toBe(context.currentTime)
    expect(event.data.probability).toBe(90)
    expect(event.data.boostedProbability).toBe(100)
    expect(event.data.skillName).toBe("定時メンテナンス Lv.4")
    expect(event.data.denco.carIndex).toBe(0)
    expect(event.data.denco.who).toBe("self")
    expect(event.data.denco).toMatchDencoState(moe)

    charlotte = state.formation[1]
    expect(charlotte.currentHp).toBe(charlotte.maxHp)
  })

})
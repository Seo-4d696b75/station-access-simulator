import assert from "assert"
import dayjs from "dayjs"
import { init } from "../.."
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { activateSkill, getSkill } from "../../core/skill"
import { initUser, refreshState } from "../../core/user"
import "../../gen/matcher"

describe("シャルのスキル", () => {
  beforeAll(init)

  test("スキル発動", () => {
    const context = initContext("test", "test", false)
    const now = dayjs("2020-01-01T12:50:00.000").valueOf()
    context.clock = now
    let charlotte = DencoManager.getDenco(context, "6", 80)
    expect(charlotte.skill.type).toBe("possess")
    let state = initUser(context, "とあるマスター", [charlotte])
    charlotte = state.formation[0]
    let skill = getSkill(charlotte)
    expect(skill.transitionType).toBe("manual")
    expect(skill.transition.state).toBe("idle")
    state = activateSkill(context, state, 0)
    charlotte = state.formation[0]
    skill = getSkill(charlotte)
    // 即座に idle > active > cooldown
    expect(skill.transition.state).toBe("cooldown")
    expect(state.queue.length).toBe(2)
    let entry = state.queue[0]
    expect(entry.type).toBe("hour_cycle")
    entry = state.queue[1]
    expect(entry.type).toBe("skill")
    assert(entry.type === "skill")
    expect(entry.data.denco).toMatchDenco(charlotte)
    expect(entry.data.type).toBe("skill_event")
    expect(entry.data.probability).toBe(100)
    // 90分後に発動
    expect(entry.time).toBe(now + 5400 * 1000)
    expect(entry.data.denco.name).toBe("charlotte")
    expect(state.event.length).toBe(0)

    // 60分経過
    context.clock = now + 3600 * 1000
    state = refreshState(context, state)
    charlotte = state.formation[0]
    skill = getSkill(charlotte)
    expect(skill.transition.state).toBe("cooldown")
    expect(state.event.length).toBe(0)

    // 90分経過
    context.clock = now + 5400 * 1000
    state = refreshState(context, state)
    charlotte = state.formation[0]
    skill = getSkill(charlotte)
    expect(skill.transition.state).toBe("idle")
    expect(state.event.length).toBe(2)

    let event = state.event[0]
    expect(event.type).toBe("access")
    assert(event.type === "access")
    expect(event.data.time).toBe(context.currentTime)

    event = state.event[1]
    expect(event.type).toBe("skill_trigger")
    assert(event.type === "skill_trigger")
    expect(event.data.time).toBe(context.currentTime)
    expect(event.data.probability).toBe(100)
    expect(event.data.boostedProbability).toBe(100)
    expect(event.data.skillName).toBe("風の吹くまま気の向くまま")
    expect(event.data.denco.carIndex).toBe(0)
    expect(event.data.denco.who).toBe("self")
    expect(event.data.denco).toMatchDencoState({
      ...charlotte,
      // ランダム駅アクセスの直前
      link: []
    })
  })


  test("発動なし-確率", () => {
    const context = initContext("test", "test", false)
    const now = dayjs("2020-01-01T12:50:00.000").valueOf()
    context.clock = now
    context.random.mode = "ignore"

    let charlotte = DencoManager.getDenco(context, "6", 80)
    charlotte.film = {
      type: "film",
      theme: "test",
      skill: {
        probability: -10
      }
    }
    expect(charlotte.skill.type).toBe("possess")
    let state = initUser(context, "とあるマスター", [charlotte])

    state = activateSkill(context, state, 0)
    let entry = state.queue[0]
    expect(entry.type).toBe("hour_cycle")
    entry = state.queue[1]
    expect(entry.type).toBe("skill")
    assert(entry.type === "skill")
    expect(entry.data.denco).toMatchDenco(charlotte)
    expect(entry.data.type).toBe("skill_event")
    expect(entry.data.probability).toBe(90)

    // 90分経過
    context.clock = now + 5400 * 1000
    state = refreshState(context, state)

    // 発動なし
    expect(state.event.length).toBe(0)

  })

  test("発動あり-確率補正", () => {
    const context = initContext("test", "test", false)
    const now = dayjs("2020-01-01T12:50:00.000").valueOf()
    context.clock = now
    context.random.mode = "force"

    let charlotte = DencoManager.getDenco(context, "6", 80)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    charlotte.film = {
      type: "film",
      theme: "test",
      skill: {
        probability: -10
      }
    }
    expect(charlotte.skill.type).toBe("possess")
    let state = initUser(context, "とあるマスター", [charlotte, hiiru])

    state = activateSkill(context, state, 0)
    let entry = state.queue[0]
    expect(entry.type).toBe("hour_cycle")
    entry = state.queue[1]
    expect(entry.type).toBe("skill")
    assert(entry.type === "skill")
    expect(entry.data.denco).toMatchDenco(charlotte)
    expect(entry.data.type).toBe("skill_event")
    expect(entry.data.probability).toBe(90)


    // 60分経過
    context.clock = now + 3600 * 1000
    state = refreshState(context, state)
    state = activateSkill(context, state, 1)

    // 90分経過
    context.clock = now + 5400 * 1000
    state = refreshState(context, state)

    // 発動あり
    expect(state.event.length).toBe(3)

    let event = state.event[0]
    expect(event.type).toBe("skill_trigger")
    assert(event.type === "skill_trigger")
    expect(event.data.time).toBe(context.currentTime)
    expect(event.data.probability).toBe(100)
    expect(event.data.boostedProbability).toBe(100)
    expect(event.data.skillName).toBe("テンションAGEAGE↑↑ Lv.4")
    expect(event.data.denco.carIndex).toBe(1)
    expect(event.data.denco.who).toBe("other")
    expect(event.data.denco).toMatchDencoState(state.formation[1])

    event = state.event[1]
    expect(event.type).toBe("access")
    assert(event.type === "access")
    expect(event.data.time).toBe(context.currentTime)

    event = state.event[2]
    expect(event.type).toBe("skill_trigger")
    assert(event.type === "skill_trigger")
    expect(event.data.time).toBe(context.currentTime)
    expect(event.data.probability).toBe(90)
    expect(event.data.boostedProbability).toBe(100)
    expect(event.data.skillName).toBe("風の吹くまま気の向くまま")
    expect(event.data.denco.carIndex).toBe(0)
    expect(event.data.denco.who).toBe("self")
    expect(event.data.denco).toMatchDencoState({
      ...state.formation[0],
      // ランダム駅アクセスの直前
      link: []
    })

  })
})
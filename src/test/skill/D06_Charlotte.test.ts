import assert from "assert"
import dayjs from "dayjs"
import { init } from "../.."
import { getAccessDenco } from "../../core/access/index"
import { initContext } from "../../core/context"
import { DencoState } from "../../core/denco"
import DencoManager from "../../core/dencoManager"
import { activateSkill, getSkill } from "../../core/skill"
import { copyState } from "../../core/state"
import { initUser, refreshState } from "../../core/user"
import "../tool/matcher"

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
    charlotte = copyState<DencoState>(getAccessDenco(event.data, "offense"))
    expect(charlotte.name).toBe("charlotte")

    event = state.event[1]
    expect(event.type).toBe("skill_trigger")
    assert(event.type === "skill_trigger")
    expect(event.data.time).toBe(context.currentTime)
    expect(event.data.step).toBe("self")
    expect(event.data.skillName).toBe(getSkill(charlotte).name)
    expect(event.data.carIndex).toBe(0)
    expect(event.data.denco).toMatchDencoState(charlotte)
    charlotte = state.formation[0]
    expect(event.data.denco).toMatchDencoState(charlotte)

  })
})
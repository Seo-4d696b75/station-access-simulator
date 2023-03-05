import assert from "assert"
import dayjs from "dayjs"
import { DencoManager, init } from "../.."
import { initContext } from "../../core/context"
import { activateSkill, getSkill } from "../../core/skill"
import { changeFormation, initUser, refreshState } from "../../core/user"
import "../../gen/matcher"

describe("うららのスキル", () => {
  beforeAll(init)
  test("スキル発動あり", () => {

    const context = initContext("test", "test", false)
    let urara = DencoManager.getDenco(context, "25", 50)
    expect(urara.name).toBe("urara")
    expect(urara.skill.type).toBe("possess")
    const now = dayjs().valueOf()
    context.clock = now

    // 編成内ほか無し
    let state = initUser(context, "master", [urara])
    urara = state.formation[0]
    let skill = getSkill(urara)
    expect(skill.transitionType).toBe("manual-condition")
    expect(skill.transition.state).toBe("unable")
    expect(() => activateSkill(context, state, 0)).toThrowError()

    // cooldownなし(idle)
    let reika = DencoManager.getDenco(context, "5", 50)
    state = changeFormation(context, state, [urara, reika])
    urara = state.formation[0]
    skill = getSkill(urara)
    expect(skill.transition.state).toBe("unable")

    // cooldownなし(active)
    state = activateSkill(context, state, 1)
    urara = state.formation[0]
    skill = getSkill(urara)
    expect(skill.transition.state).toBe("unable")

    // cooldownあり
    context.clock = now + 900 * 1000
    state = refreshState(context, state)
    reika = state.formation[1]
    skill = getSkill(reika)
    expect(skill.transition.state).toBe("cooldown")
    urara = state.formation[0]
    skill = getSkill(urara)
    expect(skill.transition.state).toBe("idle")

    // 編成の変更
    state = changeFormation(context, state, [urara])
    urara = state.formation[0]
    skill = getSkill(urara)
    expect(skill.transition.state).toBe("unable")
    state = changeFormation(context, state, [urara, reika])
    urara = state.formation[0]
    skill = getSkill(urara)
    expect(skill.transition.state).toBe("idle")

    context.random.mode = "force"
    state = activateSkill(context, state, 0)

    // スキル発動の確認
    expect(state.event.length).toBe(1)
    let event = state.event[0]
    expect(event.type).toBe("skill_trigger")
    assert(event.type === "skill_trigger")
    expect(event.data.denco.carIndex).toBe(0)
    expect(event.data.denco.who).toBe("self")
    expect(event.data.denco).toMatchDenco(urara)
    expect(event.data.skillName).toBe("じかんあっしゅく Lv.4")
    expect(event.data.probability).toBe(50)
    expect(event.data.boostedProbability).toBe(50)
    expect(event.data.time).toBe(context.currentTime)

    // レイカのスキル cooldown -> idle
    reika = state.formation[1]
    skill = getSkill(reika)
    expect(skill.transition.state).toBe("idle")
    // スキル状態は即座に idle -> active -> wait
    urara = state.formation[0]
    skill = getSkill(urara)
    expect(skill.transition.state).toBe("cooldown")
    expect(skill.transition.data).toMatchObject({
      cooldownTimeout: now + (900 + 7200) * 1000
    })
  })

  test("スキル発動なし-確率", () => {
    const context = initContext("test", "test", false)
    let urara = DencoManager.getDenco(context, "25", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let state = initUser(context, "master", [urara, reika])

    // レイカスキルをcooldownに変更
    const now = dayjs().valueOf()
    context.clock = now
    state = activateSkill(context, state, 1)
    context.clock = now + 900 * 1000
    state = refreshState(context, state)

    context.random.mode = "ignore"
    state = activateSkill(context, state, 0)

    // スキル発動の確認
    expect(state.event.length).toBe(0)
  })
  test("スキル発動あり-確率補正あり", () => {
    const context = initContext("test", "test", false)
    let urara = DencoManager.getDenco(context, "25", 50)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let state = initUser(context, "master", [urara, hiiru, reika])

    // レイカスキルをcooldownに変更
    const now = dayjs().valueOf()
    context.clock = now
    state = activateSkill(context, state, 2)
    context.clock = now + 900 * 1000
    state = refreshState(context, state)

    context.random.mode = "force"
    state = activateSkill(context, state, 1, 0) // 先にひいるスキルを有効化

    // スキル発動の確認
    expect(state.event.length).toBe(2)
    let event = state.event[0]
    assert(event.type === "skill_trigger")
    expect(event.data.denco.carIndex).toBe(1)
    expect(event.data.denco.who).toBe("other")
    expect(event.data.denco).toMatchDenco(hiiru)
    expect(event.data.skillName).toBe("テンションAGEAGE↑↑ Lv.4")
    expect(event.data.probability).toBe(100)
    expect(event.data.boostedProbability).toBe(100)
    expect(event.data.time).toBe(context.currentTime)

    event = state.event[1]
    assert(event.type === "skill_trigger")
    expect(event.data.denco.carIndex).toBe(0)
    expect(event.data.denco.who).toBe("self")
    expect(event.data.denco).toMatchDenco(urara)
    expect(event.data.skillName).toBe("じかんあっしゅく Lv.4")
    expect(event.data.probability).toBe(50)
    expect(event.data.boostedProbability).toBe(50 * 1.2)
    expect(event.data.time).toBe(context.currentTime)

    // レイカのスキル cooldown -> idle
    reika = state.formation[2]
    let skill = getSkill(reika)
    expect(skill.transition.state).toBe("idle")
    // スキル状態は即座に idle -> active -> wait
    urara = state.formation[0]
    skill = getSkill(urara)
    expect(skill.transition.state).toBe("cooldown")
    expect(skill.transition.data).toMatchObject({
      cooldownTimeout: now + (900 + 7200) * 1000
    })

  })
  test("スキル発動なし-確率補正あり", () => {
    const context = initContext("test", "test", false)
    let urara = DencoManager.getDenco(context, "25", 50)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let state = initUser(context, "master", [urara, hiiru, reika])

    // レイカスキルをcooldownに変更
    const now = dayjs().valueOf()
    context.clock = now
    state = activateSkill(context, state, 2)
    context.clock = now + 900 * 1000
    state = refreshState(context, state)

    context.random.mode = "ignore"
    state = activateSkill(context, state, 1, 0)

    // スキル発動の確認
    expect(state.event.length).toBe(0)
  })
})
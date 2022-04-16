import { DencoManager, init } from "../.."
import { getCurrentTime, initContext } from "../../core/context"
import { changeFormation, initUser, refreshState } from "../../core/user"
import moment from "moment-timezone"
import { activateSkill, getSkill } from "../../core/skill"

describe("うららのスキル", () => {
  beforeAll(init)
  test("スキル発動あり", () => {

    const context = initContext("test", "test", false)
    let urara = DencoManager.getDenco(context, "25", 50)
    expect(urara.name).toBe("urara")
    expect(urara.skill.type).toBe("possess")
    const now = moment().valueOf()
    context.clock = now

    // 編成内ほか無し
    let state = initUser(context, "master", [urara])
    urara = state.formation[0]
    let skill = getSkill(urara)
    expect(skill.state.transition).toBe("manual-condition")
    expect(skill.state.type).toBe("unable")
    expect(() => activateSkill(context, state, 0)).toThrowError()

    // cooldownなし(idle)
    let reika = DencoManager.getDenco(context, "5", 50)
    state = changeFormation(context, state, [urara, reika])
    urara = state.formation[0]
    skill = getSkill(urara)
    expect(skill.state.type).toBe("unable")

    // cooldownなし(active)
    state = activateSkill(context, state, 1)
    urara = state.formation[0]
    skill = getSkill(urara)
    expect(skill.state.type).toBe("unable")

    // cooldownあり
    context.clock = now + 900 * 1000
    state = refreshState(context, state)
    reika = state.formation[1]
    skill = getSkill(reika)
    expect(skill.state.type).toBe("cooldown")
    urara = state.formation[0]
    skill = getSkill(urara)
    expect(skill.state.type).toBe("idle")

    // 編成の変更
    state = changeFormation(context, state, [urara])
    urara = state.formation[0]
    skill = getSkill(urara)
    expect(skill.state.type).toBe("unable")
    state = changeFormation(context, state, [urara, reika])
    urara = state.formation[0]
    skill = getSkill(urara)
    expect(skill.state.type).toBe("idle")

    context.random.mode = "force"
    state = activateSkill(context, state, 0)

    // スキル発動の確認
    expect(state.event.length).toBe(1)
    let event = state.event[0]
    expect(event.type).toBe("skill_trigger")
    if (event.type === "skill_trigger") {
      expect(event.data.denco.name).toBe("urara")
      expect(event.data.step).toBe("self")
      expect(event.data.time).toBe(getCurrentTime(context))
    }
    // レイカのスキル cooldown -> idle
    reika = state.formation[1]
    skill = getSkill(reika)
    expect(skill.state.type).toBe("idle")
    // スキル状態は即座に idle -> active -> wait
    urara = state.formation[0]
    skill = getSkill(urara)
    expect(skill.state.type).toBe("cooldown")
    expect(skill.state.data).toMatchObject({
      cooldownTimeout: now + (900 + 7200) * 1000
    })
  })

  test("スキル発動なし-確率", () => {
    const context = initContext("test", "test", false)
    let urara = DencoManager.getDenco(context, "25", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let state = initUser(context, "master", [urara, reika])

    // レイカスキルをcooldownに変更
    const now = moment().valueOf()
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
    const now = moment().valueOf()
    context.clock = now
    state = activateSkill(context, state, 2)
    context.clock = now + 900 * 1000
    state = refreshState(context, state)

    context.random.mode = "force"
    state = activateSkill(context, state, 1, 0) // 先にひいるスキルを有効化

    // スキル発動の確認
    expect(state.event.length).toBe(2)
    let event = state.event[0]
    expect(event.type).toBe("skill_trigger")
    if (event.type === "skill_trigger") {
      expect(event.data.denco.name).toBe("hiiru")
    }
    event = state.event[1]
    expect(event.type).toBe("skill_trigger")
    if (event.type === "skill_trigger") {
      expect(event.data.denco.name).toBe("urara")
    }

    // レイカのスキル cooldown -> idle
    reika = state.formation[2]
    let skill = getSkill(reika)
    expect(skill.state.type).toBe("idle")
    // スキル状態は即座に idle -> active -> wait
    urara = state.formation[0]
    skill = getSkill(urara)
    expect(skill.state.type).toBe("cooldown")
    expect(skill.state.data).toMatchObject({
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
    const now = moment().valueOf()
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
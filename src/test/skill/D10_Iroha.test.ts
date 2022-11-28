import dayjs from "dayjs"
import { activateSkill, getSkill, init, initContext, initUser, refreshState } from "../.."
import DencoManager from "../../core/dencoManager"

describe("いろはスキル", () => {
  beforeAll(init)
  test("スキル状態", () => {

    const context = initContext("test", "test", false)
    let iroha = DencoManager.getDenco(context, "10", 50)
    expect(iroha.name).toBe("iroha")
    expect(iroha.skill.type).toBe("possess")
    const now = dayjs().valueOf()
    context.clock = now
    let state = initUser(context, "master", [iroha])

    // リンク数0
    state = refreshState(context, state)
    iroha = state.formation[0]
    let skill = getSkill(iroha)
    expect(skill.transitionType).toBe("manual-condition")
    expect(skill.transition.state).toBe("unable")
    expect(() => activateSkill(context, state, 0)).toThrowError()

    // リンク数2 && 編成ひとり
    iroha = DencoManager.getDenco(context, "10", 50, 2)
    state = initUser(context, "master", [iroha])
    iroha = state.formation[0]
    skill = getSkill(iroha)
    expect(skill.transition.state).toBe("unable")

    // リンク数1 && 編成ふたり以上
    iroha = DencoManager.getDenco(context, "10", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50)
    state = initUser(context, "master", [iroha, reika])
    iroha = state.formation[0]
    skill = getSkill(iroha)
    expect(skill.transition.state).toBe("unable")

    // リンク数2 && 編成ふたり以上
    iroha = DencoManager.getDenco(context, "10", 50, 2)
    reika = DencoManager.getDenco(context, "5", 10)
    state = initUser(context, "master", [iroha, reika])
    iroha = state.formation[0]
    skill = getSkill(iroha)
    expect(skill.transition.state).toBe("idle")

    // リンク数2 && 編成ふたり以上 && 移譲相手の方が高レベル
    iroha = DencoManager.getDenco(context, "10", 50, 2)
    reika = DencoManager.getDenco(context, "5", 80)
    state = initUser(context, "master", [iroha, reika])
    iroha = state.formation[0]
    skill = getSkill(iroha)
    expect(skill.transition.state).toBe("unable")
  })

  test("スキル発動-先頭", () => {
    const context = initContext("test", "test", false)
    const now = dayjs().valueOf()
    context.clock = now
    let iroha = DencoManager.getDenco(context, "10", 50, 2)
    let reika = DencoManager.getDenco(context, "5", 50)
    let state = initUser(context, "master", [iroha, reika])
    iroha = state.formation[0]
    let skill = getSkill(iroha)
    expect(skill.transition.state).toBe("idle")
    const links = iroha.link

    state = activateSkill(context, state, 0)

    // スキル発動の確認
    expect(state.event.length).toBe(1)
    let event = state.event[0]
    expect(event.type).toBe("skill_trigger")
    if (event.type === "skill_trigger") {
      expect(event.data.denco.name).toBe("iroha")
      expect(event.data.step).toBe("self")
      expect(event.data.time).toBe(now)
    }
    // スキル状態は即座に idle -> active -> wait
    iroha = state.formation[0]
    skill = getSkill(iroha)
    expect(skill.transition.state).toBe("cooldown")
    expect(skill.transition.data).toMatchObject({ cooldownTimeout: now + 7200 * 1000 })
    // リンクの移譲の確認
    expect(iroha.link.length).toBe(1)
    const link = links.filter(l => l.name !== iroha.link[0].name)[0]
    reika = state.formation[1]
    expect(reika.link.length).toBe(1)
    expect(reika.link[0]).toMatchObject(link)
    // wait終了後
    context.clock = now + 7200 * 1000
    state = refreshState(context, state)
    iroha = state.formation[0]
    skill = getSkill(iroha)
    expect(skill.transition.state).toBe("unable")
  })

  test("スキル発動-先頭以外", () => {
    const context = initContext("test", "test", false)
    const now = dayjs().valueOf()
    context.clock = now
    let iroha = DencoManager.getDenco(context, "10", 50, 3)
    let reika = DencoManager.getDenco(context, "5", 50)
    let state = initUser(context, "master", [reika, iroha])
    iroha = state.formation[1]
    let skill = getSkill(iroha)
    expect(skill.transition.state).toBe("idle")
    state = activateSkill(context, state, 1)
    expect(state.event.length).toBe(1)
    let event = state.event[0]
    expect(event.type).toBe("skill_trigger")
    if (event.type === "skill_trigger") {
      expect(event.data.denco.name).toBe("iroha")
      expect(event.data.step).toBe("self")
      expect(event.data.time).toBe(now)
    }
    iroha = state.formation[1]
    skill = getSkill(iroha)
    expect(skill.transition.state).toBe("cooldown")
    expect(skill.transition.data).toMatchObject({ cooldownTimeout: now + 7200 * 1000 })
    expect(iroha.link.length).toBe(2)
    reika = state.formation[0]
    expect(reika.link.length).toBe(1)

    context.clock = now + 7200 * 1000
    state = refreshState(context, state)
    iroha = state.formation[1]
    skill = getSkill(iroha)
    expect(skill.transition.state).toBe("idle")
  })
})
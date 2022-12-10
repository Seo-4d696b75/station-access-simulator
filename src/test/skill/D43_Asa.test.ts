import assert from "assert"
import dayjs from "dayjs"
import { activateSkill, changeFormation, deactivateSkill, getSkill, init, initContext, initUser, isSkillActive, refreshState } from "../.."
import DencoManager from "../../core/dencoManager"

// $SKILL_COOLDOWN_TIME CoolDownの時間(sec)
const SKILL_COOLDOWN_TIME = 9000

describe("アサのスキル", () => {
  beforeAll(init)


  test("スキル状態", () => {
    const context = initContext("test", "test", false)
    let asa = DencoManager.getDenco(context, "43", 50)
    expect(asa.skill.type).toBe("possess")
    let state = initUser(context, "とあるマスター", [asa])
    const now = dayjs().valueOf()
    context.clock = now
    asa = state.formation[0]
    expect(asa.name).toBe("asa")
    let skill = getSkill(asa)
    expect(skill.transitionType).toBe("manual-condition")
    expect(skill.transition.state).toBe("unable")
    expect(() => activateSkill(context, state, 0)).toThrowError()
    expect(() => deactivateSkill(context, state, 0)).toThrowError()

    let reika = DencoManager.getDenco(context, "5", 50)
    let fubu = DencoManager.getDenco(context, "14", 50)
    let sigure = DencoManager.getDenco(context, "21", 50)
    let hokone = DencoManager.getDenco(context, "26", 50)
    let eria = DencoManager.getDenco(context, "33", 50)

    // activeなスキルなし
    state = changeFormation(context, state, [asa, reika, fubu])
    asa = state.formation[0]
    skill = getSkill(asa)
    expect(skill.transition.state).toBe("unable")

    // activeだけどスキル時間の設定なし
    state = changeFormation(context, state, [asa, sigure, reika, fubu])
    expect(isSkillActive(state.formation[1].skill))
    asa = state.formation[0]
    skill = getSkill(asa)
    expect(skill.transition.state).toBe("unable")

    // supporter以外は対象外
    state = changeFormation(context, state, [asa, hokone, eria])
    state = activateSkill(context, state, 1, 2)
    expect(isSkillActive(state.formation[1].skill))
    expect(isSkillActive(state.formation[2].skill))
    asa = state.formation[0]
    skill = getSkill(asa)
    expect(skill.transition.state).toBe("unable")

    // 対象あり
    state = changeFormation(context, state, [asa, reika, fubu])
    state = activateSkill(context, state, 1, 2)
    expect(isSkillActive(state.formation[1].skill))
    expect(isSkillActive(state.formation[2].skill))
    asa = state.formation[0]
    skill = getSkill(asa)
    expect(skill.transition.state).toBe("idle")

    // 発動
    state = activateSkill(context, state, 0)
    asa = state.formation[0]
    skill = getSkill(asa)
    // 即座にcooldown
    assert(skill.transition.state === "cooldown")
    assert(skill.transitionType === "manual-condition")
    assert(skill.transition.data)

    let data = skill.transition.data
    expect(data.cooldownTimeout).toBe(now + SKILL_COOLDOWN_TIME * 1000)

    expect(() => deactivateSkill(context, state, 0)).toThrowError()

    // CoolDown終わり
    context.clock = now + SKILL_COOLDOWN_TIME * 1000
    state = refreshState(context, state)
    asa = state.formation[0]
    skill = getSkill(asa)
    expect(skill.transition.state).toBe("unable")
  })

  test("発動-active時間の延長", () => {
    const context = initContext("test", "test", false)
    let asa = DencoManager.getDenco(context, "43", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let fubu = DencoManager.getDenco(context, "14", 50)
    let state = initUser(context, "とあるマスター", [asa, reika, fubu])
    const now = dayjs().valueOf()
    context.clock = now
    let skill = getSkill(state.formation[0])
    expect(skill.transition.state).toBe("unable")

    state = activateSkill(context, state, 1, 2)
    skill = getSkill(state.formation[0])
    expect(skill.transition.state).toBe("idle")

    state = activateSkill(context, state, 0)

    // reika 900 + 5400 sec
    skill = getSkill(state.formation[1])
    expect(skill.transition.state).toBe("active")
    expect(skill.transitionType).toBe("manual")
    expect(skill.transition.data).not.toBeUndefined()
    expect(skill.transition.data).toMatchObject({
      activatedAt: now,
      activeTimeout: now + 1080 * 1000, // 900 => 1080 (+20%)
      cooldownTimeout: now + (900 + 5400) * 1000, // 不変
    })

    // fubu 1800 + 7200 sec
    skill = getSkill(state.formation[2])
    expect(skill.transition.state).toBe("active")
    expect(skill.transitionType).toBe("manual")
    expect(skill.transition.data).not.toBeUndefined()
    expect(skill.transition.data).toMatchObject({
      activatedAt: now,
      activeTimeout: now + 2160 * 1000, // 1800 => 2160 (+20%)
      cooldownTimeout: now + (1800 + 7200) * 1000, // 不変
    })

  })

  test("発動-active時間の延長-cooldownTimeoutと逆転", () => {
    // うらら・タイムポンカチなどでアサのスキルを連続使用した場合、
    // activeTimeout > cooldownTimeout と逆転する
    const context = initContext("test", "test", false)
    let asa = DencoManager.getDenco(context, "43", 50)
    asa.film = {
      type: "film",
      theme: "theme",
      skill: {
        // percent増加
        extend: 600
      }
    }
    let reika = DencoManager.getDenco(context, "5", 50)
    let state = initUser(context, "とあるマスター", [asa, reika])
    const now = dayjs().valueOf()
    context.clock = now
    let skill = getSkill(state.formation[0])
    expect(skill.transition.state).toBe("unable")

    state = activateSkill(context, state, 1)
    skill = getSkill(state.formation[0])
    expect(skill.transition.state).toBe("idle")

    state = activateSkill(context, state, 0)

    // reika 900 + 5400 sec
    skill = getSkill(state.formation[1])
    expect(skill.transition.state).toBe("active")
    expect(skill.transitionType).toBe("manual")
    expect(skill.transition.data).not.toBeUndefined()
    expect(skill.transition.data).toMatchObject({
      activatedAt: now,
      activeTimeout: now + 6480 * 1000, // 900 => 6480 (+620%)
      cooldownTimeout: now + (900 + 5400) * 1000, // 不変
    })


    // まだアクティブ（本来ならactive終了)
    context.clock = now + 900 * 1000
    state = refreshState(context, state)
    skill = getSkill(state.formation[1])
    expect(skill.transition.state).toBe("active")

    // まだアクティブ（本来ならcooldown終了)
    context.clock = now + 6300 * 1000
    state = refreshState(context, state)
    skill = getSkill(state.formation[1])
    expect(skill.transition.state).toBe("active")

    // active終了　同時にcooldownも終了
    context.clock = now + 6480 * 1000
    state = refreshState(context, state)
    skill = getSkill(state.formation[1])
    expect(skill.transition.state).toBe("idle")
  })
})
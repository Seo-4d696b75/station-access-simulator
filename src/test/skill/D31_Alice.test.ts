import moment from "moment-timezone"
import { init } from "../.."
import { getAccessDenco, hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { activateSkill, deactivateSkill, getSkill } from "../../core/skill"
import { initUser, refreshState } from "../../core/user"

describe("ありすのスキル", () => {
  beforeAll(init)
  test("スキル状態", () => {
    const context = initContext("test", "test", false)
    let alice = DencoManager.getDenco(context, "31", 50)
    expect(alice.skill.type).toBe("possess")
    let state = initUser(context, "とあるマスター", [alice])
    // スポーツの日
    context.clock = moment('2022-10-10T12:00:00+0900').valueOf()
    state = refreshState(context, state)
    alice = state.formation[0]
    let skill = getSkill(alice)
    expect(skill.transitionType).toBe("auto-condition")
    expect(skill.transition.state).toBe("active")

    expect(() => activateSkill(context, state, 0)).toThrowError()
    expect(() => deactivateSkill(context, state, 0)).toThrowError()

    // 翌日は休みじゃないぞ
    context.clock = moment('2022-10-11T12:00:00+0900').valueOf()
    state = refreshState(context, state)
    alice = state.formation[0]
    skill = getSkill(alice)
    expect(skill.transitionType).toBe("auto-condition")
    expect(skill.transition.state).toBe("unable")
  })
  test("発動なし-フットバース使用", () => {
    const context = initContext("test", "test", false)
    context.clock = moment('2022-10-10T12:00:00+0900').valueOf()
    let alice = DencoManager.getDenco(context, "31", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let defense = initUser(context, "とあるマスター", [alice])
    let offense = initUser(context, "とあるマスター２", [reika])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: alice.link[0],
      usePink: true,
    }
    const result = startAccess(context, config)
    expect(result.pinkItemSet).toBe(true)
    expect(result.pinkItemUsed).toBe(true)
    expect(result.pinkMode).toBe(true)
    expect(hasSkillTriggered(result.defense, alice)).toBe(false)
    expect(result.defendPercent).toBe(0)
    let d = getAccessDenco(result, "defense")
    expect(d.reboot).toBe(false)
  })
  test("発動なし-攻撃側", () => {
    const context = initContext("test", "test", false)
    context.clock = moment('2022-10-10T12:00:00+0900').valueOf()
    let alice = DencoManager.getDenco(context, "31", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let defense = initUser(context, "とあるマスター", [reika])
    let offense = initUser(context, "とあるマスター２", [alice])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: reika.link[0],
    }
    const result = startAccess(context, config)
    expect(result.pinkMode).toBe(false)
    expect(hasSkillTriggered(result.offense, alice)).toBe(false)
    expect(result.defendPercent).toBe(0)
  })

  test("発動なし-守備側(編成内)", () => {
    const context = initContext("test", "test", false)
    context.clock = moment('2022-10-10T12:00:00+0900').valueOf()
    let seria = DencoManager.getDenco(context, "1", 50, 1)
    let alice = DencoManager.getDenco(context, "31", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [seria, alice])
    let offense = initUser(context, "とあるマスター２", [charlotte])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: seria.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, alice)).toBe(false)
    expect(result.defendPercent).toBe(0)
  })

  test("発動なし-確率", () => {
    const context = initContext("test", "test", false)
    // 月曜日だけど祝日
    context.clock = moment('2022-10-10T12:00:00+0900').valueOf()
    context.random.mode = "ignore"
    let alice = DencoManager.getDenco(context, "31", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let defense = initUser(context, "とあるマスター", [alice])
    let offense = initUser(context, "とあるマスター２", [reika])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: alice.link[0],
    }
    const result = startAccess(context, config)
    expect(result.pinkMode).toBe(false)
    expect(hasSkillTriggered(result.defense, alice)).toBe(false)
    expect(result.defendPercent).toBe(0)
  })

  test("発動あり-祝日(土日曜以外)", () => {
    const context = initContext("test", "test", false)
    // 月曜日だけど祝日
    context.clock = moment('2022-10-10T12:00:00+0900').valueOf()
    context.random.mode = "force"
    let alice = DencoManager.getDenco(context, "31", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let defense = initUser(context, "とあるマスター", [alice])
    let offense = initUser(context, "とあるマスター２", [reika])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: alice.link[0],
    }
    const result = startAccess(context, config)
    expect(result.pinkMode).toBe(false)
    expect(hasSkillTriggered(result.defense, alice)).toBe(true)
    expect(result.defendPercent).toBe(25)
  })
  test("発動あり-土日(祝日以外)", () => {
    const context = initContext("test", "test", false)
    // 日曜日
    context.clock = moment('2022-10-09T12:00:00+0900').valueOf()
    context.random.mode = "force"
    let alice = DencoManager.getDenco(context, "31", 50, 1)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let defense = initUser(context, "とあるマスター", [alice])
    let offense = initUser(context, "とあるマスター２", [reika])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: alice.link[0],
    }
    const result = startAccess(context, config)
    expect(result.pinkMode).toBe(false)
    expect(hasSkillTriggered(result.defense, alice)).toBe(true)
    expect(result.defendPercent).toBe(25)
  })
  test("発動あり-土日(祝日以外)-確率補正あり", () => {
    const context = initContext("test", "test", false)
    // 日曜日
    context.clock = moment('2022-10-09T12:00:00+0900').valueOf()
    context.random.mode = "force"
    let alice = DencoManager.getDenco(context, "31", 50, 1)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let defense = initUser(context, "とあるマスター", [alice, hiiru])
    defense = activateSkill(context, defense, 1)
    let offense = initUser(context, "とあるマスター２", [reika])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: alice.link[0],
    }
    const result = startAccess(context, config)
    expect(result.pinkMode).toBe(false)
    expect(hasSkillTriggered(result.defense, alice)).toBe(true)
    expect(hasSkillTriggered(result.defense, hiiru)).toBe(true)
    expect(result.defendPercent).toBe(25)
  })
})
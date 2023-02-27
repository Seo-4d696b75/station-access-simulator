import dayjs from "dayjs"
import { init } from "../.."
import { getSkillTrigger, hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { activateSkill, getSkill } from "../../core/skill"
import { initUser } from "../../core/user"

describe("るりのスキル", () => {
  beforeAll(init)

  describe("スキル状態", () => {
    test.each([
      dayjs('2022-12-01T07:00:00+0900'),
      dayjs('2022-12-01T08:00:00+0900'),
      dayjs('2022-12-01T09:00:00+0900'),
      dayjs('2022-12-01T09:59:59+0900'),
      dayjs('2022-12-01T17:00:00+0900'),
      dayjs('2022-12-01T18:00:00+0900'),
      dayjs('2022-12-01T19:00:00+0900'),
      dayjs('2022-12-01T19:59:59+0900'),
    ])("active %s", (date) => {
      const context = initContext("test", "test", false)
      context.clock = date.valueOf()
      let seria = DencoManager.getDenco(context, "1", 50)
      let ruri = DencoManager.getDenco(context, "71", 50)
      let state = initUser(context, "とあるマスター", [ruri, seria])

      ruri = state.formation[0]
      let skill = getSkill(ruri)
      expect(skill.transition.state).toBe("active")
    })
    test.each([
      // 平日の時間外
      dayjs('2022-12-01T00:00:00+0900'),
      dayjs('2022-12-01T06:00:00+0900'),
      dayjs('2022-12-01T06:59:59+0900'),
      dayjs('2022-12-01T10:00:00+0900'),
      dayjs('2022-12-01T12:00:00+0900'),
      dayjs('2022-12-01T15:00:00+0900'),
      dayjs('2022-12-01T16:59:59+0900'),
      dayjs('2022-12-01T20:00:00+0900'),
      dayjs('2022-12-01T23:00:00+0900'),
      // 週末
      dayjs('2022-12-03T08:00:00+0900'),
      dayjs('2022-12-03T18:00:00+0900'),
      // 祝日
      dayjs('2022-11-23T08:00:00+0900'),
      dayjs('2022-11-23T18:00:00+0900'),
    ])("unable %s", (date) => {
      const context = initContext("test", "test", false)
      context.clock = date.valueOf()
      let seria = DencoManager.getDenco(context, "1", 50)
      let ruri = DencoManager.getDenco(context, "71", 50)
      let state = initUser(context, "とあるマスター", [ruri, seria])

      ruri = state.formation[0]
      let skill = getSkill(ruri)
      expect(skill.transition.state).toBe("unable")
    })
  })

  test("発動あり-攻撃側(アクセス)", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    context.clock = dayjs('2022-12-01T07:00:00+0900').valueOf()

    let seria = DencoManager.getDenco(context, "1", 50)
    let ruri = DencoManager.getDenco(context, "71", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [ruri, seria])
    let defense = initUser(context, "とあるマスター２", [charlotte])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: charlotte.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "offense", ruri)).toBe(true)
    let t = getSkillTrigger(result, "offense", ruri)[0]
    expect(t.skillName).toBe("こつこつワーキング Lv.4")
    expect(t.probability).toBe(75)
    expect(t.boostedProbability).toBe(75)
    expect(t.canTrigger).toBe(true)
    expect(t.triggered).toBe(true)

    expect(result.attackPercent).toBe(14)
  })
  test("発動あり-攻撃側(編成内)", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    context.clock = dayjs('2022-12-01T07:00:00+0900').valueOf()

    let seria = DencoManager.getDenco(context, "1", 50)
    let ruri = DencoManager.getDenco(context, "71", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [seria, ruri])
    let defense = initUser(context, "とあるマスター２", [charlotte])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: charlotte.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "offense", ruri)).toBe(true)
    let t = getSkillTrigger(result, "offense", ruri)[0]
    expect(t.skillName).toBe("こつこつワーキング Lv.4")
    expect(t.probability).toBe(75)
    expect(t.boostedProbability).toBe(75)
    expect(t.canTrigger).toBe(true)
    expect(t.triggered).toBe(true)

    expect(result.attackPercent).toBe(14)
  })
  test("発動なし-攻撃側(編成内)-確率", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "ignore"
    context.clock = dayjs('2022-12-01T07:00:00+0900').valueOf()

    let seria = DencoManager.getDenco(context, "1", 50)
    let ruri = DencoManager.getDenco(context, "71", 50)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [seria, ruri, hiiru])
    offense = activateSkill(context, offense, 2)
    let defense = initUser(context, "とあるマスター２", [charlotte])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: charlotte.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "offense", ruri)).toBe(false)
    expect(hasSkillTriggered(result, "offense", hiiru)).toBe(true)
    let t = getSkillTrigger(result, "offense", ruri)[0]
    expect(t.skillName).toBe("こつこつワーキング Lv.4")
    expect(t.probability).toBe(75)
    expect(t.boostedProbability).toBe(75 * 1.2)
    expect(t.canTrigger).toBe(false)
    expect(t.triggered).toBe(false)

    expect(result.attackPercent).toBe(0)
  })
  test("発動あり-攻撃側(編成内)-確率ブースト", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    context.clock = dayjs('2022-12-01T07:00:00+0900').valueOf()

    let seria = DencoManager.getDenco(context, "1", 50)
    let ruri = DencoManager.getDenco(context, "71", 50)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [seria, ruri, hiiru])
    offense = activateSkill(context, offense, 2)
    let defense = initUser(context, "とあるマスター２", [charlotte])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: charlotte.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "offense", hiiru)).toBe(true)
    expect(hasSkillTriggered(result, "offense", ruri)).toBe(true)
    let t = getSkillTrigger(result, "offense", ruri)[0]
    expect(t.skillName).toBe("こつこつワーキング Lv.4")
    expect(t.probability).toBe(75)
    expect(t.boostedProbability).toBe(75 * 1.2)
    expect(t.canTrigger).toBe(true)
    expect(t.triggered).toBe(true)

    expect(result.attackPercent).toBe(14)
  })
  test("発動あり-攻撃側(編成内)-確率ブースト(Lv.80)", () => {
    const context = initContext("test", "test", false)
    context.random.mode = "ignore" // 発動ブーストで100%以上
    context.clock = dayjs('2022-12-01T07:00:00+0900').valueOf()

    let seria = DencoManager.getDenco(context, "1", 50)
    let ruri = DencoManager.getDenco(context, "71", 80)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [seria, ruri, hiiru])
    offense = activateSkill(context, offense, 2)
    let defense = initUser(context, "とあるマスター２", [charlotte])
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: charlotte.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "offense", hiiru)).toBe(true)
    expect(hasSkillTriggered(result, "offense", ruri)).toBe(true)
    let t = getSkillTrigger(result, "offense", ruri)[0]
    expect(t.skillName).toBe("ビューティフル・デイズ")
    expect(t.probability).toBe(90)
    expect(t.boostedProbability).toBe(100)
    expect(t.canTrigger).toBe(true)
    expect(t.triggered).toBe(true)

    expect(result.attackPercent).toBe(20)
  })
})
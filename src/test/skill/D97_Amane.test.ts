import assert from "assert"
import { times } from "lodash"
import { init } from "../.."
import { AccessResult, getSkillTrigger, hasSkillTriggered, startAccess } from "../../core/access/index"
import { Context, initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { activateSkill, getSkill } from "../../core/skill"
import { initUser, UserState } from "../../core/user"
import "../../gen/matcher"
import { testManualSkill } from "../tool/skillState"

describe("あまねのスキル", () => {
  beforeAll(init)

  testManualSkill({
    number: "97",
    name: "amane",
    active: 900,
    cooldown: 10800,
  })

  describe("AKT増加", () => {

    test("発動あり-アクセス", () => {
      const context = initContext("test", "test", false)
      let amane = DencoManager.getDenco(context, "97", 50)
      let siira = DencoManager.getDenco(context, "11", 50)
      let offense = initUser(context, "とあるマスター", [amane, siira])
      offense = activateSkill(context, offense, 0)
      let miroku = DencoManager.getDenco(context, "4", 50, 1)
      let defense = initUser(context, "とあるマスター２", [miroku])
      let config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: miroku.link[0],
      }
      const result = startAccess(context, config)
      assert(result.defense)
      expect(hasSkillTriggered(result, "offense", amane)).toBe(true)
      expect(result.attackPercent).toBe(32)
    })
    test("発動なし-アクセス編成内", () => {
      const context = initContext("test", "test", false)
      let amane = DencoManager.getDenco(context, "97", 50)
      let siira = DencoManager.getDenco(context, "11", 50)
      let offense = initUser(context, "とあるマスター", [amane, siira])
      offense = activateSkill(context, offense, 0)
      let miroku = DencoManager.getDenco(context, "4", 50, 1)
      let defense = initUser(context, "とあるマスター２", [miroku])
      let config = {
        offense: {
          state: offense,
          carIndex: 1
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: miroku.link[0],
      }
      const result = startAccess(context, config)
      assert(result.defense)
      expect(hasSkillTriggered(result, "offense", amane)).toBe(false)
      expect(result.attackPercent).toBe(0)
    })
  })

  describe("スキル時間の増減", () => {

    test.each([1, 2, 3, 5, 10, 15, 20, 30])("延長-リンク成功x%d", (cnt) => {
      const context = initContext("test", "test", false)
      const start = context.currentTime
      context.clock = start

      let amane = DencoManager.getDenco(context, "97", 50)
      let siira = DencoManager.getDenco(context, "11", 50)
      let state = initUser(context, "とあるマスター", [amane, siira])
      state = activateSkill(context, state, 0)
      state = repeatAccess(context, state, cnt, true)


      expect(state.event.length).toBe(cnt * 2)
      let e = state.event[state.event.length - 2]
      assert(e.type === "access")
      e = state.event[state.event.length - 1]
      assert(e.type === "skill_trigger")
      expect(e.data.time).toBe(start)
      expect(e.data.skillName).toBe("絶好調ナルシズム Lv.4")
      expect(e.data.probability).toBe(100)
      expect(e.data.denco.carIndex).toBe(0)
      expect(e.data.denco.who).toBe("self")
      expect(e.data.denco).toMatchDenco(amane)

      let s = getSkill(state.formation[0])
      assert(s.transitionType === "manual")
      assert(s.transition.state === "active")
      assert(s.transition.data)
      expect(s.transition.data.activatedAt).toBe(start)
      // 150秒延長 x cnt （上限1時間）
      const activeSec = Math.min(900 + 150 * cnt, 3600)
      expect(s.transition.data.activeDuration).toBe(900 * 1000)
      expect(s.transition.data.activeTimeout).toBe(start + activeSec * 1000)
      // cooldown時間に変化なし
      expect(s.transition.data.cooldownDuration).toBe(10800 * 1000)
      expect(s.transition.data.cooldownTimeout).toBe(start + (activeSec + 10800) * 1000)
    })
    test.each([1, 2, 3, 5, 10, 14])("短縮-リンク失敗x%d", (cnt) => {
      const context = initContext("test", "test", false)
      const start = context.currentTime
      context.clock = start

      let amane = DencoManager.getDenco(context, "97", 50)
      let siira = DencoManager.getDenco(context, "11", 50)
      let state = initUser(context, "とあるマスター", [amane, siira])
      state = activateSkill(context, state, 0)
      state = repeatAccess(context, state, cnt, false)

      expect(state.event.length).toBe(cnt * 2)
      let e = state.event[state.event.length - 2]
      assert(e.type === "access")
      e = state.event[state.event.length - 1]
      assert(e.type === "skill_trigger")
      expect(e.data.skillName).toBe("絶好調ナルシズム Lv.4")
      expect(e.data.probability).toBe(100)
      expect(e.data.denco.carIndex).toBe(0)
      expect(e.data.denco.who).toBe("self")
      expect(e.data.denco).toMatchDenco(amane)

      let s = getSkill(state.formation[0])
      assert(s.transitionType === "manual")
      assert(s.transition.state === "active")
      assert(s.transition.data)
      expect(s.transition.data.activatedAt).toBe(start)
      // 60秒短縮 x cnt
      const activeSec = 900 - 60 * cnt
      expect(s.transition.data.activeDuration).toBe(900 * 1000)
      expect(s.transition.data.activeTimeout).toBe(start + activeSec * 1000)
      // cooldown時間に変化なし
      expect(s.transition.data.cooldownDuration).toBe(10800 * 1000)
      expect(s.transition.data.cooldownTimeout).toBe(start + (activeSec + 10800) * 1000)
    })
    test("短縮-リンク失敗x15", () => {
      const context = initContext("test", "test", false)
      const start = context.currentTime
      context.clock = start

      let amane = DencoManager.getDenco(context, "97", 50)
      let siira = DencoManager.getDenco(context, "11", 50)
      let state = initUser(context, "とあるマスター", [amane, siira])
      state = activateSkill(context, state, 0)
      state = repeatAccess(context, state, 15, false)

      expect(state.event.length).toBe(30)
      let e = state.event[28]
      assert(e.type === "access")
      e = state.event[29]
      assert(e.type === "skill_trigger")
      expect(e.data.skillName).toBe("絶好調ナルシズム Lv.4")
      expect(e.data.probability).toBe(100)
      expect(e.data.denco.carIndex).toBe(0)
      expect(e.data.denco.who).toBe("self")
      expect(e.data.denco).toMatchDenco(amane)

      // active終了
      let s = getSkill(state.formation[0])
      assert(s.transitionType === "manual")
      expect(s.transition.state).toBe("cooldown")
      assert(s.transition.data)
      expect(s.transition.data.cooldownDuration).toBe(10800 * 1000)
      expect(s.transition.data.cooldownTimeout).toBe(start + 10800 * 1000)
    })


    test("足湯", () => {
      const context = initContext("test", "test", false)
      const start = context.currentTime
      context.clock = start

      let amane = DencoManager.getDenco(context, "97", 50)
      let siira = DencoManager.getDenco(context, "11", 50)
      let offense = initUser(context, "とあるマスター", [amane, siira])
      offense = activateSkill(context, offense, 0)
      let charlotte = DencoManager.getDenco(context, "6", 50, 1)
      let defense = initUser(context, "user", [charlotte])


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
        usePink: true,
      }
      const result = startAccess(context, config)
      expect(result.linkSuccess).toBe(true)

      expect(result.offense.event.length).toBe(2)
      let e = result.offense.event[0]
      assert(e.type === "access")
      e = result.offense.event[1]
      assert(e.type === "skill_trigger")
      expect(e.data.skillName).toBe("絶好調ナルシズム Lv.4")

      let s = getSkill(result.offense.formation[0])
      assert(s.transitionType === "manual")
      assert(s.transition.state === "active")
      assert(s.transition.data)
      expect(s.transition.data.activatedAt).toBe(start)
      // 150秒延長
      expect(s.transition.data.activeDuration).toBe(900 * 1000)
      expect(s.transition.data.activeTimeout).toBe(start + (900 + 150) * 1000)
    })
    test("相手不在", () => {
      const context = initContext("test", "test", false)
      const start = context.currentTime
      context.clock = start

      let amane = DencoManager.getDenco(context, "97", 50)
      let siira = DencoManager.getDenco(context, "11", 50)
      let offense = initUser(context, "とあるマスター", [amane, siira])
      offense = activateSkill(context, offense, 0)
      let charlotte = DencoManager.getDenco(context, "6", 50, 1)

      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: undefined,
        station: charlotte.link[0],
      }
      const result = startAccess(context, config)
      expect(result.linkSuccess).toBe(true)

      expect(result.offense.event.length).toBe(2)
      let e = result.offense.event[0]
      assert(e.type === "access")
      e = result.offense.event[1]
      assert(e.type === "skill_trigger")
      expect(e.data.skillName).toBe("絶好調ナルシズム Lv.4")

      let s = getSkill(result.offense.formation[0])
      assert(s.transitionType === "manual")
      assert(s.transition.state === "active")
      assert(s.transition.data)
      expect(s.transition.data.activatedAt).toBe(start)
      // 150秒延長
      expect(s.transition.data.activeDuration).toBe(900 * 1000)
      expect(s.transition.data.activeTimeout).toBe(start + (900 + 150) * 1000)
    })
    test("カウンターでリブート", () => {
      const context = initContext("test", "test", false)
      const start = context.currentTime
      context.clock = start

      let amane = DencoManager.getDenco(context, "97", 50)
      let siira = DencoManager.getDenco(context, "11", 50)
      let offense = initUser(context, "とあるマスター", [amane, siira])
      offense = activateSkill(context, offense, 0)
      let marika = DencoManager.getDenco(context, "58", 50, 1)
      let defense = initUser(context, "user", [marika])
      defense = activateSkill(context, defense, 0)


      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: marika.link[0],
      }
      const result = startAccess(context, config)
      expect(result.linkSuccess).toBe(false)
      let d = result.offense.formation[0]
      expect(d.damage).not.toBeUndefined()
      expect(d.reboot).toBe(true)

      expect(result.offense.event.length).toBe(3)
      let e = result.offense.event[0]
      assert(e.type === "access")
      e = result.offense.event[1]
      assert(e.type === "reboot")
      e = result.offense.event[2]
      assert(e.type === "skill_trigger")
      expect(e.data.skillName).toBe("絶好調ナルシズム Lv.4")

      let s = getSkill(result.offense.formation[0])
      assert(s.transitionType === "manual")
      assert(s.transition.state === "active")
      assert(s.transition.data)
      expect(s.transition.data.activatedAt).toBe(start)
      // 60秒短縮
      expect(s.transition.data.activeDuration).toBe(900 * 1000)
      expect(s.transition.data.activeTimeout).toBe(start + (900 - 60) * 1000)
    })
  })

  describe("無効化の影響", () => {
    test("coolスキルの無効化", () => {
      const context = initContext("test", "test", false)
      const start = context.currentTime
      context.clock = start
      context.random.mode = "force"

      let amane = DencoManager.getDenco(context, "97", 50)
      let siira = DencoManager.getDenco(context, "11", 50)
      let offense = initUser(context, "とあるマスター", [amane, siira])
      offense = activateSkill(context, offense, 0)
      let tesuto = DencoManager.getDenco(context, "EX04", 10, 1)
      let defense = initUser(context, "user", [tesuto])
      defense = activateSkill(context, defense, 0)


      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: tesuto.link[0],
      }
      const result = startAccess(context, config)
      expect(result.linkSuccess).toBe(true)
      // ATK増加の無効化
      expect(hasSkillTriggered(result, "offense", amane)).toBe(false)
      expect(hasSkillTriggered(result, "defense", tesuto)).toBe(true)
      expect(result.attackPercent).toBe(0)
      const t = getSkillTrigger(result, "offense", amane)[0]
      expect(t.skillName).toBe("絶好調ナルシズム Lv.4")
      expect(t.probability).toBe(100)
      expect(t.invalidated).toBe(true)
      expect(t.canTrigger).toBe(false)
      expect(t.triggered).toBe(false)

      // スキル時間の増減もなし
      expect(result.offense.event.length).toBe(1)
      let e = result.offense.event[0]
      assert(e.type === "access")
    })
    test("ATK増加効果の無効化", () => {
      const context = initContext("test", "test", false)
      const start = context.currentTime
      context.clock = start
      context.random.mode = "force"

      let amane = DencoManager.getDenco(context, "97", 50)
      let siira = DencoManager.getDenco(context, "11", 50)
      let offense = initUser(context, "とあるマスター", [amane, siira])
      offense = activateSkill(context, offense, 0)
      let eria = DencoManager.getDenco(context, "33", 80, 1)
      let defense = initUser(context, "user", [eria])
      defense = activateSkill(context, defense, 0)


      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: eria.link[0],
      }
      const result = startAccess(context, config)
      expect(result.linkSuccess).toBe(false)
      // ATK増加の無効化
      expect(hasSkillTriggered(result, "offense", amane)).toBe(false)
      expect(hasSkillTriggered(result, "defense", eria)).toBe(true)
      expect(result.attackPercent).toBe(0)
      const t = getSkillTrigger(result, "offense", amane)[0]
      expect(t.skillName).toBe("絶好調ナルシズム Lv.4")
      expect(t.probability).toBe(100)
      expect(t.invalidated).toBe(true)
      expect(t.canTrigger).toBe(false)
      expect(t.triggered).toBe(false)

      // スキル時間の増減は無効化されない
      expect(result.offense.event.length).toBe(2)
      let e = result.offense.event[0]
      assert(e.type === "access")
      e = result.offense.event[1]
      assert(e.type === "skill_trigger")
      expect(e.data.skillName).toBe("絶好調ナルシズム Lv.4")

      let s = getSkill(result.offense.formation[0])
      assert(s.transitionType === "manual")
      assert(s.transition.state === "active")
      assert(s.transition.data)
      expect(s.transition.data.activatedAt).toBe(start)
      // 60秒短縮
      expect(s.transition.data.activeDuration).toBe(900 * 1000)
      expect(s.transition.data.activeTimeout).toBe(start + (900 - 60) * 1000)
    })
  })
})

function repeatAccess(context: Context, state: UserState, count: number, extend: boolean = true): UserState {
  let next = state
  times(count, () => {
    next = extendActive(context, next, extend).offense
  })
  return next
}

function extendActive(context: Context, state: UserState, extend: boolean = true): AccessResult {
  let reika = DencoManager.getDenco(context, "5", 50, 1)
  reika.currentHp = extend ? 1 : Number.MAX_SAFE_INTEGER
  reika.maxHp = Math.max(reika.maxHp, reika.currentHp)
  let defense = initUser(context, "user", [reika])
  assert(state.formation[0].name === "amane")
  state.formation[0].currentExp = 0
  state.formation[0].nextExp = Number.MAX_SAFE_INTEGER
  const config = {
    offense: {
      state: state,
      carIndex: 0
    },
    defense: {
      state: defense,
      carIndex: 0
    },
    station: reika.link[0],
  }
  return startAccess(context, config)
}
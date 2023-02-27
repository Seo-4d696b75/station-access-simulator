import assert from "assert"
import { DencoAttribute, DencoManager, getSkill, init, StationAttribute, StationManager } from "../.."
import { hasSkillTriggered, startAccess } from "../../core/access/index"
import { Context, initContext } from "../../core/context"
import { initUser, refreshState, UserState } from "../../core/user"
import "../../gen/matcher"

describe("くろがねのスキル", () => {
  beforeAll(init)

  const attrList: DencoAttribute[] = ["heat", "cool", "eco"]

  describe.each(attrList)("スキル状態遷移＆属性変化(%d)", (attr) => {

    test("基本", () => {
      const context = initContext("test", "test", false)
      let kurogane = DencoManager.getDenco(context, "83", 50)
      let offense = initUser(context, "とあるマスター", [kurogane])

      let skill = getSkill(offense.formation[0])
      expect(skill.transitionType).toBe("auto")
      expect(skill.transition.state).toBe("unable")
      expect(skill.transition.data).toBeUndefined()

      let miroku = DencoManager.getDenco(context, "4", 10, 1)
      miroku.link[0].attr = attr as StationAttribute
      let defense = initUser(context, "とあるマスター", [miroku])
      const config = {
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

      const start = context.currentTime
      context.clock = start

      const result = startAccess(context, config)
      expect(result.linkSuccess).toBe(true)
      // 属性の変化
      let d = result.offense.formation[0]
      expect(d.attr).toBe(attr)
      // スキル発動の表示
      expect(result.offense.event.length).toBe(2)
      let e = result.offense.event[0]
      expect(e.type).toBe("access")
      e = result.offense.event[1]
      assert(e.type === "skill_trigger")
      assert(d.skill.type === "possess")
      assert(d.skill.transitionType === "auto")
      expect(e.data.denco).toMatchDencoState({
        ...d,
        // スキル発動直前の状態
        attr: "cool",
        skill: {
          ...d.skill,
          transition: {
            data: undefined,
            state: "unable",
          }
        }
      })
      expect(e.data.denco.carIndex).toBe(0)
      expect(e.data.denco.who).toBe("self")
      expect(e.data.time).toBe(start)
      expect(e.data.skillName).toBe("くろがね忍法・変化の術！ Lv.4")
      // スキル状態
      skill = getSkill(d)
      expect(skill.transition.state).toBe("active")
      expect(skill.transition.data).toMatchObject({
        activeTimeout: start + 1800 * 1000,
        cooldownTimeout: start + (1800 + 900) * 1000,
      })

      // cooldown
      context.clock = start + 1800 * 1000
      offense = refreshState(context, result.offense)
      let c = offense.formation[0]
      skill = getSkill(c)
      expect(c.attr).toBe("cool")
      expect(skill.transition.state).toBe("cooldown")

    })

    test("不在駅", () => {
      const context = initContext("test", "test", false)
      let kurogane = DencoManager.getDenco(context, "83", 50)
      let state = initUser(context, "とあるマスター", [kurogane])
      state = linkStation(context, state, attr)
      let d = state.formation[0]
      expect(d.attr).toBe(attr)
    })

    test("足湯", () => {
      const context = initContext("test", "test", false)
      let kurogane = DencoManager.getDenco(context, "83", 50)
      let offense = initUser(context, "とあるマスター", [kurogane])
      let miroku = DencoManager.getDenco(context, "4", 50, 1)
      let defense = initUser(context, "とあるマスター", [miroku])
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: miroku.link[0],
        usePink: true,
      }
      const result = startAccess(context, config)
      expect(result.linkSuccess).toBe(true)
      expect(result.pinkMode).toBe(true)
      let d = result.offense.formation[0]
      expect(d.attr).toBe(attr)
    })

    test("Lv.80ではcooldownなし", () => {
      const context = initContext("test", "test", false)
      const start = context.currentTime
      context.clock = start

      let kurogane = DencoManager.getDenco(context, "83", 80)
      let state = initUser(context, "とあるマスター", [kurogane])
      state = linkStation(context, state, attr)
      let d = state.formation[0]
      expect(d.attr).toBe(attr)
      // スキル状態
      let skill = getSkill(d)
      expect(skill.transition.state).toBe("active")
      expect(skill.transition.data).toMatchObject({
        activeTimeout: start + 1800 * 1000,
        cooldownTimeout: start + 1800 * 1000,
      })

      // 終了
      context.clock = start + 1800 * 1000
      state = refreshState(context, state)
      d = state.formation[0]
      skill = getSkill(d)
      expect(d.attr).toBe("cool")
      expect(skill.transition.state).toBe("unable")

    })

  })

  describe.each(
    [
      {
        attr: "heat",
        atk: 28,
        def: 0,
      },
      {
        attr: "cool",
        atk: 14,
        def: 14,
      },
      {
        attr: "eco",
        atk: 0,
        def: 28,
      }
    ] as {
      attr: DencoAttribute
      atk: number
      def: number
    }[]
  )("ATK,DEF増加 %s", (param) => {

    test("アクセス", () => {
      const context = initContext("test", "test", false)
      let kurogane = DencoManager.getDenco(context, "83", 50)
      let offense = initUser(context, "とあるマスター", [kurogane])
      offense = linkStation(context, offense, param.attr)
      expect(offense.formation[0].attr).toBe(param.attr)

      let miroku = DencoManager.getDenco(context, "4", 50, 1)
      let defense = initUser(context, "とあるマスター", [miroku])
      const config = {
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
      expect(hasSkillTriggered(result, "offense", kurogane)).toBe(param.atk > 0)
      expect(result.attackPercent).toBe(param.atk)
      expect(result.defendPercent).toBe(0)
      expect(result.offense.formation[0].attr).toBe(param.attr)
    })

    test("被アクセス", () => {
      const context = initContext("test", "test", false)
      let kurogane = DencoManager.getDenco(context, "83", 50)
      let defense = initUser(context, "とあるマスター", [kurogane])
      defense = linkStation(context, defense, param.attr)
      expect(defense.formation[0].attr).toBe(param.attr)

      let miroku = DencoManager.getDenco(context, "4", 50)
      let offense = initUser(context, "とあるマスター", [miroku])
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: defense.formation[0].link[0],
      }
      const result = startAccess(context, config)
      expect(hasSkillTriggered(result, "defense", kurogane)).toBe(param.def > 0)
      expect(result.attackPercent).toBe(0)
      expect(result.defendPercent).toBe(param.def)
      expect(result.defense!.formation[0].attr).toBe(param.attr)
    })

  })

})

function linkStation(context: Context, state: UserState, attr: DencoAttribute): UserState {
  const station = StationManager.getRandomStation(context, 1)[0]
  assert(attr !== "flat")
  station.attr = attr
  const config = {
    offense: {
      state: state,
      carIndex: 0
    },
    defense: undefined,
    station: station
  }
  return startAccess(context, config).offense
}
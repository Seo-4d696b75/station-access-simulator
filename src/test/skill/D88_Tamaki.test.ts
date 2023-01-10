import assert from "assert"
import { times } from "lodash"
import { AccessResult, activateSkill, Context, getSkill, init, UserState } from "../.."
import { hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { initUser } from "../../core/user"
import "../../gen/matcher"
import { testManualSkill } from "../tool/skillState"

describe("たまきのスキル", () => {
  beforeAll(init)

  testManualSkill({
    number: "88",
    name: "tamaki",
    active: 900,
    cooldown: 5400,
  })

  describe("スキル時間延長", () => {


    test.each([1, 3, 5, 10, 20])("%d回延長", (count) => {
      const context = initContext("test", "test", false)
      const start = context.currentTime
      context.clock = start

      let seria = DencoManager.getDenco(context, "1", 80)
      let tamaki = DencoManager.getDenco(context, "88", 50, 1)
      let offense = initUser(context, "とあるマスター", [tamaki, seria])
      offense = activateSkill(context, offense, 0)

      // スキルactive時間延長
      offense = repeatAccess(context, offense, count)

      const skill = getSkill(offense.formation[0])
      assert(skill.transition.state === "active")
      assert(skill.transition.data)
      let data = skill.transition.data
      expect(data.activatedAt).toBe(start)
      expect(data.activeDuration).toBe(900 * 1000) // スキル時間
      // リンクごとに5分延長、最大60分
      expect(data.activeTimeout).toBe(start + Math.min(3600, 900 + count * 300) * 1000)
      expect(data.cooldownDuration).toBe(5400 * 1000)
      // cooldown時間は変化なし
      expect(data.cooldownTimeout).toBe(data.activeTimeout + 5400 * 1000)
    })

    test("最大時間", () => {
      const context = initContext("test", "test", false)
      const start = context.currentTime
      context.clock = start

      let seria = DencoManager.getDenco(context, "1", 80)
      let tamaki = DencoManager.getDenco(context, "88", 50, 1)
      let offense = initUser(context, "とあるマスター", [tamaki, seria])
      offense = activateSkill(context, offense, 0)

      // スキルactive時間を最大まで延長
      offense = repeatAccess(context, offense, 20)
      let skill = getSkill(offense.formation[0])
      assert(skill.transition.state === "active")
      assert(skill.transition.data)
      let data = skill.transition.data
      expect(data.activatedAt).toBe(start)
      expect(data.activeDuration).toBe(900 * 1000)
      expect(data.activeTimeout).toBe(start + 3600 * 1000)
      expect(data.cooldownDuration).toBe(5400 * 1000)
      expect(data.cooldownTimeout).toBe(start + 3600 * 1000 + 5400 * 1000)

      // 10分経過
      const now = start + 600 * 1000
      context.clock = now
      offense = repeatAccess(context, offense, 1)
      skill = getSkill(offense.formation[0])
      assert(skill.transition.state === "active")
      assert(skill.transition.data)
      data = skill.transition.data
      expect(data.activatedAt).toBe(start)
      expect(data.activeDuration).toBe(900 * 1000)
      expect(data.activeTimeout).toBe(now + 3300 * 1000) // 60 - 10 + 5 min
      expect(data.cooldownDuration).toBe(5400 * 1000)
      expect(data.cooldownTimeout).toBe(now + 3300 * 1000 + 5400 * 1000)
    })

    function expectActiveNotExtend(result: AccessResult, start: number) {
      let skill = getSkill(result.offense.formation[0])
      assert(skill.transition.state === "active")
      assert(skill.transition.data)
      let data = skill.transition.data
      expect(data.activeTimeout).toBe(start + 900 * 1000)
      expect(data.cooldownTimeout).toBe(start + 900 * 1000 + 5400 * 1000)
      let events = result.offense.event
      expect(events[events.length - 1].type).not.toBe("skill_trigger")
    }

    function expectActiveExtend(result: AccessResult, start: number) {
      let skill = getSkill(result.offense.formation[0])
      assert(skill.transition.state === "active")
      assert(skill.transition.data)
      let data = skill.transition.data
      expect(data.activeTimeout).toBe(start + (900 + 300) * 1000)
      expect(data.cooldownTimeout).toBe(start + (900 + 300 + 5400) * 1000)
      let events = result.offense.event
      let e = events[events.length - 1]
      assert(e.type === "skill_trigger")
      expect(e.data.carIndex).toBe(0)
      expect(e.data.denco).toMatchDencoState(result.offense.formation[0])
      expect(e.data.step).toBe("self")
      expect(e.data.time).toBe(start)
      expect(e.data.skillName).toBe("エンドレス・ビート Lv.4")
    }

    test("延長なし-自身がリンク成功", () => {
      const context = initContext("test", "test", false)
      const start = context.currentTime
      context.clock = start

      let seria = DencoManager.getDenco(context, "1", 80)
      let tamaki = DencoManager.getDenco(context, "88", 50, 1)
      let offense = initUser(context, "とあるマスター", [tamaki, seria])
      offense = activateSkill(context, offense, 0)
      let reika = DencoManager.getDenco(context, "5", 50, 1)
      reika.currentHp = 1
      let defense = initUser(context, "user", [reika])
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
      expect(result.linkSuccess).toBe(true)
      expectActiveNotExtend(result, start)
    })
    test("延長なし-リンク失敗", () => {
      const context = initContext("test", "test", false)
      const start = context.currentTime
      context.clock = start

      let seria = DencoManager.getDenco(context, "1", 80)
      seria.ap = 1
      let tamaki = DencoManager.getDenco(context, "88", 50, 1)
      let offense = initUser(context, "とあるマスター", [tamaki, seria])
      offense = activateSkill(context, offense, 0)
      let reika = DencoManager.getDenco(context, "5", 50, 1)
      let defense = initUser(context, "user", [reika])
      const config = {
        offense: {
          state: offense,
          carIndex: 1
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: reika.link[0],
      }
      const result = startAccess(context, config)
      expect(result.linkSuccess).toBe(false)
      expectActiveNotExtend(result, start)
    })
    test("延長あり-足湯", () => {
      const context = initContext("test", "test", false)
      const start = context.currentTime
      context.clock = start

      let seria = DencoManager.getDenco(context, "1", 80)
      let tamaki = DencoManager.getDenco(context, "88", 50, 1)
      let offense = initUser(context, "とあるマスター", [tamaki, seria])
      offense = activateSkill(context, offense, 0)
      let reika = DencoManager.getDenco(context, "5", 50, 1)
      let defense = initUser(context, "user", [reika])
      const config = {
        offense: {
          state: offense,
          carIndex: 1
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: reika.link[0],
        usePink: true,
      }
      const result = startAccess(context, config)
      expect(result.linkSuccess).toBe(true)
      expect(result.pinkMode).toBe(true)
      expectActiveExtend(result, start)

    })
    test("延長あり-不在", () => {
      const context = initContext("test", "test", false)
      const start = context.currentTime
      context.clock = start

      let seria = DencoManager.getDenco(context, "1", 80)
      let tamaki = DencoManager.getDenco(context, "88", 50, 1)
      let offense = initUser(context, "とあるマスター", [tamaki, seria])
      offense = activateSkill(context, offense, 0)
      let reika = DencoManager.getDenco(context, "5", 50, 1)
      const config = {
        offense: {
          state: offense,
          carIndex: 1
        },
        defense: undefined,
        station: reika.link[0],
      }
      const result = startAccess(context, config)
      expect(result.linkSuccess).toBe(true)
      expectActiveExtend(result, start)
    })
    test("延長なし-無効化スキル", () => {

      const context = initContext("test", "test", false)
      const start = context.currentTime
      context.clock = start
      context.random.mode = "force"

      let seria = DencoManager.getDenco(context, "1", 80)
      let tamaki = DencoManager.getDenco(context, "88", 50, 1)
      let offense = initUser(context, "とあるマスター", [tamaki, seria])
      offense = activateSkill(context, offense, 0)
      let reika = DencoManager.getDenco(context, "5", 50, 1)
      let susugu = DencoManager.getDenco(context, "EX03", 50)
      reika.currentHp = 1
      let defense = initUser(context, "user", [reika, susugu])
      defense = activateSkill(context, defense, 1)
      const config = {
        offense: {
          state: offense,
          carIndex: 1
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: reika.link[0],
      }
      const result = startAccess(context, config)
      expect(result.linkSuccess).toBe(true)
      expect(hasSkillTriggered(result.defense, susugu)).toBe(true)
      expectActiveNotExtend(result, start)
      let d = result.offense.formation[0]
      expect(d.skillInvalidated).toBe(true)
    })
    test("延長なし-カウンター被弾-リンク失敗", () => {

      const context = initContext("test", "test", false)
      const start = context.currentTime
      context.clock = start

      let seria = DencoManager.getDenco(context, "1", 80)
      let tamaki = DencoManager.getDenco(context, "88", 50, 1)
      tamaki.ap = 1000
      let offense = initUser(context, "とあるマスター", [tamaki, seria])
      offense = activateSkill(context, offense, 0)
      let marika = DencoManager.getDenco(context, "58", 50, 1)
      let defense = initUser(context, "user", [marika])
      defense = activateSkill(context, defense, 0)
      const config = {
        offense: {
          state: offense,
          carIndex: 1
        },
        defense: {
          state: defense,
          carIndex: 0,
        },
        station: marika.link[0],
      }
      const result = startAccess(context, config)
      expect(result.linkSuccess).toBe(false)
      expectActiveNotExtend(result, start)
      let d = result.offense.formation[1]
      expect(d.reboot).toBe(true)
    })
  })

  describe("ATK増加", () => {
    test("発動あり", () => {
      const context = initContext("test", "test", false)
      let seria = DencoManager.getDenco(context, "1", 80)
      let tamaki = DencoManager.getDenco(context, "88", 50, 1)
      let offense = initUser(context, "とあるマスター", [tamaki, seria])
      offense = activateSkill(context, offense, 0)
      let reika = DencoManager.getDenco(context, "5", 50, 1)
      let defense = initUser(context, "user", [reika])
      const config = {
        offense: {
          state: offense,
          carIndex: 1
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: reika.link[0],
      }
      const result = startAccess(context, config)
      expect(hasSkillTriggered(result.offense, tamaki)).toBe(true)
      expect(result.attackPercent).toBe(9)
    })
    test("発動なし - 自身", () => {
      const context = initContext("test", "test", false)
      let seria = DencoManager.getDenco(context, "1", 80)
      let tamaki = DencoManager.getDenco(context, "88", 50, 1)
      let offense = initUser(context, "とあるマスター", [tamaki, seria])
      offense = activateSkill(context, offense, 0)
      let reika = DencoManager.getDenco(context, "5", 50, 1)
      let defense = initUser(context, "user", [reika])
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
      expect(hasSkillTriggered(result.offense, tamaki)).toBe(false)
      expect(result.attackPercent).toBe(0)
    })
  })
})

function repeatAccess(context: Context, state: UserState, count: number): UserState {
  let next = state
  times(count, () => {
    next = extendActive(context, next).offense
  })
  return next
}

function extendActive(context: Context, state: UserState, extend: boolean = true): AccessResult {
  let reika = DencoManager.getDenco(context, "5", 50, 1)
  reika.currentHp = extend ? 1 : Number.MAX_SAFE_INTEGER
  reika.maxHp = Math.max(reika.maxHp, reika.currentHp)
  let defense = initUser(context, "user", [reika])
  assert(state.formation[0].name === "tamaki")
  state.formation[0].currentExp = 0
  state.formation[0].nextExp = Number.MAX_SAFE_INTEGER
  const config = {
    offense: {
      state: state,
      carIndex: 1
    },
    defense: {
      state: defense,
      carIndex: 0
    },
    station: reika.link[0],
  }
  return startAccess(context, config)
}
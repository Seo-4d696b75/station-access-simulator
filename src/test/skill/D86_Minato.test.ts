import assert from "assert"
import { activateSkill, DencoType, init } from "../.."
import { hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { initUser } from "../../core/user"
import { testManualSkill } from "../tool/skillState"

describe("ミナトのスキル", () => {
  beforeAll(init)

  testManualSkill({
    number: "86",
    name: "minato",
    active: 1260,
    cooldown: 11340,
  })

  describe("発動あり", () => {

    test("基本", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let saya = DencoManager.getDenco(context, "8", 80)
      let minato = DencoManager.getDenco(context, "86", 50)
      let offense = initUser(context, "とあるマスター", [saya, minato])
      offense = activateSkill(context, offense, 1)
      let marika = DencoManager.getDenco(context, "58", 50, 1)
      let defense = initUser(context, "とあるマスター２", [marika])
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
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.offense, minato)).toBe(true)
      expect(hasSkillTriggered(result.defense, marika)).toBe(false)
      expect(result.linkSuccess).toBe(true)
      expect(result.linkDisconnected).toBe(true)
      // カウンターなし
      let d = result.offense.formation[0]
      expect(d.reboot).toBe(false)
      expect(d.damage).toBeUndefined()
      // 無効化
      assert(result.defense)
      d = result.defense.formation[0]
      expect(d.skillInvalidated).toBe(true)
    })
    test("自身先頭", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let saya = DencoManager.getDenco(context, "8", 80)
      let minato = DencoManager.getDenco(context, "86", 50)
      let offense = initUser(context, "とあるマスター", [minato, saya])
      offense = activateSkill(context, offense, 0)
      let marika = DencoManager.getDenco(context, "58", 5, 1)
      let defense = initUser(context, "とあるマスター２", [marika])
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
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.offense, minato)).toBe(true)
      expect(hasSkillTriggered(result.defense, marika)).toBe(false)
      assert(result.defense)
      let d = result.defense.formation[0]
      expect(d.skillInvalidated).toBe(true)
    })

    test("確率補正", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let saya = DencoManager.getDenco(context, "8", 80)
      let minato = DencoManager.getDenco(context, "86", 50)
      let hiiru = DencoManager.getDenco(context, "34", 50)
      let offense = initUser(context, "とあるマスター", [saya, minato, hiiru])
      offense = activateSkill(context, offense, 1, 2)
      let marika = DencoManager.getDenco(context, "58", 50, 1)
      let defense = initUser(context, "とあるマスター２", [marika])
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
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.offense, minato)).toBe(true)
      expect(hasSkillTriggered(result.offense, hiiru)).toBe(true)
      expect(hasSkillTriggered(result.defense, marika)).toBe(false)
      expect(result.linkSuccess).toBe(true)
      expect(result.linkDisconnected).toBe(true)
      // 無効化
      assert(result.defense)
      let d = result.defense.formation[0]
      expect(d.skillInvalidated).toBe(true)
    })
    test("確率補正なし Lv.80", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let saya = DencoManager.getDenco(context, "8", 80)
      let minato = DencoManager.getDenco(context, "86", 80)
      let hiiru = DencoManager.getDenco(context, "34", 50)
      let offense = initUser(context, "とあるマスター", [saya, minato, hiiru])
      offense = activateSkill(context, offense, 1, 2)
      let marika = DencoManager.getDenco(context, "58", 50, 1)
      let defense = initUser(context, "とあるマスター２", [marika])
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
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.offense, minato)).toBe(true)
      expect(hasSkillTriggered(result.offense, hiiru)).toBe(false)
      expect(hasSkillTriggered(result.defense, marika)).toBe(false)
      expect(result.linkSuccess).toBe(true)
      expect(result.linkDisconnected).toBe(true)
      // 無効化
      assert(result.defense)
      let d = result.defense.formation[0]
      expect(d.skillInvalidated).toBe(true)
    })

    test("てすと併用", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let saya = DencoManager.getDenco(context, "8", 80)
      let minato = DencoManager.getDenco(context, "86", 50)
      let tesuto = DencoManager.getDenco(context, "EX04", 50)
      let offense = initUser(context, "とあるマスター", [saya, minato, tesuto])
      offense = activateSkill(context, offense, 1, 2)
      let yachiyo = DencoManager.getDenco(context, "27", 50, 1)
      let fubu = DencoManager.getDenco(context, "14", 50)
      let defense = initUser(context, "とあるマスター２", [yachiyo, fubu])
      defense = activateSkill(context, defense, 1)
      const predicate = jest.fn((_) => true)
      offense.user.history = {
        isHomeStation: predicate
      }
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: yachiyo.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      // 同編成内の無効化スキル同士は干渉せず全員発動する
      expect(hasSkillTriggered(result.offense, minato)).toBe(true)
      expect(hasSkillTriggered(result.offense, tesuto)).toBe(true)
      expect(hasSkillTriggered(result.defense, yachiyo)).toBe(false)
      expect(hasSkillTriggered(result.defense, fubu)).toBe(false)
      expect(result.defendPercent).toBe(0)
      // 無効化
      assert(result.defense)
      expect(result.defense.formation[0].skillInvalidated).toBe(true)
      expect(result.defense.formation[1].skillInvalidated).toBe(true)
    })
    test("にころ無効化", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let saya = DencoManager.getDenco(context, "8", 80)
      let minato = DencoManager.getDenco(context, "86", 50)
      let offense = initUser(context, "とあるマスター", [saya, minato])
      offense = activateSkill(context, offense, 1)
      let nikoro = DencoManager.getDenco(context, "20", 50, 1)
      let fubu = DencoManager.getDenco(context, "14", 50)
      let defense = initUser(context, "とあるマスター２", [nikoro, fubu])
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: nikoro.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(result.linkDisconnected).toBe(true)
      expect(hasSkillTriggered(result.offense, minato)).toBe(true)
      expect(hasSkillTriggered(result.defense, nikoro)).toBe(false)
      // 無効化
      assert(result.defense)
      expect(result.defense.formation[0].skillInvalidated).toBe(true)
      // アクセス直後に発動するスキルも無効化される
      // 経験値配布なし
      expect(result.defense.event.length).toBe(2)
      expect(result.defense.event[0].type).toBe("access")
      expect(result.defense.event[1].type).toBe("reboot")
    })
  })
  describe("発動なし", () => {

    test("確率", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "ignore"
      let saya = DencoManager.getDenco(context, "8", 80)
      let minato = DencoManager.getDenco(context, "86", 50)
      let hiiru = DencoManager.getDenco(context, "34", 50)
      let offense = initUser(context, "とあるマスター", [saya, minato, hiiru])
      offense = activateSkill(context, offense, 1, 2)
      let marika = DencoManager.getDenco(context, "58", 50, 1)
      let defense = initUser(context, "とあるマスター２", [marika])
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
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.offense, minato)).toBe(false)
      expect(hasSkillTriggered(result.offense, hiiru)).toBe(true)
      expect(hasSkillTriggered(result.defense, marika)).toBe(true)
      expect(result.linkSuccess).toBe(false)
      expect(result.linkDisconnected).toBe(true)
      // カウンターあり
      let d = result.offense.formation[0]
      expect(d.reboot).toBe(true)
      expect(d.damage).not.toBeUndefined()
    })
    test("先頭以外", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let saya = DencoManager.getDenco(context, "8", 80)
      let minato = DencoManager.getDenco(context, "86", 50)
      let offense = initUser(context, "とあるマスター", [minato, saya])
      offense = activateSkill(context, offense, 0)
      let marika = DencoManager.getDenco(context, "58", 50, 1)
      let defense = initUser(context, "とあるマスター２", [marika])
      defense = activateSkill(context, defense, 0)
      const config = {
        offense: {
          state: offense,
          carIndex: 1
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: marika.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.offense, minato)).toBe(false)
      expect(hasSkillTriggered(result.defense, marika)).toBe(true)
      expect(result.linkSuccess).toBe(false)
      expect(result.linkDisconnected).toBe(true)
      // カウンターあり
      let d = result.offense.formation[1]
      expect(d.reboot).toBe(true)
      expect(d.damage).not.toBeUndefined()
    })
    test("足湯", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let saya = DencoManager.getDenco(context, "8", 80)
      let minato = DencoManager.getDenco(context, "86", 50)
      let offense = initUser(context, "とあるマスター", [saya, minato])
      offense = activateSkill(context, offense, 1)
      let marika = DencoManager.getDenco(context, "58", 50, 1)
      let defense = initUser(context, "とあるマスター２", [marika])
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
        usePink: true,
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.offense, minato)).toBe(false)
      expect(hasSkillTriggered(result.defense, marika)).toBe(false)
      expect(result.linkSuccess).toBe(true)
      expect(result.linkDisconnected).toBe(true)
    })
    test.each(["supporter", "defender", "attacker"])("trickster以外: %s", (type) => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let saya = DencoManager.getDenco(context, "8", 80)
      let minato = DencoManager.getDenco(context, "86", 50)
      let offense = initUser(context, "とあるマスター", [saya, minato])
      offense = activateSkill(context, offense, 1)
      let marika = DencoManager.getDenco(context, "58", 50, 1)
      marika.type = type as DencoType
      let defense = initUser(context, "とあるマスター２", [marika])
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
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.offense, minato)).toBe(false)
      expect(hasSkillTriggered(result.defense, marika)).toBe(true)
      expect(result.linkSuccess).toBe(false)
      expect(result.linkDisconnected).toBe(true)
    })
  })
})
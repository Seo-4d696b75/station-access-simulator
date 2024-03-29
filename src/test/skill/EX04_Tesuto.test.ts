import { dayjs, init } from "../.."
import { getSkillTrigger, hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { activateSkill } from "../../core/skill"
import { initUser } from "../../core/user"
import "../../gen/matcher"
import { testManualSkill } from "../tool/skillState"

describe("てすとのスキル", () => {
  beforeAll(init)

  testManualSkill({
    number: "EX04",
    name: "tesuto",
    active: 1080,
    cooldown: 15120,
  })

  describe("発動あり", () => {

    test("基本", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      context.clock = dayjs("2022-01-01T23:00:00+0900").valueOf()
      let hokone = DencoManager.getDenco(context, "26", 50)
      let tesuto = DencoManager.getDenco(context, "EX04", 50)
      let luna = DencoManager.getDenco(context, "3", 80, 1)
      let fubu = DencoManager.getDenco(context, "14", 50)
      let mio = DencoManager.getDenco(context, "36", 50)
      let offense = initUser(context, "とあるマスター", [hokone, tesuto])
      offense = activateSkill(context, offense, 0, 1)
      let defense = initUser(context, "とあるマスター２", [luna, fubu, mio])
      defense = activateSkill(context, defense, 1, 2)
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: luna.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "offense", tesuto)).toBe(true)
      expect(hasSkillTriggered(result, "offense", hokone)).toBe(false)
      expect(hasSkillTriggered(result, "defense", luna)).toBe(false)
      expect(hasSkillTriggered(result, "defense", fubu)).toBe(false)
      expect(hasSkillTriggered(result, "defense", mio)).toBe(false)
      // 無効化
      let t = getSkillTrigger(result, "offense", hokone)[0]
      expect(t.skillName).toBe("妹愛バースト Lv.4")
      expect(t.invalidated).toBe(true)
      t = getSkillTrigger(result, "defense", luna)[0]
      expect(t.skillName).toBe("ナイトエクスプレス")
      expect(t.invalidated).toBe(true)
      t = getSkillTrigger(result, "defense", fubu)[0]
      expect(t.skillName).toBe("根性入れてやるかー Lv.4")
      expect(t.invalidated).toBe(true)
      t = getSkillTrigger(result, "defense", mio)[0]
      expect(t.skillName).toBe("スタンドイン Lv.4")
      expect(t.invalidated).toBe(true)
    })

    test("同編成内の無効化スキルは全部発動する", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      context.clock = dayjs("2022-01-01T12:00:00+0900").valueOf()
      let saya = DencoManager.getDenco(context, "8", 50)
      let mahiru = DencoManager.getDenco(context, "EX02", 50)
      let susugu = DencoManager.getDenco(context, "EX03", 50)
      let tesuto = DencoManager.getDenco(context, "EX04", 50)
      let rara = DencoManager.getDenco(context, "56", 80, 1)
      let fubu = DencoManager.getDenco(context, "14", 50)
      let mizuho = DencoManager.getDenco(context, "57", 50)
      let offense = initUser(context, "とあるマスター", [saya, mahiru, susugu, tesuto])
      offense = activateSkill(context, offense, 1, 2, 3)
      let defense = initUser(context, "とあるマスター２", [rara, fubu, mizuho])
      defense = activateSkill(context, defense, 1, 2)
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: rara.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      // 同編成内の無効化スキルが互いに無効化してもすでに発動済み
      expect(hasSkillTriggered(result, "offense", mahiru)).toBe(true)
      expect(hasSkillTriggered(result, "offense", susugu)).toBe(true)
      expect(hasSkillTriggered(result, "offense", tesuto)).toBe(true)
      expect(hasSkillTriggered(result, "defense", rara)).toBe(false)
      expect(hasSkillTriggered(result, "defense", fubu)).toBe(false)
      expect(hasSkillTriggered(result, "defense", mizuho)).toBe(false)
      // 無効化
      let t = getSkillTrigger(result, "defense", rara)[0]
      expect(t.skillName).toBe("ウチの本気見せたるわ♪")
      expect(t.invalidated).toBe(true)
      t = getSkillTrigger(result, "defense", fubu)[0]
      expect(t.skillName).toBe("根性入れてやるかー Lv.4")
      expect(t.invalidated).toBe(true)
      t = getSkillTrigger(result, "defense", mizuho)[0]
      expect(t.skillName).toBe("風のように水のように Lv.4")
      expect(t.invalidated).toBe(true)
    })
  })

  describe("発動なし", () => {

    test("足湯", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      context.clock = dayjs("2022-01-01T23:00:00+0900").valueOf()
      let hokone = DencoManager.getDenco(context, "26", 50)
      let tesuto = DencoManager.getDenco(context, "EX04", 50)
      let luna = DencoManager.getDenco(context, "3", 80, 1)
      let offense = initUser(context, "とあるマスター", [hokone, tesuto])
      offense = activateSkill(context, offense, 0, 1)
      let defense = initUser(context, "とあるマスター２", [luna])
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: luna.link[0],
        usePink: true,
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "offense", tesuto)).toBe(false)
      expect(hasSkillTriggered(result, "offense", hokone)).toBe(false)
      expect(hasSkillTriggered(result, "defense", luna)).toBe(false)
    })
    test("相手不在", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      context.clock = dayjs("2022-01-01T23:00:00+0900").valueOf()
      let hokone = DencoManager.getDenco(context, "26", 50)
      let tesuto = DencoManager.getDenco(context, "EX04", 50)
      let luna = DencoManager.getDenco(context, "3", 80, 1)
      let offense = initUser(context, "とあるマスター", [hokone, tesuto])
      offense = activateSkill(context, offense, 0, 1)
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: undefined,
        station: luna.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).toBeUndefined()
      expect(hasSkillTriggered(result, "offense", tesuto)).toBe(false)
      expect(hasSkillTriggered(result, "offense", hokone)).toBe(false)
    })
  })
})
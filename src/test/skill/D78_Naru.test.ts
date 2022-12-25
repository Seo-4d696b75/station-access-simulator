import { init } from "../.."
import { getAccessDenco, hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { activateSkill } from "../../core/skill"
import { initUser } from "../../core/user"
import { testManualSkill } from "../tool/skillState"

describe("なるのスキル", () => {
  beforeAll(init)

  testManualSkill({
    number: "78",
    name: "naru",
    active: 3600,
    cooldown: 10800,
  })

  describe("スコアUP", () => {

    test("リンク失敗", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let seria = DencoManager.getDenco(context, "1", 50)
      let naru = DencoManager.getDenco(context, "78", 50)
      let charlotte = DencoManager.getDenco(context, "6", 80, 1)
      let offense = initUser(context, "とあるマスター", [naru, seria])
      offense = activateSkill(context, offense, 0)
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
      expect(result.linkSuccess).toBe(false)
      expect(hasSkillTriggered(result.offense, naru)).toBe(true)
      expect(result.attackPercent).toBe(0)
      expect(result.offense.scorePercent.access).toBe(750)
      expect(result.offense.scorePercent.link).toBe(0)
      let d = getAccessDenco(result, "offense")
      let damage = getAccessDenco(result, "defense").damage!.value
      // 経験値は不変
      expect(d.exp.access.accessBonus).toBe(100)
      expect(d.exp.access.linkBonus).toBe(0)
      expect(d.exp.access.damageBonus).toBe(damage)
      expect(d.exp.skill).toBe(0)
      expect(d.exp.link).toBe(0)
      // スコア増加 +750%
      expect(result.offense.score.access.accessBonus).toBe(850)
      expect(result.offense.score.access.linkBonus).toBe(0)
      expect(result.offense.score.access.damageBonus).toBe(Math.floor(damage * 8.5))
      expect(result.offense.score.link).toBe(0)
      expect(result.offense.score.skill).toBe(0)
    })
    test("リンク成功", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let seria = DencoManager.getDenco(context, "1", 50)
      let naru = DencoManager.getDenco(context, "78", 50)
      let charlotte = DencoManager.getDenco(context, "6", 10, 1)
      let offense = initUser(context, "とあるマスター", [naru, seria])
      offense = activateSkill(context, offense, 0)
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
      expect(result.linkSuccess).toBe(true)
      expect(hasSkillTriggered(result.offense, naru)).toBe(true)
      expect(result.attackPercent).toBe(0)
      expect(result.offense.scorePercent.access).toBe(750)
      expect(result.offense.scorePercent.link).toBe(0)
      let d = getAccessDenco(result, "offense")
      let damage = getAccessDenco(result, "defense").damage!.value
      // 経験値は不変
      expect(d.exp.access.accessBonus).toBe(100)
      expect(d.exp.access.linkBonus).toBe(100)
      expect(d.exp.access.damageBonus).toBe(damage)
      expect(d.exp.skill).toBe(0)
      expect(d.exp.link).toBe(0)
      // スコア増加 +750%
      expect(result.offense.score.access.accessBonus).toBe(850)
      expect(result.offense.score.access.linkBonus).toBe(850)
      expect(result.offense.score.access.damageBonus).toBe(Math.floor(damage * 8.5))
      expect(result.offense.score.link).toBe(0)
      expect(result.offense.score.skill).toBe(0)
    })
    test("足湯", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let seria = DencoManager.getDenco(context, "1", 50)
      let naru = DencoManager.getDenco(context, "78", 50)
      let charlotte = DencoManager.getDenco(context, "6", 80, 1)
      let offense = initUser(context, "とあるマスター", [naru, seria])
      offense = activateSkill(context, offense, 0)
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
        usePink: true,
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(result.linkSuccess).toBe(true)
      expect(hasSkillTriggered(result.offense, naru)).toBe(true)
      expect(result.attackPercent).toBe(0)
      expect(result.offense.scorePercent.access).toBe(750)
      expect(result.offense.scorePercent.link).toBe(0)
      let d = getAccessDenco(result, "defense")
      expect(d.reboot).toBe(false)
      expect(d.damage).toBeUndefined()
      d = getAccessDenco(result, "offense")
      // 経験値は不変
      expect(d.exp.access.accessBonus).toBe(100)
      expect(d.exp.access.linkBonus).toBe(100)
      expect(d.exp.access.damageBonus).toBe(0)
      expect(d.exp.skill).toBe(0)
      expect(d.exp.link).toBe(0)
      // スコア増加 +750%
      expect(result.offense.score.access.accessBonus).toBe(850)
      expect(result.offense.score.access.linkBonus).toBe(850)
      expect(result.offense.score.access.damageBonus).toBe(0)
      expect(result.offense.score.link).toBe(0)
      expect(result.offense.score.skill).toBe(0)
    })
    test("相手不在", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let seria = DencoManager.getDenco(context, "1", 50)
      let naru = DencoManager.getDenco(context, "78", 50)
      let charlotte = DencoManager.getDenco(context, "6", 80, 1)
      let offense = initUser(context, "とあるマスター", [naru, seria])
      offense = activateSkill(context, offense, 0)
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: undefined,
        station: charlotte.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).toBeUndefined()
      expect(result.linkSuccess).toBe(true)
      expect(hasSkillTriggered(result.offense, naru)).toBe(true)
      expect(result.attackPercent).toBe(0)
      expect(result.offense.scorePercent.access).toBe(750)
      expect(result.offense.scorePercent.link).toBe(0)
      let d = getAccessDenco(result, "offense")
      // 経験値は不変
      expect(d.exp.access.accessBonus).toBe(100)
      expect(d.exp.access.linkBonus).toBe(100)
      expect(d.exp.access.damageBonus).toBe(0)
      expect(d.exp.skill).toBe(0)
      expect(d.exp.link).toBe(0)
      // スコア増加 +750%
      expect(result.offense.score.access.accessBonus).toBe(850)
      expect(result.offense.score.access.linkBonus).toBe(850)
      expect(result.offense.score.access.damageBonus).toBe(0)
      expect(result.offense.score.link).toBe(0)
      expect(result.offense.score.skill).toBe(0)
    })

    test("確率リブートあり", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let seria = DencoManager.getDenco(context, "1", 50)
      let naru = DencoManager.getDenco(context, "78", 50)
      let hiiru = DencoManager.getDenco(context, "34", 50)
      let charlotte = DencoManager.getDenco(context, "6", 80, 1)
      let offense = initUser(context, "とあるマスター", [naru, hiiru, seria])
      offense = activateSkill(context, offense, 0, 1)
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
      expect(result.linkSuccess).toBe(false)
      expect(hasSkillTriggered(result.offense, naru)).toBe(true)
      expect(hasSkillTriggered(result.offense, hiiru)).toBe(true)
      expect(result.attackPercent).toBe(0)
      expect(result.offense.scorePercent.access).toBe(750)
      expect(result.offense.scorePercent.link).toBe(0)
    })
    test("カウンターでリブート", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let seria = DencoManager.getDenco(context, "1", 50)
      let naru = DencoManager.getDenco(context, "78", 50, 1)
      let sheena = DencoManager.getDenco(context, "7", 80, 1)
      let offense = initUser(context, "とあるマスター", [naru, seria])
      offense = activateSkill(context, offense, 0)
      let defense = initUser(context, "とあるマスター２", [sheena])
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: sheena.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(result.linkSuccess).toBe(false)
      expect(hasSkillTriggered(result.offense, naru)).toBe(true)
      expect(hasSkillTriggered(result.defense, sheena)).toBe(true)
      expect(result.attackPercent).toBe(0)
      expect(result.offense.scorePercent.access).toBe(750)
      expect(result.offense.scorePercent.link).toBe(0)
      let d = getAccessDenco(result, "defense")
      expect(d.reboot).toBe(false)
      let damage = d.damage!.value
      d = getAccessDenco(result, "offense")
      expect(d.reboot).toBe(true)
      // 経験値は不変
      expect(d.exp.access.accessBonus).toBe(100)
      expect(d.exp.access.linkBonus).toBe(0)
      expect(d.exp.access.damageBonus).toBe(damage)
      expect(d.exp.skill).toBe(0)
      expect(d.exp.link).toBeGreaterThan(0)
      // スコア増加 +750%
      expect(result.offense.score.access.accessBonus).toBe(850)
      expect(result.offense.score.access.linkBonus).toBe(0)
      expect(result.offense.score.access.damageBonus).toBe(Math.floor(damage * 8.5))
      expect(result.offense.score.skill).toBe(0)
      // リンクスコアは対象外
      expect(result.offense.score.link).toBe(d.exp.link)
    })
  })

  describe("スコアDown&ATK増加", () => {

    test("相手あり", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "ignore"
      let seria = DencoManager.getDenco(context, "1", 50)
      let naru = DencoManager.getDenco(context, "78", 50)
      let charlotte = DencoManager.getDenco(context, "6", 80, 1)
      let offense = initUser(context, "とあるマスター", [naru, seria])
      offense = activateSkill(context, offense, 0)
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
      expect(hasSkillTriggered(result.offense, naru)).toBe(true)
      expect(result.attackPercent).toBe(5)
      expect(result.offense.scorePercent.access).toBe(-50)
      expect(result.offense.scorePercent.link).toBe(0)
      let d = getAccessDenco(result, "offense")
      // 経験値は不変
      expect(d.exp.access.accessBonus).toBe(100)
      expect(d.exp.access.linkBonus).toBe(0)
      expect(d.exp.access.damageBonus).toBeGreaterThan(0)
      expect(d.exp.skill).toBe(0)
      expect(d.exp.link).toBe(0)
      // スコア増加 -50%
      expect(result.offense.score.access.accessBonus).toBe(50)
      expect(result.offense.score.access.linkBonus).toBe(0)
      expect(result.offense.score.access.damageBonus).toBe(Math.floor(d.exp.access.damageBonus * 0.5))
      expect(result.offense.score.link).toBe(0)
      expect(result.offense.score.skill).toBe(0)
    })
    test("確率ブーストあり", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "ignore"
      let seria = DencoManager.getDenco(context, "1", 50)
      let naru = DencoManager.getDenco(context, "78", 50)
      let hiiru = DencoManager.getDenco(context, "34", 50)
      let charlotte = DencoManager.getDenco(context, "6", 80, 1)
      let offense = initUser(context, "とあるマスター", [naru, hiiru, seria])
      offense = activateSkill(context, offense, 0, 1)
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
      expect(hasSkillTriggered(result.offense, naru)).toBe(true)
      expect(hasSkillTriggered(result.offense, hiiru)).toBe(true)
      expect(result.attackPercent).toBe(5)
      expect(result.offense.scorePercent.access).toBe(-50)
      expect(result.offense.scorePercent.link).toBe(0)
      let d = getAccessDenco(result, "offense")
      // 経験値は不変
      expect(d.exp.access.accessBonus).toBe(100)
      expect(d.exp.access.linkBonus).toBe(0)
      expect(d.exp.access.damageBonus).toBeGreaterThan(0)
      expect(d.exp.skill).toBe(0)
      expect(d.exp.link).toBe(0)
      // スコア増加 -50%
      expect(result.offense.score.access.accessBonus).toBe(50)
      expect(result.offense.score.access.linkBonus).toBe(0)
      expect(result.offense.score.access.damageBonus).toBe(Math.floor(d.exp.access.damageBonus * 0.5))
      expect(result.offense.score.link).toBe(0)
      expect(result.offense.score.skill).toBe(0)
    })

    test("足湯", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "ignore"
      let seria = DencoManager.getDenco(context, "1", 50)
      let naru = DencoManager.getDenco(context, "78", 50)
      let charlotte = DencoManager.getDenco(context, "6", 80, 1)
      let offense = initUser(context, "とあるマスター", [naru, seria])
      offense = activateSkill(context, offense, 0)
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
        usePink: true,
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.offense, naru)).toBe(true)
      expect(result.attackPercent).toBe(5)
      expect(result.offense.scorePercent.access).toBe(-50)
      expect(result.offense.scorePercent.link).toBe(0)
      let d = getAccessDenco(result, "offense")
      // 経験値は不変
      expect(d.exp.access.accessBonus).toBe(100)
      expect(d.exp.access.linkBonus).toBe(100)
      expect(d.exp.access.damageBonus).toBe(0)
      expect(d.exp.skill).toBe(0)
      expect(d.exp.link).toBe(0)
      // スコア増加 -50%
      expect(result.offense.score.access.accessBonus).toBe(50)
      expect(result.offense.score.access.linkBonus).toBe(50)
      expect(result.offense.score.access.damageBonus).toBe(0)
      expect(result.offense.score.link).toBe(0)
      expect(result.offense.score.skill).toBe(0)
    })
    test("相手不在", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "ignore"
      let seria = DencoManager.getDenco(context, "1", 50)
      let naru = DencoManager.getDenco(context, "78", 50)
      let charlotte = DencoManager.getDenco(context, "6", 80, 1)
      let offense = initUser(context, "とあるマスター", [naru, seria])
      offense = activateSkill(context, offense, 0)
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: undefined,
        station: charlotte.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).toBeUndefined()
      expect(hasSkillTriggered(result.offense, naru)).toBe(true)
      expect(result.attackPercent).toBe(5)
      expect(result.offense.scorePercent.access).toBe(-50)
      expect(result.offense.scorePercent.link).toBe(0)
      let d = getAccessDenco(result, "offense")
      // 経験値は不変
      expect(d.exp.access.accessBonus).toBe(100)
      expect(d.exp.access.linkBonus).toBe(100)
      expect(d.exp.access.damageBonus).toBe(0)
      expect(d.exp.skill).toBe(0)
      expect(d.exp.link).toBe(0)
      // スコア増加 -50%
      expect(result.offense.score.access.accessBonus).toBe(50)
      expect(result.offense.score.access.linkBonus).toBe(50)
      expect(result.offense.score.access.damageBonus).toBe(0)
      expect(result.offense.score.link).toBe(0)
      expect(result.offense.score.skill).toBe(0)
    })
  })

  // TODO てすとによる無効化の影響
})
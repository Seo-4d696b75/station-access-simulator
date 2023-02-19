import { activateSkill, init } from "../.."
import { hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { initUser } from "../../core/user"
import { testManualSkill } from "../tool/skillState"


describe("ヒメギのスキル", () => {
  beforeAll(init)

  testManualSkill({
    number: "51",
    name: "himegi",
    active: 1800,
    cooldown: 14400,
  })

  describe("DEF増加", () => {

    test.each([1, 2, 3, 4, 5, 6])("発動あり-守備側(編成内)-ディフェンダーx%d", (cnt) => {
      const context = initContext("test", "test", false)
      let beatrice = DencoManager.getDenco(context, "24", 50, 1)
      let siira = DencoManager.getDenco(context, "11", 50)
      let izuna = DencoManager.getDenco(context, "13", 50)
      let iori = DencoManager.getDenco(context, "35", 50)
      let mei = DencoManager.getDenco(context, "49", 50)
      let naho = DencoManager.getDenco(context, "50", 50)
      let himegi = DencoManager.getDenco(context, "51", 50)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      let defenders = [beatrice, siira, izuna, iori, mei, naho].slice(0, cnt)
      let defense = initUser(context, "とあるマスター", [...defenders, himegi])
      defense = activateSkill(context, defense, cnt)
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
        station: beatrice.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "defense", himegi)).toBe(true)
      expect(result.defendPercent).toBe(3 * cnt)
    })

    test("発動あり-守備側(被アクセス)", () => {
      const context = initContext("test", "test", false)
      let beatrice = DencoManager.getDenco(context, "24", 50)
      let izuna = DencoManager.getDenco(context, "13", 50)
      let himegi = DencoManager.getDenco(context, "51", 50, 1)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      let defense = initUser(context, "とあるマスター", [himegi, izuna, beatrice])
      defense = activateSkill(context, defense, 0)
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
        station: himegi.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "defense", himegi)).toBe(true)
      expect(result.defendPercent).toBe(6)
    })

    test("発動なし-守備側(編成内)-非アクティブ", () => {
      const context = initContext("test", "test", false)
      let beatrice = DencoManager.getDenco(context, "24", 50, 1)
      let himegi = DencoManager.getDenco(context, "51", 50)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      let defense = initUser(context, "とあるマスター", [beatrice, himegi])
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
        station: beatrice.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "defense", himegi)).toBe(false)
      expect(result.defendPercent).toBe(0)
    })
    test("発動なし-守備側(編成内)-ディフェンダー不在", () => {
      const context = initContext("test", "test", false)
      let saya = DencoManager.getDenco(context, "8", 50, 1)
      let himegi = DencoManager.getDenco(context, "51", 50)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      let defense = initUser(context, "とあるマスター", [saya, himegi])
      defense = activateSkill(context, defense, 1)
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
        station: saya.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "defense", himegi)).toBe(false)
      expect(result.defendPercent).toBe(0)
    })
    test("発動なし-攻撃側(編成内)", () => {
      const context = initContext("test", "test", false)
      let izuna = DencoManager.getDenco(context, "13", 50)
      let himegi = DencoManager.getDenco(context, "51", 50)
      let charlotte = DencoManager.getDenco(context, "6", 50, 1)
      let offense = initUser(context, "とあるマスター", [izuna, himegi])
      offense = activateSkill(context, offense, 1)
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
      expect(hasSkillTriggered(result, "offense", himegi)).toBe(false)
      expect(result.defendPercent).toBe(0)
    })
  })

  describe("ATK増加", () => {

    test.each([1, 2, 3, 4, 5, 6])("発動あり-攻撃側(編成内)-アタッカーx%d", (cnt) => {
      const context = initContext("test", "test", false)
      let saya = DencoManager.getDenco(context, "8", 50)
      let imura = DencoManager.getDenco(context, "19", 50)
      let ren = DencoManager.getDenco(context, "22", 50)
      let hokone = DencoManager.getDenco(context, "26", 50)
      let riona = DencoManager.getDenco(context, "28", 50)
      let sora = DencoManager.getDenco(context, "42", 50)
      let himegi = DencoManager.getDenco(context, "51", 50)
      let charlotte = DencoManager.getDenco(context, "6", 50, 1)
      let attackers = [saya, imura, ren, hokone, riona, sora].slice(0, cnt)
      let offense = initUser(context, "とあるマスター", [...attackers, himegi])
      offense = activateSkill(context, offense, cnt)
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
      expect(hasSkillTriggered(result, "offense", himegi)).toBe(true)
      expect(result.attackPercent).toBe(3 * cnt)
    })
    test("発動あり-攻撃側(アクセス)-アタッカーx1", () => {
      const context = initContext("test", "test", false)
      let saya = DencoManager.getDenco(context, "8", 50)
      let himegi = DencoManager.getDenco(context, "51", 50)
      let charlotte = DencoManager.getDenco(context, "6", 50, 1)
      let offense = initUser(context, "とあるマスター", [himegi, saya])
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
      expect(hasSkillTriggered(result, "offense", himegi)).toBe(true)
      expect(result.attackPercent).toBe(3)
    })
    test("発動なし-攻撃側(アクセス)-アタッカー不在", () => {
      const context = initContext("test", "test", false)
      let izuna = DencoManager.getDenco(context, "13", 50)
      let himegi = DencoManager.getDenco(context, "51", 50)
      let charlotte = DencoManager.getDenco(context, "6", 50, 1)
      let offense = initUser(context, "とあるマスター", [himegi, izuna])
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
      expect(hasSkillTriggered(result, "offense", himegi)).toBe(false)
      expect(result.attackPercent).toBe(0)
    })
    test("発動なし-守備側(編成内)", () => {
      const context = initContext("test", "test", false)
      let saya = DencoManager.getDenco(context, "8", 50)
      let himegi = DencoManager.getDenco(context, "51", 50)
      let charlotte = DencoManager.getDenco(context, "6", 50, 1)
      let defense = initUser(context, "とあるマスター", [charlotte, himegi])
      defense = activateSkill(context, defense, 1)
      let offense = initUser(context, "とあるマスター２", [saya])
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
      expect(hasSkillTriggered(result, "defense", himegi)).toBe(false)
      expect(result.attackPercent).toBe(0)
    })
  })
})
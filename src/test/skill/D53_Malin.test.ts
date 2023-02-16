import { activateSkill, init } from "../.."
import { getSkillTrigger, hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { initUser } from "../../core/user"
import { testAlwaysSkill } from "../tool/skillState"

describe("マリンのスキル", () => {
  beforeAll(init)

  testAlwaysSkill({
    number: "53",
    name: "malin",
  })
  describe("ATK増加", () => {

    test.each([1, 2, 3, 4, 5, 6])("発動あり-攻撃側(アクセス)-アタッカーx3", (cnt) => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let saya = DencoManager.getDenco(context, "8", 50)
      let imura = DencoManager.getDenco(context, "19", 50)
      let ren = DencoManager.getDenco(context, "22", 50)
      let hokone = DencoManager.getDenco(context, "26", 50)
      let riona = DencoManager.getDenco(context, "28", 50)
      let sora = DencoManager.getDenco(context, "42", 50)
      let malin = DencoManager.getDenco(context, "53", 50)
      let charlotte = DencoManager.getDenco(context, "6", 50, 1)
      let offense = initUser(context, "とあるマスター", [malin, saya, imura, ren, hokone, riona, sora].slice(0, cnt + 1))
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
      expect(hasSkillTriggered(result, "offense", malin)).toBe(true)
      expect(result.attackPercent).toBe(10 * cnt)
    })
    test("発動あり-攻撃側(アクセス)-確率ブースト", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let saya = DencoManager.getDenco(context, "8", 50)
      let hiiru = DencoManager.getDenco(context, "34", 50)
      let malin = DencoManager.getDenco(context, "53", 50)
      let charlotte = DencoManager.getDenco(context, "6", 50, 1)
      let offense = initUser(context, "とあるマスター", [malin, saya, hiiru])
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
      expect(hasSkillTriggered(result, "offense", malin)).toBe(true)
      expect(hasSkillTriggered(result, "offense", hiiru)).toBe(true)
      const t = getSkillTrigger(result, "offense", malin)[0]
      expect(t.skillName).toBe("唯我独尊 Lv.4")
      expect(t.probability).toBe(25)
      expect(t.boostedProbability).toBe(25 * 1.2)
      expect(t.canTrigger).toBe(true)
      expect(t.triggered).toBe(true)
      expect(result.attackPercent).toBe(10)
    })
    test("発動なし-攻撃側(アクセス)-確率", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "ignore"
      let saya = DencoManager.getDenco(context, "8", 50)
      let hiiru = DencoManager.getDenco(context, "34", 50)
      let malin = DencoManager.getDenco(context, "53", 50)
      let charlotte = DencoManager.getDenco(context, "6", 50, 1)
      let offense = initUser(context, "とあるマスター", [malin, saya, hiiru])
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
      expect(hasSkillTriggered(result, "offense", malin)).toBe(false)
      expect(hasSkillTriggered(result, "offense", hiiru)).toBe(true)
      const t = getSkillTrigger(result, "offense", malin)[0]
      expect(t.skillName).toBe("唯我独尊 Lv.4")
      expect(t.probability).toBe(25)
      expect(t.boostedProbability).toBe(25 * 1.2)
      expect(t.canTrigger).toBe(false)
      expect(t.triggered).toBe(false)
      expect(result.attackPercent).toBe(0)
    })
    test("発動なし-攻撃側(アクセス)-アタッカー不在", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let luna = DencoManager.getDenco(context, "3", 50)
      let izuna = DencoManager.getDenco(context, "13", 50)
      let malin = DencoManager.getDenco(context, "53", 50)
      let charlotte = DencoManager.getDenco(context, "6", 50, 1)
      let offense = initUser(context, "とあるマスター", [malin, luna, izuna])
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
      expect(hasSkillTriggered(result, "offense", malin)).toBe(false)
      expect(result.attackPercent).toBe(0)
    })
    test("発動なし-攻撃側(編成内)", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let saya = DencoManager.getDenco(context, "8", 50)
      let ringo = DencoManager.getDenco(context, "15", 50)
      let malin = DencoManager.getDenco(context, "53", 50)
      let charlotte = DencoManager.getDenco(context, "6", 50, 1)
      let offense = initUser(context, "とあるマスター", [malin, saya, ringo])
      let defense = initUser(context, "とあるマスター２", [charlotte])
      const config = {
        offense: {
          state: offense,
          carIndex: 1
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: charlotte.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "offense", malin)).toBe(false)
      expect(result.attackPercent).toBe(0)
    })
    test("発動なし-守備側(被アクセス)", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let saya = DencoManager.getDenco(context, "8", 50)
      let ringo = DencoManager.getDenco(context, "15", 50)
      let malin = DencoManager.getDenco(context, "53", 50, 1)
      let offense = initUser(context, "とあるマスター", [saya, ringo])
      let defense = initUser(context, "とあるマスター２", [malin])
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: malin.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "defense", malin)).toBe(false)
      expect(result.attackPercent).toBe(0)
    })

    test("発動なし-エリア無効化", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let saya = DencoManager.getDenco(context, "8", 50)
      let imura = DencoManager.getDenco(context, "19", 50)
      let malin = DencoManager.getDenco(context, "53", 50)
      let eria = DencoManager.getDenco(context, "33", 50, 1)
      let offense = initUser(context, "とあるマスター", [malin, saya, imura])
      let defense = initUser(context, "とあるマスター２", [eria])
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
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "offense", malin)).toBe(false)
      expect(hasSkillTriggered(result, "defense", eria)).toBe(true)
      expect(result.attackPercent).toBe(0)

      let t = getSkillTrigger(result, "offense", malin)[0]
      expect(t.skillName).toBe("唯我独尊 Lv.4")
      expect(t.probability).toBe(25)
      expect(t.invalidated).toBe(true)
      expect(t.canTrigger).toBe(false)
      expect(t.triggered).toBe(false)
    })
  })
  describe("DEF増加", () => {
    test.each([1, 2, 3, 4, 5, 6])("発動あり-守備側(被アクセス)-ディフェンダーx%d", (cnt) => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let beatrice = DencoManager.getDenco(context, "24", 50, 1)
      let siira = DencoManager.getDenco(context, "11", 50)
      let izuna = DencoManager.getDenco(context, "13", 50)
      let iori = DencoManager.getDenco(context, "35", 50)
      let mei = DencoManager.getDenco(context, "49", 50)
      let naho = DencoManager.getDenco(context, "50", 50)
      let malin = DencoManager.getDenco(context, "53", 50, 1)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      let offense = initUser(context, "とあるマスター", [charlotte])
      let defense = initUser(context, "とあるマスター２", [malin, beatrice, siira, izuna, iori, mei, naho].slice(0, cnt + 1))
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: malin.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "defense", malin)).toBe(true)
      expect(result.defendPercent).toBe(10 * cnt)
    })
    test("発動あり-守備側(被アクセス)-確率ブースト", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let hiiru = DencoManager.getDenco(context, "34", 50)
      let izuna = DencoManager.getDenco(context, "13", 50)
      let malin = DencoManager.getDenco(context, "53", 50, 1)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      let offense = initUser(context, "とあるマスター", [charlotte])
      let defense = initUser(context, "とあるマスター２", [malin, hiiru, izuna])
      defense = activateSkill(context, defense, 1)
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: malin.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "defense", malin)).toBe(true)
      expect(hasSkillTriggered(result, "defense", hiiru)).toBe(true)
      const t = getSkillTrigger(result, "defense", malin)[0]
      expect(t.skillName).toBe("唯我独尊 Lv.4")
      expect(t.probability).toBe(25)
      expect(t.boostedProbability).toBe(25 * 1.2)
      expect(t.canTrigger).toBe(true)
      expect(t.triggered).toBe(true)
      expect(result.defendPercent).toBe(10)
    })
    test("発動なし-守備側(被アクセス)-確率", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "ignore"
      let hiiru = DencoManager.getDenco(context, "34", 50)
      let izuna = DencoManager.getDenco(context, "13", 50)
      let malin = DencoManager.getDenco(context, "53", 50, 1)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      let offense = initUser(context, "とあるマスター", [charlotte])
      let defense = initUser(context, "とあるマスター２", [malin, hiiru, izuna])
      defense = activateSkill(context, defense, 1)
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: malin.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "defense", malin)).toBe(false)
      expect(hasSkillTriggered(result, "defense", hiiru)).toBe(true)
      const t = getSkillTrigger(result, "defense", malin)[0]
      expect(t.skillName).toBe("唯我独尊 Lv.4")
      expect(t.probability).toBe(25)
      expect(t.boostedProbability).toBe(25 * 1.2)
      expect(t.canTrigger).toBe(false)
      expect(t.triggered).toBe(false)
      expect(result.defendPercent).toBe(0)
    })
    test("発動なし-守備側(被アクセス)-ディフェンダー不在", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let saya = DencoManager.getDenco(context, "8", 50)
      let ringo = DencoManager.getDenco(context, "15", 50)
      let malin = DencoManager.getDenco(context, "53", 50, 1)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      let offense = initUser(context, "とあるマスター", [charlotte])
      let defense = initUser(context, "とあるマスター２", [malin, saya, ringo])
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: malin.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "defense", malin)).toBe(false)
      expect(result.defendPercent).toBe(0)
    })
    test("発動なし-守備側(編成内)", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let naho = DencoManager.getDenco(context, "50", 50)
      let izuna = DencoManager.getDenco(context, "13", 50, 1)
      let malin = DencoManager.getDenco(context, "53", 50)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      let offense = initUser(context, "とあるマスター", [charlotte])
      let defense = initUser(context, "とあるマスター２", [malin, naho, izuna])
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 1
        },
        station: izuna.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "defense", malin)).toBe(false)
      expect(result.defendPercent).toBe(0)
    })
  })
})
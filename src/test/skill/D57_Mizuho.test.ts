import { Film, init } from "../.."
import { hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { activateSkill } from "../../core/skill"
import { initUser } from "../../core/user"
import { testManualSkill } from "../skillState"


describe("みづほのスキル", () => {
  beforeAll(init)

  testManualSkill({
    number: "57",
    name: "mizuho",
    active: 1800,
    cooldown: 10800
  })

  const film1: Film = {
    type: "film",
    theme: "theme1"
  }
  const film2: Film = {
    type: "film",
    theme: "theme2"
  }

  describe("ATK増加", () => {

    test("発動あり-攻撃側(アクセス)-フィルムなし", () => {
      const context = initContext("test", "test", false)
      let seria = DencoManager.getDenco(context, "1", 50)
      let mizuho = DencoManager.getDenco(context, "57", 50)
      let charlotte = DencoManager.getDenco(context, "6", 50, 1)
      let offense = initUser(context, "とあるマスター", [mizuho, seria])
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
      expect(hasSkillTriggered(result.offense, mizuho)).toBe(true)
      expect(result.attackPercent).toBe(12.5)
    })
    test("発動あり-攻撃側(アクセス)-フィルムあり", () => {
      const context = initContext("test", "test", false)
      let seria = DencoManager.getDenco(context, "1", 50)
      let mizuho = DencoManager.getDenco(context, "57", 50)
      mizuho.film = film1
      let charlotte = DencoManager.getDenco(context, "6", 50, 1)
      let offense = initUser(context, "とあるマスター", [mizuho, seria])
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
      expect(hasSkillTriggered(result.offense, mizuho)).toBe(true)
      expect(result.attackPercent).toBe(12.5)
    })
    test("発動あり-攻撃側(編成内)-フィルムなし", () => {
      const context = initContext("test", "test", false)
      let seria = DencoManager.getDenco(context, "1", 50)
      let mizuho = DencoManager.getDenco(context, "57", 50)
      let charlotte = DencoManager.getDenco(context, "6", 50, 1)
      let offense = initUser(context, "とあるマスター", [mizuho, seria])
      offense = activateSkill(context, offense, 0)
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
      expect(hasSkillTriggered(result.offense, mizuho)).toBe(true)
      expect(result.attackPercent).toBe(12.5)
    })
    test("発動あり-攻撃側(編成内)-フィルムあり", () => {
      const context = initContext("test", "test", false)
      let seria = DencoManager.getDenco(context, "1", 50)
      seria.film = film1
      let mizuho = DencoManager.getDenco(context, "57", 50)
      mizuho.film = film1
      let charlotte = DencoManager.getDenco(context, "6", 50, 1)
      let offense = initUser(context, "とあるマスター", [mizuho, seria])
      offense = activateSkill(context, offense, 0)
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
      expect(hasSkillTriggered(result.offense, mizuho)).toBe(true)
      expect(result.attackPercent).toBe(12.5)
    })
    test("発動なし-攻撃側(編成内)-フィルム異なる", () => {
      const context = initContext("test", "test", false)
      let seria = DencoManager.getDenco(context, "1", 50)
      seria.film = film1
      let mizuho = DencoManager.getDenco(context, "57", 50)
      mizuho.film = film2
      let charlotte = DencoManager.getDenco(context, "6", 50, 1)
      let offense = initUser(context, "とあるマスター", [mizuho, seria])
      offense = activateSkill(context, offense, 0)
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
      expect(hasSkillTriggered(result.offense, mizuho)).toBe(false)
      expect(result.attackPercent).toBe(0)
    })
  })
  describe("DEF増加", () => {

    test("発動あり-守備側(被アクセス)-フィルムなし", () => {
      const context = initContext("test", "test", false)
      let seria = DencoManager.getDenco(context, "1", 50)
      let mizuho = DencoManager.getDenco(context, "57", 50, 1)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      let defense = initUser(context, "とあるマスター", [mizuho, seria])
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
        station: mizuho.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.defense, mizuho)).toBe(true)
      expect(result.defendPercent).toBe(12.5)
    })
    test("発動あり-守備側(被アクセス)-フィルムあり", () => {
      const context = initContext("test", "test", false)
      let seria = DencoManager.getDenco(context, "1", 50)
      seria.film = film1
      let mizuho = DencoManager.getDenco(context, "57", 50, 1)
      mizuho.film = film1
      let charlotte = DencoManager.getDenco(context, "6", 50)
      let defense = initUser(context, "とあるマスター", [mizuho, seria])
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
        station: mizuho.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.defense, mizuho)).toBe(true)
      expect(result.defendPercent).toBe(12.5)
    })
    test("発動あり-守備側(編成内)-フィルムなし", () => {
      const context = initContext("test", "test", false)
      let seria = DencoManager.getDenco(context, "1", 50, 1)
      let mizuho = DencoManager.getDenco(context, "57", 50)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      let defense = initUser(context, "とあるマスター", [mizuho, seria])
      defense = activateSkill(context, defense, 0)
      let offense = initUser(context, "とあるマスター２", [charlotte])
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 1
        },
        station: seria.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.defense, mizuho)).toBe(true)
      expect(result.defendPercent).toBe(12.5)
    })
    test("発動あり-守備側(編成内)-フィルムあり", () => {
      const context = initContext("test", "test", false)
      let seria = DencoManager.getDenco(context, "1", 50, 1)
      seria.film = film1
      let mizuho = DencoManager.getDenco(context, "57", 50)
      mizuho.film = film1
      let charlotte = DencoManager.getDenco(context, "6", 50)
      let defense = initUser(context, "とあるマスター", [mizuho, seria])
      defense = activateSkill(context, defense, 0)
      let offense = initUser(context, "とあるマスター２", [charlotte])
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 1
        },
        station: seria.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.defense, mizuho)).toBe(true)
      expect(result.defendPercent).toBe(12.5)
    })
    test("発動なし-守備側(編成内)-フィルム異なる", () => {
      const context = initContext("test", "test", false)
      let seria = DencoManager.getDenco(context, "1", 50, 1)
      seria.film = film1
      let mizuho = DencoManager.getDenco(context, "57", 50)
      mizuho.film = film2
      let charlotte = DencoManager.getDenco(context, "6", 50)
      let defense = initUser(context, "とあるマスター", [mizuho, seria])
      defense = activateSkill(context, defense, 0)
      let offense = initUser(context, "とあるマスター２", [charlotte])
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 1
        },
        station: seria.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.defense, mizuho)).toBe(false)
      expect(result.defendPercent).toBe(0)
    })
  })
})
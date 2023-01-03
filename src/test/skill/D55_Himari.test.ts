import { Film, init } from "../.."
import { hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { activateSkill } from "../../core/skill"
import { initUser } from "../../core/user"
import { testManualSkill } from "../tool/skillState"

describe("ひまりのスキル", () => {
  beforeAll(init)

  testManualSkill({
    name: "himari",
    number: "55",
    active: 2700,
    cooldown: 14400,
  })

  const film1: Film = {
    type: "film",
    theme: "theme1"
  }
  const film2: Film = {
    type: "film",
    theme: "theme2"
  }

  test("発動あり-守備側(編成内)-フィルムx3", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50, 1)
    seria.film = film1
    let mero = DencoManager.getDenco(context, "2", 50)
    mero.film = film1
    let reika = DencoManager.getDenco(context, "5", 50)
    reika.film = film1
    let himari = DencoManager.getDenco(context, "55", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [seria, mero, reika, himari])
    defense = activateSkill(context, defense, 3)
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
      station: seria.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, himari)).toBe(true)
    expect(result.defendPercent).toBe(13.5)
  })
  test("発動あり-守備側(編成内)-フィルム2種類", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50, 1)
    seria.film = film1
    let mero = DencoManager.getDenco(context, "2", 50)
    mero.film = film1
    let reika = DencoManager.getDenco(context, "5", 50)
    reika.film = film2
    let himari = DencoManager.getDenco(context, "55", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [seria, mero, reika, himari])
    defense = activateSkill(context, defense, 3)
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
      station: seria.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, himari)).toBe(true)
    expect(result.defendPercent).toBe(9)
  })
  test("発動あり-守備側(編成内)-フィルム2種類同数", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50, 1)
    seria.film = film1
    let mero = DencoManager.getDenco(context, "2", 50)
    mero.film = film1
    let reika = DencoManager.getDenco(context, "5", 50)
    reika.film = film2
    let miroku = DencoManager.getDenco(context, "4", 50)
    miroku.film = film2
    let himari = DencoManager.getDenco(context, "55", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [seria, mero, reika, miroku, himari])
    defense = activateSkill(context, defense, 4)
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
      station: seria.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, himari)).toBe(true)
    expect(result.defendPercent).toBe(9)
  })
  test("発動あり-守備側(編成内)-ひまりはカウント対象外", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50, 1)
    seria.film = film1
    let mero = DencoManager.getDenco(context, "2", 50)
    mero.film = film1
    let reika = DencoManager.getDenco(context, "5", 50)
    reika.film = film1
    let himari = DencoManager.getDenco(context, "55", 50)
    himari.film = film1
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [seria, mero, reika, himari])
    defense = activateSkill(context, defense, 3)
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
      station: seria.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, himari)).toBe(true)
    expect(result.defendPercent).toBe(13.5)
  })
  test("発動なし-守備側(被アクセス)-ひまり本人は対象外", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    seria.film = film1
    let mero = DencoManager.getDenco(context, "2", 50)
    mero.film = film1
    let reika = DencoManager.getDenco(context, "5", 50)
    reika.film = film1
    let himari = DencoManager.getDenco(context, "55", 50, 1)
    himari.film = film1
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [himari, seria, mero, reika])
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
      station: himari.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, himari)).toBe(false)
    expect(result.defendPercent).toBe(0)
  })
  test("発動なし-守備側(編成内)-同種最大数のフィルム以外", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50, 1)
    seria.film = film1
    let mero = DencoManager.getDenco(context, "2", 50)
    mero.film = film2
    let reika = DencoManager.getDenco(context, "5", 50)
    reika.film = film2
    let himari = DencoManager.getDenco(context, "55", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [seria, mero, reika, himari])
    defense = activateSkill(context, defense, 3)
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
      station: seria.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, himari)).toBe(false)
    expect(result.defendPercent).toBe(0)
  })
  test("発動なし-守備側(編成内)-フィルムなし", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50, 1)
    let mero = DencoManager.getDenco(context, "2", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let himari = DencoManager.getDenco(context, "55", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [seria, mero, reika, himari])
    defense = activateSkill(context, defense, 3)
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
      station: seria.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.defense, himari)).toBe(false)
    expect(result.defendPercent).toBe(0)
  })
})
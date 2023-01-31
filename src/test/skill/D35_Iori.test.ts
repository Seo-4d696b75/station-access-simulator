import { activateSkill, getSkillTrigger, hasSkillTriggered, init, initContext, initUser, startAccess } from "../.."
import DencoManager from "../../core/dencoManager"
import { testAlwaysSkill } from "../tool/skillState"

describe("いおりのスキル", () => {
  beforeAll(init)

  testAlwaysSkill({
    number: "35",
    name: "iori"
  })

  test("発動あり-守備側(被アクセス)-駅名", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let iori = DencoManager.getDenco(context, "35", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [iori, seria])
    defense.formation[0].link[0].name = "本の文字を含む駅名"
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
      station: iori.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "defense", iori)).toBe(true)
    expect(result.defendPercent).toBe(8)
  })
  test("発動あり-守備側(被アクセス)-路線名", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let iori = DencoManager.getDenco(context, "35", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [iori, seria])
    let link = defense.formation[0].link[0]
    link.name = "対象文字を含まない駅名"
    link.lines = [
      {
        name: "本を含む路線名"
      }
    ]
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
      station: iori.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "defense", iori)).toBe(true)
    expect(result.defendPercent).toBe(8)
  })
  test("発動あり-守備側(被アクセス)-2駅（対象・非対象の混在）", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let iori = DencoManager.getDenco(context, "35", 50, 3)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [iori, seria])
    let link0 = defense.formation[0].link[0]
    link0.name = "本を含む駅名"
    let link1 = defense.formation[0].link[1]
    link1.name = "対象文字を含まない駅名"
    link1.lines = [{ name: "本を含む路線名" }]
    let link2 = defense.formation[0].link[2]
    link2.name = "対象文字を含まない駅名"
    link2.lines = [{ name: "対象文字含まない路線名" }]
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
      station: iori.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "defense", iori)).toBe(true)
    expect(result.defendPercent).toBe(8 * 2)
  })
  test.each([1, 2, 3, 4, 5, 6, 10, 20, 30])("発動あり-守備側(被アクセス)-%d駅", (count) => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let iori = DencoManager.getDenco(context, "35", 50, count)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [iori, seria])
    defense.formation[0].link.forEach(link => {
      link.lines = [{ name: "なんちゃら本線" }]
    })
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
      station: iori.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "defense", iori)).toBe(true)
    expect(result.defendPercent).toBe(8 * Math.min(count, 5))
  })
  test("発動あり-守備側(被アクセス)-確率ブースト", () => {
    const context = initContext("test", "test", false)
    let hiiru = DencoManager.getDenco(context, "34", 50)
    let iori = DencoManager.getDenco(context, "35", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [iori, hiiru])
    defense.formation[0].link[0].name = "本の文字を含む駅名"
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
      station: iori.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "defense", iori)).toBe(true)
    // 確率補正が効くか false
    const t = getSkillTrigger(result, "defense", iori)[0]
    expect(t.skillName).toBe("ビブリオフィル Lv.4")
    expect(t.probability).toBe(100)
    expect(t.boostedProbability).toBe(100)
    expect(t.triggered).toBe(true)

    expect(hasSkillTriggered(result, "defense", hiiru)).toBe(false)
    expect(result.defendPercent).toBe(8)
  })
  test("発動なし-守備側(編成内)", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50, 1)
    let iori = DencoManager.getDenco(context, "35", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [seria, iori])
    defense.formation[0].link[0].name = "本の文字を含む駅名"
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
    expect(hasSkillTriggered(result, "defense", iori)).toBe(false)
    expect(result.defendPercent).toBe(0)
  })

  test("発動なし-守備側(被アクセス)", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let iori = DencoManager.getDenco(context, "35", 50, 1)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [iori, seria])
    defense.formation[0].link[0].name = "対象文字を含まない駅名"
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
      station: iori.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result, "defense", iori)).toBe(false)
    expect(result.defendPercent).toBe(0)
  })
})
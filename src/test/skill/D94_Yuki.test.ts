import { activateSkill, DencoAttribute, init } from "../.."
import { getSkillTrigger, hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { initUser } from "../../core/user"
import "../../gen/matcher"
import { testAlwaysSkill } from "../tool/skillState"

describe("ゆきのスキル", () => {
  beforeAll(init)

  testAlwaysSkill({
    number: "94",
    name: "yuki",
  })

  test.each(
    new Array(20).fill(0).map((_, i) => i)
  )("発動確率-今日のアクセス数x%d", (cnt) => {
    const context = initContext("test", "test", false)
    context.random.mode = "ignore"
    let reika = DencoManager.getDenco(context, "5", 50)
    let yuki = DencoManager.getDenco(context, "94", 50)
    let offense = initUser(context, "とあるマスター", [reika, yuki])
    offense.user.daily = {
      accessStationCount: cnt
    }
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
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
    expect(hasSkillTriggered(result, "offense", yuki)).toBe(cnt >= 14)
    let d = result.offense.formation[0]
    expect(d.exp.skill).toBe(cnt >= 14 ? 120 : 0)
  })

  test.each(["cool", "heat", "eco", "flat"])("追加の経験値 %s", (attr) => {
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let reika = DencoManager.getDenco(context, "5", 50)
    reika.attr = attr as DencoAttribute
    let yuki = DencoManager.getDenco(context, "94", 50)
    let offense = initUser(context, "とあるマスター", [reika, yuki])
    offense.user.daily = {
      accessStationCount: 10
    }
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
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
    expect(hasSkillTriggered(result, "offense", yuki)).toBe(true)
    let d = result.offense.formation[0]
    expect(d.exp.skill).toBe(120 + (attr === "cool" ? 200 : 0))
  })

  describe("確率補正", () => {
    test("100%未満", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let reika = DencoManager.getDenco(context, "5", 50)
      let yuki = DencoManager.getDenco(context, "94", 50)
      let hiiru = DencoManager.getDenco(context, "34", 50)
      let offense = initUser(context, "とあるマスター", [reika, yuki, hiiru])
      offense = activateSkill(context, offense, 2)
      offense.user.daily = {
        accessStationCount: 1
      }
      let charlotte = DencoManager.getDenco(context, "6", 50, 1)
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
      expect(hasSkillTriggered(result, "offense", yuki)).toBe(true)
      expect(hasSkillTriggered(result, "offense", hiiru)).toBe(true)
      let t = getSkillTrigger(result, "offense", yuki)[0]
      expect(t.skillName).toBe("きみにサプライズ Lv.4")
      expect(t.probability).toBe(7)
      expect(t.boostedProbability).toBe(7 * 1.2)
      expect(t.triggered).toBe(true)

      let d = result.offense.formation[0]
      expect(d.exp.skill).toBe(120)
    })
    test("100%", () => {
      const context = initContext("test", "test", false)
      let reika = DencoManager.getDenco(context, "5", 50)
      let yuki = DencoManager.getDenco(context, "94", 50)
      let hiiru = DencoManager.getDenco(context, "34", 50)
      let offense = initUser(context, "とあるマスター", [reika, yuki, hiiru])
      offense = activateSkill(context, offense, 2)
      offense.user.daily = {
        accessStationCount: 20
      }
      let charlotte = DencoManager.getDenco(context, "6", 50, 1)
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
      expect(hasSkillTriggered(result, "offense", yuki)).toBe(true)
      expect(hasSkillTriggered(result, "offense", hiiru)).toBe(false)
      let t = getSkillTrigger(result, "offense", yuki)[0]
      expect(t.skillName).toBe("きみにサプライズ Lv.4")
      expect(t.probability).toBe(100)
      expect(t.boostedProbability).toBe(100)
      expect(t.triggered).toBe(true)

      let d = result.offense.formation[0]
      expect(d.exp.skill).toBe(120)
    })
  })

  describe("発動なし", () => {

    test("足湯", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let reika = DencoManager.getDenco(context, "5", 50)
      let yuki = DencoManager.getDenco(context, "94", 50)
      let offense = initUser(context, "とあるマスター", [reika, yuki])
      offense.user.daily = {
        accessStationCount: 20
      }
      let charlotte = DencoManager.getDenco(context, "6", 50, 1)
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
      expect(hasSkillTriggered(result, "offense", yuki)).toBe(false)
      let d = result.offense.formation[0]
      expect(d.exp.skill).toBe(0)
    })
    test("不在", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let reika = DencoManager.getDenco(context, "5", 50)
      let yuki = DencoManager.getDenco(context, "94", 50)
      let offense = initUser(context, "とあるマスター", [reika, yuki])
      offense.user.daily = {
        accessStationCount: 20
      }
      let charlotte = DencoManager.getDenco(context, "6", 50, 1)
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: undefined,
        station: charlotte.link[0],
      }
      const result = startAccess(context, config)
      expect(hasSkillTriggered(result, "offense", yuki)).toBe(false)
      let d = result.offense.formation[0]
      expect(d.exp.skill).toBe(0)
    })
  })

})
import { activateSkill, init, initContext, initUser, isSkillActive } from "../.."
import { getSkillTrigger, hasSkillTriggered, startAccess } from "../../core/access/index"
import DencoManager from "../../core/dencoManager"
import "../../gen/matcher"
import { testAlwaysSkill } from "../tool/skillState"

describe("やちよスキル", () => {
  beforeAll(init)

  testAlwaysSkill({
    number: "27",
    name: "yachiyo"
  })

  describe("Not地元駅", () => {
    test("isHomeStation定義あり", () => {
      const context = initContext("test", "test", false)
      let seria = DencoManager.getDenco(context, "1", 50)
      let yachiyo = DencoManager.getDenco(context, "27", 50, 1)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      let defense = initUser(context, "とあるマスター", [yachiyo, seria])
      const predicate = jest.fn((_) => false)
      defense.user.isHomeStation = predicate
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
        station: yachiyo.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "defense", yachiyo)).toBe(false)
      expect(result.defendPercent).toBe(0)
      expect(predicate.mock.calls.length).toBe(1)
      expect(predicate.mock.calls[0][0]).toMatchStation(yachiyo.link[0])
    })
  })

  describe("地元駅", () => {

    test("isHomeStation定義あり", () => {
      const context = initContext("test", "test", false)
      let seria = DencoManager.getDenco(context, "1", 50)
      let yachiyo = DencoManager.getDenco(context, "27", 50, 1)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      let defense = initUser(context, "とあるマスター", [yachiyo, seria])
      // ぜんぶ地元駅
      const predicate = jest.fn((_) => true)
      defense.user.isHomeStation = predicate

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
        station: yachiyo.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "defense", yachiyo)).toBe(true)
      expect(result.defendPercent).toBe(24)
      expect(predicate.mock.calls.length).toBe(1)
      expect(predicate.mock.calls[0][0]).toMatchStation(yachiyo.link[0])
    })

    test("isHomeStation未定義", () => {
      const context = initContext("test", "test", false)
      let seria = DencoManager.getDenco(context, "1", 50)
      let yachiyo = DencoManager.getDenco(context, "27", 50, 1)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      let defense = initUser(context, "とあるマスター", [yachiyo, seria])
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
        station: yachiyo.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "defense", yachiyo)).toBe(true)
      expect(result.defendPercent).toBe(24)
    })
    test("発動あり-守備側(被アクセス)-確率ブースト", () => {
      const context = initContext("test", "test", false)
      let hiiru = DencoManager.getDenco(context, "34", 50)
      let yachiyo = DencoManager.getDenco(context, "27", 50, 1)
      let charlotte = DencoManager.getDenco(context, "6", 50)
      let defense = initUser(context, "とあるマスター", [yachiyo, hiiru])
      // ぜんぶ地元駅
      defense.user.isHomeStation = (s) => true

      defense = activateSkill(context, defense, 1)
      hiiru = defense.formation[1]
      expect(isSkillActive(hiiru.skill)).toBe(true)
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
        station: yachiyo.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "defense", yachiyo)).toBe(true)
      const t = getSkillTrigger(result, "defense", yachiyo)[0]
      expect(t.skillName).toBe("ラブホームズ Lv.4")
      expect(t.probability).toBe(100)
      expect(t.boostedProbability).toBe(100)
      // 確率補正は効かない
      expect(hasSkillTriggered(result, "defense", hiiru)).toBe(false)
      expect(result.defendPercent).toBe(24)
    })
  })

  test("発動なし-攻撃側(アクセス)", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let yachiyo = DencoManager.getDenco(context, "27", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50, 1)
    let offense = initUser(context, "とあるマスター", [yachiyo, seria])
    // ぜんぶ地元駅
    offense.user.isHomeStation = (s) => true

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
    expect(hasSkillTriggered(result, "offense", yachiyo)).toBe(false)
    expect(result.attackPercent).toBe(0)
  })
  test("発動なし-守備側(編成内)", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50, 1)
    let yachiyo = DencoManager.getDenco(context, "27", 50)
    let charlotte = DencoManager.getDenco(context, "6", 50)
    let defense = initUser(context, "とあるマスター", [seria, yachiyo])
    // ぜんぶ地元駅
    defense.user.isHomeStation = (s) => true

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
    expect(hasSkillTriggered(result, "defense", yachiyo)).toBe(false)
    expect(result.defendPercent).toBe(0)
  })

})
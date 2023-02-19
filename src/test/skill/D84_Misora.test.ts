import { hasSkillTriggered, init, initContext, initUser, startAccess } from "../.."
import DencoManager from "../../core/dencoManager"
import { testAlwaysSkill } from "../tool/skillState"


describe("みそらのスキル", () => {
  beforeAll(init)

  testAlwaysSkill({
    number: "84",
    name: "misora"
  })

  const targetList = [
    "4",
    "5",
    "6",
    "7",
    "11",
    "19",
    "21",
    "22",
    "23",
    "25",
    // "30", 時間帯に依存してDEF減少
    "36",
    "37",
    "42",
    // "56",
    "57",
    "59",
    "60",
    "66",
    "68",
    "69",
    "70",
    "79",
    "84", // 本人も対象
  ]

  const noTargetList = [
    "18", // 汀良いちほ　苗字対象外
    "24", // ベアトリス＝ファン＝ライツェ ミドルネーム対象外
    "77", // リト＝フォン＝シュトゥットガルト ファミリーネーム対象外
  ]

  describe("ATK増加", () => {
    test.each(targetList)("対象 %s", (no) => {
      const context = initContext("test", "test", false)
      context.random.mode = "ignore" // 23 みらい不発調整
      let misora = DencoManager.getDenco(context, "84", 50)
      let test = DencoManager.getDenco(context, no, 50)
      let reika = DencoManager.getDenco(context, "5", 50, 1)
      let formation = [test]
      if (no !== misora.numbering) {
        formation.push(misora)
      }
      let offense = initUser(context, "とあるマスター", formation)
      let defense = initUser(context, "とあるマスター２", [reika])
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: reika.link[0],
      }
      const result = startAccess(context, config)
      expect(hasSkillTriggered(result, "offense", misora)).toBe(true)
      expect(result.attackPercent).toBe(7)
    })
    test.each(noTargetList)("対象外 %s", (no) => {
      const context = initContext("test", "test", false)
      let misora = DencoManager.getDenco(context, "84", 50)
      let test = DencoManager.getDenco(context, no, 50)
      let reika = DencoManager.getDenco(context, "5", 50, 1)
      let offense = initUser(context, "とあるマスター", [test, misora])
      let defense = initUser(context, "とあるマスター２", [reika])
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: reika.link[0],
      }
      const result = startAccess(context, config)
      expect(hasSkillTriggered(result, "offense", misora)).toBe(false)
      expect(result.attackPercent).toBe(0)
    })

  })

  describe("DEF増加", () => {
    test.each(targetList)("対象 %s", (no) => {
      const context = initContext("test", "test", false)
      let misora = DencoManager.getDenco(context, "84", 50)
      let test = DencoManager.getDenco(context, no, 50, 1)
      let reika = DencoManager.getDenco(context, "5", 50)
      let formation = [test]
      if (no !== misora.numbering) {
        formation.push(misora)
      }
      let offense = initUser(context, "とあるマスター", [reika])
      let defense = initUser(context, "とあるマスター２", formation)
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: test.link[0],
      }
      const result = startAccess(context, config)
      expect(hasSkillTriggered(result, "defense", misora)).toBe(true)
      expect(result.defendPercent).toBeGreaterThanOrEqual(7)
    })
    test.each(noTargetList)("対象外 %s", (no) => {
      const context = initContext("test", "test", false)
      let misora = DencoManager.getDenco(context, "84", 50)
      let test = DencoManager.getDenco(context, no, 50, 1)
      let reika = DencoManager.getDenco(context, "5", 50)
      let offense = initUser(context, "とあるマスター", [reika])
      let defense = initUser(context, "とあるマスター２", [test, misora])
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: test.link[0],
      }
      const result = startAccess(context, config)
      expect(hasSkillTriggered(result, "defense", misora)).toBe(false)
      expect(result.defendPercent).toBe(0)
    })

  })
})
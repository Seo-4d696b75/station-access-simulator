import assert from "assert"
import { dayjs, init } from "../.."
import { getSkillTrigger, hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { activateSkill } from "../../core/skill"
import { initUser } from "../../core/user"
import "../../gen/matcher"
import { testManualSkill } from "../tool/skillState"

describe("すすぐのスキル", () => {
  beforeAll(init)

  testManualSkill({
    number: "EX03",
    name: "susugu",
    active: 1080,
    cooldown: 15120,
  })


  describe("発動あり", () => {

    test("基本", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      context.clock = dayjs("2022-01-01T12:00:00").valueOf()
      let ringo = DencoManager.getDenco(context, "15", 50)
      let susugu = DencoManager.getDenco(context, "EX03", 50)
      let rara = DencoManager.getDenco(context, "56", 80, 1)
      let offense = initUser(context, "とあるマスター", [ringo, susugu])
      offense = activateSkill(context, offense, 1)
      let defense = initUser(context, "とあるマスター２", [rara])
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
      expect(hasSkillTriggered(result, "offense", susugu)).toBe(true)
      expect(hasSkillTriggered(result, "offense", ringo)).toBe(false)
      expect(hasSkillTriggered(result, "defense", rara)).toBe(false)
      // 無効化
      let t = getSkillTrigger(result, "offense", ringo)[0]
      expect(t.skillName).toBe("夜更かしはお肌の敵 Lv.4")
      expect(t.probability).toBe(100)
      expect(t.invalidated).toBe(true)
      expect(t.canTrigger).toBe(false)
      expect(t.triggered).toBe(false)
      t = getSkillTrigger(result, "defense", rara)[0]
      expect(t.skillName).toBe("ウチの本気見せたるわ♪")
      expect(t.probability).toBe(100)
      expect(t.invalidated).toBe(true)
      expect(t.canTrigger).toBe(false)
      expect(t.triggered).toBe(false)
    })

    test("確率ブースト", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      context.clock = dayjs("2022-01-01T12:00:00").valueOf()
      let ringo = DencoManager.getDenco(context, "15", 50)
      let susugu = DencoManager.getDenco(context, "EX03", 50)
      let reika = DencoManager.getDenco(context, "5", 60, 1)
      let hiiru = DencoManager.getDenco(context, "34", 50)
      let seria = DencoManager.getDenco(context, "1", 50)
      let offense = initUser(context, "とあるマスター", [ringo])
      let defense = initUser(context, "とあるマスター２", [reika, seria, hiiru, susugu])
      defense = activateSkill(context, defense, 1, 2, 3)
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
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "offense", ringo)).toBe(false)
      expect(hasSkillTriggered(result, "defense", susugu)).toBe(true)
      expect(hasSkillTriggered(result, "defense", hiiru)).toBe(true)
      // 無効化
      let t = getSkillTrigger(result, "offense", ringo)[0]
      expect(t.skillName).toBe("夜更かしはお肌の敵 Lv.4")
      expect(t.probability).toBe(100)
      expect(t.invalidated).toBe(true)
      expect(t.canTrigger).toBe(false)
      expect(t.triggered).toBe(false)
      // アクセス直後に発動するセリアのスキル発動確率ブーストはしない
      assert(result.defense)
      expect(result.defense.event.length).toBe(2)
      let e = result.defense.event[1]
      assert(e.type === "skill_trigger")
      expect(e.data.denco.who).toBe("self")
      expect(e.data.denco.carIndex).toBe(1)
      expect(e.data.denco).toMatchDenco(seria)
      expect(e.data.skillName).toBe("検測開始しま～す♡ Lv.4")
    })
    describe("攻守による無効化の順序", () => {
      test("攻撃側のレンを守備側のすすぐでは発動防げない", () => {
        const context = initContext("test", "test", false)
        context.random.mode = "force"
        context.clock = dayjs("2022-01-01T23:00:00").valueOf()
        let ren = DencoManager.getDenco(context, "22", 50)
        let reika = DencoManager.getDenco(context, "5", 50)
        let susugu = DencoManager.getDenco(context, "EX03", 50)
        let luna = DencoManager.getDenco(context, "3", 80, 1)
        let offense = initUser(context, "とあるマスター", [ren, reika])
        offense = activateSkill(context, offense, 0, 1)
        let defense = initUser(context, "とあるマスター２", [luna, susugu])
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
          station: luna.link[0],
        }
        const result = startAccess(context, config)
        expect(result.defense).not.toBeUndefined()
        // 攻撃側のレンが先に発動する
        // レイカは無効化され発動しない
        expect(hasSkillTriggered(result, "offense", ren)).toBe(true)
        expect(hasSkillTriggered(result, "offense", reika)).toBe(false)
        expect(hasSkillTriggered(result, "defense", luna)).toBe(false)
        expect(hasSkillTriggered(result, "defense", susugu)).toBe(true)
        // 無効化
        let t = getSkillTrigger(result, "offense", reika)[0]
        expect(t.skillName).toBe("起動加速度向上 Lv.4")
        expect(t.probability).toBe(100)
        expect(t.invalidated).toBe(true)
        t = getSkillTrigger(result, "defense", luna)[0]
        expect(t.skillName).toBe("ナイトエクスプレス")
        expect(t.probability).toBe(100)
        expect(t.invalidated).toBe(true)
      })
      test("攻撃側のてすとで守備側のすすぐが無効化され発動しない", () => {
        const context = initContext("test", "test", false)
        context.random.mode = "force"
        context.clock = dayjs("2022-01-01T23:00:00").valueOf()
        let reika = DencoManager.getDenco(context, "5", 50)
        let tesuto = DencoManager.getDenco(context, "EX04", 50)
        let susugu = DencoManager.getDenco(context, "EX03", 50)
        let luna = DencoManager.getDenco(context, "3", 80, 1)
        let offense = initUser(context, "とあるマスター", [reika, tesuto])
        offense = activateSkill(context, offense, 0, 1)
        let defense = initUser(context, "とあるマスター２", [luna, susugu])
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
          station: luna.link[0],
        }
        const result = startAccess(context, config)
        expect(result.defense).not.toBeUndefined()
        // 攻撃側のてすとが先に発動する
        // 守備側のすすぐ&ルナが発動前に無効化され発動しない
        // レイカはすすぐに無効化されず発動する
        expect(hasSkillTriggered(result, "offense", tesuto)).toBe(true)
        expect(hasSkillTriggered(result, "offense", reika)).toBe(true)
        expect(hasSkillTriggered(result, "defense", luna)).toBe(false)
        expect(hasSkillTriggered(result, "defense", susugu)).toBe(false)
        // 無効化
        let t = getSkillTrigger(result, "defense", susugu)[0]
        expect(t.skillName).toBe("お片付けしちゃいましょ！ Lv.4")
        expect(t.probability).toBe(85)
        expect(t.invalidated).toBe(true)
        t = getSkillTrigger(result, "defense", luna)[0]
        expect(t.skillName).toBe("ナイトエクスプレス")
        expect(t.probability).toBe(100)
        expect(t.invalidated).toBe(true)

      })
    })
  })



  describe("発動なし", () => {

    test("足湯", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      context.clock = dayjs("2022-01-01T12:00:00").valueOf()
      let ringo = DencoManager.getDenco(context, "15", 50)
      let susugu = DencoManager.getDenco(context, "EX03", 50)
      let rara = DencoManager.getDenco(context, "56", 80, 1)
      let offense = initUser(context, "とあるマスター", [ringo, susugu])
      offense = activateSkill(context, offense, 1)
      let defense = initUser(context, "とあるマスター２", [rara])
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
        usePink: true,
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result, "offense", susugu)).toBe(false)
      expect(hasSkillTriggered(result, "offense", ringo)).toBe(false)
      expect(hasSkillTriggered(result, "defense", rara)).toBe(false)
      // 無効化なし
      let t = getSkillTrigger(result, "offense", ringo)
      expect(t.length).toBe(0)
      t = getSkillTrigger(result, "defense", rara)
      expect(t.length).toBe(0)
    })
    test("相手不在", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      context.clock = dayjs("2022-01-01T12:00:00").valueOf()
      let ringo = DencoManager.getDenco(context, "15", 50)
      let susugu = DencoManager.getDenco(context, "EX03", 50)
      let rara = DencoManager.getDenco(context, "56", 80, 1)
      let offense = initUser(context, "とあるマスター", [ringo, susugu])
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: undefined,
        station: rara.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).toBeUndefined()
      expect(hasSkillTriggered(result, "offense", susugu)).toBe(false)
      expect(hasSkillTriggered(result, "offense", ringo)).toBe(false)
      // 無効化なし
      let t = getSkillTrigger(result, "offense", ringo)
      expect(t.length).toBe(0)
    })
  })
})
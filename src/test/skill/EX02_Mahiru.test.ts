import assert from "assert"
import { init } from "../.."
import { hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { activateSkill, getSkill, isSkillActive } from "../../core/skill"
import { initUser } from "../../core/user"
import { testManualSkill } from "../tool/skillState"

describe("まひるのスキル", () => {
  beforeAll(init)

  testManualSkill({
    number: "EX02",
    name: "mahiru",
    active: 1080,
    cooldown: 15120,
  })

  describe("発動あり", () => {

    test("基本", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let imura = DencoManager.getDenco(context, "19", 50)
      let mahiru = DencoManager.getDenco(context, "EX02", 50)
      let siira = DencoManager.getDenco(context, "11", 80, 1)
      let offense = initUser(context, "とあるマスター", [imura, mahiru])
      offense = activateSkill(context, offense, 0, 1)
      let defense = initUser(context, "とあるマスター２", [siira])
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: siira.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.offense, mahiru)).toBe(true)
      expect(hasSkillTriggered(result.offense, imura)).toBe(false)
      expect(hasSkillTriggered(result.defense, siira)).toBe(false)
      // 無効化
      assert(result.defense)
      expect(result.offense.formation[0].skillInvalidated).toBe(true)
      expect(result.defense.formation[0].skillInvalidated).toBe(true)
    })

    describe("攻守による無効化順序", () => {
      // 参考 https://blog.ekimemo.com/post/179166914454/%E9%A7%85%E3%83%A1%E3%83%A2%E3%81%AE%E3%82%B9%E3%82%AD%E3%83%AB%E3%81%AE%E7%99%BA%E5%8B%95%E9%A0%86%E5%BA%8F%E3%81%AB%E3%81%A4%E3%81%84%E3%81%A6
      // 攻撃側 > 守備側の順序でスキルが発動する
      test("攻撃側-守備側にちとせ", () => {
        const context = initContext("test", "test", false)
        context.random.mode = "force"
        let reika = DencoManager.getDenco(context, "5", 50)
        let mahiru = DencoManager.getDenco(context, "EX02", 50)
        let chitose = DencoManager.getDenco(context, "61", 80, 1)
        let offense = initUser(context, "とあるマスター", [reika, mahiru])
        offense = activateSkill(context, offense, 0, 1)
        let defense = initUser(context, "とあるマスター２", [chitose])
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
          station: chitose.link[0],
        }
        const result = startAccess(context, config)
        expect(result.defense).not.toBeUndefined()
        // 攻撃側のまひるが先に発動
        // 守備側のちとせは発動前に無効化される・レイカは無効化されない
        expect(hasSkillTriggered(result.offense, mahiru)).toBe(true)
        expect(hasSkillTriggered(result.offense, reika)).toBe(true)
        expect(hasSkillTriggered(result.defense, chitose)).toBe(false)
        // 無効化
        assert(result.defense)
        expect(result.offense.formation[0].skillInvalidated).toBe(false)
        expect(result.defense.formation[0].skillInvalidated).toBe(true)
      })
      test("守備側-攻撃側にちとせ", () => {
        const context = initContext("test", "test", false)
        context.random.mode = "force"
        let fubu = DencoManager.getDenco(context, "14", 50)
        let mahiru = DencoManager.getDenco(context, "EX02", 50, 1)
        let chitose = DencoManager.getDenco(context, "61", 80)
        let offense = initUser(context, "とあるマスター", [chitose])
        offense = activateSkill(context, offense, 0)
        let defense = initUser(context, "とあるマスター２", [mahiru, fubu])
        defense = activateSkill(context, defense, 0, 1)
        const config = {
          offense: {
            state: offense,
            carIndex: 0
          },
          defense: {
            state: defense,
            carIndex: 0
          },
          station: mahiru.link[0],
        }
        const result = startAccess(context, config)
        expect(result.defense).not.toBeUndefined()
        // 攻撃側のちとせが先に発動・ふぶは無効化される
        // 守備側のまひるが発動してちとせ無効化するも、既に無効化されたふぶはそのまま
        expect(hasSkillTriggered(result.defense, mahiru)).toBe(true)
        expect(hasSkillTriggered(result.defense, fubu)).toBe(false)
        expect(hasSkillTriggered(result.offense, chitose)).toBe(true)
        // 無効化
        assert(result.defense)
        expect(result.offense.formation[0].skillInvalidated).toBe(true)
        expect(result.defense.formation[1].skillInvalidated).toBe(true)
      })
    })

  })

  describe("発動なし", () => {

    test("足湯", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let imura = DencoManager.getDenco(context, "19", 50)
      let mahiru = DencoManager.getDenco(context, "EX02", 50)
      let siira = DencoManager.getDenco(context, "11", 80, 1)
      let offense = initUser(context, "とあるマスター", [imura, mahiru])
      offense = activateSkill(context, offense, 0, 1)
      let defense = initUser(context, "とあるマスター２", [siira])
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: siira.link[0],
        usePink: true,
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.offense, mahiru)).toBe(false)
      expect(hasSkillTriggered(result.offense, imura)).toBe(false)
      expect(hasSkillTriggered(result.defense, siira)).toBe(false)
      // 無効化なし
      assert(result.defense)
      expect(result.offense.formation[0].skillInvalidated).toBe(false)
      expect(result.defense.formation[0].skillInvalidated).toBe(false)
    })
    test("相手不在", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let imura = DencoManager.getDenco(context, "19", 50)
      let mahiru = DencoManager.getDenco(context, "EX02", 50)
      let siira = DencoManager.getDenco(context, "11", 80, 1)
      let offense = initUser(context, "とあるマスター", [imura, mahiru])
      offense = activateSkill(context, offense, 0, 1)
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: undefined,
        station: siira.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).toBeUndefined()
      expect(hasSkillTriggered(result.offense, mahiru)).toBe(false)
      expect(hasSkillTriggered(result.offense, imura)).toBe(false)
      // 無効化なし
      expect(result.offense.formation[0].skillInvalidated).toBe(false)
    })

    test("アクセス時に影響しないecoスキル", () => {
      const context = initContext("test", "test", false)
      context.random.mode = "force"
      let mahiru = DencoManager.getDenco(context, "EX02", 50)
      let siira = DencoManager.getDenco(context, "11", 80, 1)
      siira.currentHp = siira.maxHp - 1
      let moe = DencoManager.getDenco(context, "9", 50)
      let iroha = DencoManager.getDenco(context, "10", 80, 10)
      let reika = DencoManager.getDenco(context, "5", 50)
      let asa = DencoManager.getDenco(context, "43", 50)
      let offense = initUser(context, "とあるマスター", [mahiru, iroha, reika, asa])
      offense = activateSkill(context, offense, 0, 2)
      // いろは・あさidle
      expect(getSkill(offense.formation[1]).transition.state).toBe("idle")
      expect(getSkill(offense.formation[3]).transition.state).toBe("idle")
      let defense = initUser(context, "とあるマスター２", [siira, moe])
      // もえactive
      expect(isSkillActive(defense.formation[1].skill)).toBe(true)
      const config = {
        offense: {
          state: offense,
          carIndex: 0
        },
        defense: {
          state: defense,
          carIndex: 0
        },
        station: siira.link[0],
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(hasSkillTriggered(result.offense, mahiru)).toBe(true)
      expect(hasSkillTriggered(result.defense, siira)).toBe(false)
      // 無効化
      assert(result.defense)
      expect(result.defense.formation[0].skillInvalidated).toBe(true)
      // アクセス処理に関わらないもえのスキルは対象外
      expect(result.defense.formation[1].skillInvalidated).toBe(false)
      expect(result.offense.formation[1].skillInvalidated).toBe(false)
      expect(result.offense.formation[3].skillInvalidated).toBe(false)
    })

  })
})
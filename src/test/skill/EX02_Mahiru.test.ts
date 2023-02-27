import { init } from "../.."
import { getSkillTrigger, hasSkillTriggered, startAccess } from "../../core/access/index"
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
      expect(hasSkillTriggered(result, "offense", mahiru)).toBe(true)
      expect(hasSkillTriggered(result, "offense", imura)).toBe(false)
      expect(hasSkillTriggered(result, "defense", siira)).toBe(false)
      // 無効化
      let t = getSkillTrigger(result, "offense", imura)[0]
      expect(t.skillName).toBe("紫電一閃 Lv.4")
      expect(t.probability).toBe(100)
      expect(t.invalidated).toBe(true)
      expect(t.canTrigger).toBe(false)
      expect(t.triggered).toBe(false)
      t = getSkillTrigger(result, "defense", siira)[0]
      expect(t.skillName).toBe("ジョイフルガード")
      expect(t.probability).toBe(30)
      expect(t.invalidated).toBe(true)
      expect(t.canTrigger).toBe(false)
      expect(t.triggered).toBe(false)
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
        expect(hasSkillTriggered(result, "offense", mahiru)).toBe(true)
        expect(hasSkillTriggered(result, "offense", reika)).toBe(true)
        expect(hasSkillTriggered(result, "defense", chitose)).toBe(false)
        // 無効化確認
        let t = getSkillTrigger(result, "offense", reika)[0]
        expect(t.skillName).toBe("起動加速度向上 Lv.4")
        expect(t.probability).toBe(100)
        expect(t.invalidated).toBe(false)
        expect(t.canTrigger).toBe(true)
        expect(t.triggered).toBe(true)
        t = getSkillTrigger(result, "defense", chitose)[0]
        expect(t.skillName).toBe("見果てぬ景色")
        expect(t.probability).toBe(100)
        expect(t.invalidated).toBe(true)
        expect(t.canTrigger).toBe(false)
        expect(t.triggered).toBe(false)
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
        // 守備側のまひるは無効化対象なし
        expect(hasSkillTriggered(result, "defense", mahiru)).toBe(false)
        expect(hasSkillTriggered(result, "defense", fubu)).toBe(false)
        expect(hasSkillTriggered(result, "offense", chitose)).toBe(true)
        // 無効化確認
        let t = getSkillTrigger(result, "defense", fubu)[0]
        expect(t.skillName).toBe("根性入れてやるかー Lv.4")
        expect(t.probability).toBe(100)
        expect(t.invalidated).toBe(true)
        expect(t.canTrigger).toBe(false)
        expect(t.triggered).toBe(false)
        t = getSkillTrigger(result, "offense", chitose)[0]
        expect(t.skillName).toBe("見果てぬ景色")
        expect(t.probability).toBe(100)
        expect(t.invalidated).toBe(false)
        expect(t.canTrigger).toBe(true)
        expect(t.triggered).toBe(true)
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
      expect(hasSkillTriggered(result, "offense", mahiru)).toBe(false)
      expect(hasSkillTriggered(result, "offense", imura)).toBe(false)
      expect(hasSkillTriggered(result, "defense", siira)).toBe(false)
      // 無効化なし
      let t = getSkillTrigger(result, "offense", imura)
      expect(t.length).toBe(0)
      t = getSkillTrigger(result, "defense", siira)
      expect(t.length).toBe(0)

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
      expect(hasSkillTriggered(result, "offense", mahiru)).toBe(false)
      expect(hasSkillTriggered(result, "offense", imura)).toBe(false)
      // 無効化なし
      let t = getSkillTrigger(result, "offense", imura)
      expect(t.length).toBe(0)
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
      expect(hasSkillTriggered(result, "offense", mahiru)).toBe(true)
      expect(hasSkillTriggered(result, "defense", siira)).toBe(false)
      // 無効化
      let t = getSkillTrigger(result, "defense", siira)[0]
      expect(t.skillName).toBe("ジョイフルガード")
      expect(t.probability).toBe(30)
      expect(t.invalidated).toBe(true)
    })

  })
})
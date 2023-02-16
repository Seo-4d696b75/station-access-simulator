import { times } from "lodash"
import { activateSkill, getSkill, init } from "../.."
import { AccessResult, getSkillTrigger, hasSkillTriggered, startAccess } from "../../core/access/index"
import { Context, initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { initUser, UserState } from "../../core/user"
import { testManualSkill } from "../tool/skillState"

describe("めぐるのスキル", () => {
  beforeAll(init)

  testManualSkill({
    number: "85",
    name: "meguru",
    active: 3600,
    cooldown: 7200,
  })

  test.each([0, 1, 5, 10, 20, 30])("ATK増加-リンク回数x%d", (cnt) => {
    const context = initContext("test", "test", false)
    let meguru = DencoManager.getDenco(context, "85", 50)
    let offense = initUser(context, "とあるマスター", [meguru])
    offense = activateSkill(context, offense, 0)

    // リンク
    offense = repeatLink(context, offense, cnt)

    // カウント確認
    let s = getSkill(offense.formation[0])
    expect(s.data.readNumber("link_count", 0)).toBe(Math.min(cnt, 20))


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
    expect(hasSkillTriggered(result, "offense", meguru)).toBe(true)
    expect(result.attackPercent).toBe(3.5 * Math.min(cnt, 20))
  })

  describe("スキル状態-リンク回数", () => {
    test.each([0, 5, 10])("リンク失敗-リンク回数x%d", (cnt) => {
      const context = initContext("test", "test", false)
      let meguru = DencoManager.getDenco(context, "85", 50)
      let offense = initUser(context, "とあるマスター", [meguru])
      offense = activateSkill(context, offense, 0)
      offense = repeatLink(context, offense, cnt)
      let reika = DencoManager.getDenco(context, "5", 50, 1)
      reika.maxHp = Number.MAX_SAFE_INTEGER
      reika.currentHp = reika.maxHp
      let defense = initUser(context, "user", [reika])
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
      expect(result.linkSuccess).toBe(false)
      expect(hasSkillTriggered(result, "offense", meguru)).toBe(true)
      // カウント増加なし
      let s = getSkill(result.offense.formation[0])
      expect(s.data.readNumber("link_count", 0)).toBe(cnt)
    })
    test("足湯", () => {
      const context = initContext("test", "test", false)
      let meguru = DencoManager.getDenco(context, "85", 50)
      let offense = initUser(context, "とあるマスター", [meguru])
      offense = activateSkill(context, offense, 0)
      let reika = DencoManager.getDenco(context, "5", 50, 1)
      let defense = initUser(context, "user", [reika])
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
        usePink: true,
      }
      const result = startAccess(context, config)
      expect(result.defense).not.toBeUndefined()
      expect(result.linkSuccess).toBe(true)
      expect(result.pinkMode).toBe(true)
      expect(hasSkillTriggered(result, "offense", meguru)).toBe(false)
      // カウント増加あり
      let s = getSkill(result.offense.formation[0])
      expect(s.data.readNumber("link_count", 0)).toBe(1)
    })
  })

  test("ATK増加-エリア無効化", () => {
    const context = initContext("test", "test", false)
    let meguru = DencoManager.getDenco(context, "85", 50)
    let offense = initUser(context, "とあるマスター", [meguru])
    offense = activateSkill(context, offense, 0)

    // リンク
    offense = repeatLink(context, offense, 1)

    // カウント確認
    let s = getSkill(offense.formation[0])
    expect(s.data.readNumber("link_count", 0)).toBe(1)


    let eria = DencoManager.getDenco(context, "33", 50, 1)
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
    expect(hasSkillTriggered(result, "offense", meguru)).toBe(false)
    expect(hasSkillTriggered(result, "defense", eria)).toBe(true)
    expect(result.attackPercent).toBe(0)

    let t = getSkillTrigger(result, "offense", meguru)[0]
    expect(t.skillName).toBe("めぐるのバチつよ生配信♪ Lv.4")
    expect(t.probability).toBe(100)
    expect(t.invalidated).toBe(true)
    expect(t.triggered).toBe(false)
  })
})

function repeatLink(context: Context, state: UserState, count: number): UserState {
  let next = state
  times(count, () => {
    next = startLink(context, next).offense
  })
  return next
}

function startLink(context: Context, state: UserState): AccessResult {
  let reika = DencoManager.getDenco(context, "5", 50, 1)
  reika.currentHp = 1
  let defense = initUser(context, "user", [reika])
  const config = {
    offense: {
      state: state,
      carIndex: 0
    },
    defense: {
      state: defense,
      carIndex: 0
    },
    station: reika.link[0],
  }
  return startAccess(context, config)
}
import StationManager from "../..//core/stationManager"
import SkillManager from "../../core/skillManager"
import DencoManager from "../../core/dencoManager"
import { activateSkill, getAccessDenco, getSkill, hasSkillTriggered, init, initContext, initUser, refreshState, SkillActiveTimeout, SkillCooldownTimeout, startAccess } from "../.."
import moment from "moment-timezone"


describe("イムラのスキル", () => {
  beforeAll(init)
  test("スキル状態", () => {
    const context = initContext("test", "test", false)
    const now = moment().valueOf()
    context.clock = now
    let imura = DencoManager.getDenco(context, "19", 50)
    expect(imura.name).toBe("imura")
    expect(imura.skill.type).toBe("possess")
    let state = initUser(context, "とあるマスター", [imura])
    imura = state.formation[0]
    let skill = getSkill(imura)
    expect(skill.state.transition).toBe("manual")
    expect(skill.state.type).toBe("idle")
    expect(skill.state.data).toBeUndefined()
    state = activateSkill(context, state, 0)
    imura = state.formation[0]
    skill = getSkill(imura)
    expect(skill.state.type).toBe("active")
    let data = skill.state.data as SkillActiveTimeout
    expect(data.activeTimeout).toBe(now + 900 * 1000)
    expect(data.cooldownTimeout).toBe(now + 900 * 1000 + 3600 * 1000)

    // 10分経過
    context.clock = now + 600 * 1000
    state = refreshState(context, state)
    imura = state.formation[0]
    skill = getSkill(imura)
    expect(skill.state.type).toBe("active")

    // 15分経過
    context.clock = now + 900 * 1000
    state = refreshState(context, state)
    imura = state.formation[0]
    skill = getSkill(imura)
    expect(skill.state.type).toBe("cooldown")
    let timeout = skill.state.data as SkillCooldownTimeout
    expect(timeout.cooldownTimeout).toBe(now + (900 + 3600) * 1000)

    // 1時間15分経過
    context.clock = now + (900 + 3600) * 1000
    state = refreshState(context, state)
    imura = state.formation[0]
    skill = getSkill(imura)
    expect(skill.state.type).toBe("idle")
  })
  test("発動なし-非アクティブ", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let imura = DencoManager.getDenco(context, "19", 50)
    let offense = initUser(context, "とあるマスター", [imura, seria])
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
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.access.offense, imura)).toBe(false)
    expect(result.access.attackPercent).toBe(0)
  })
  test("発動なし-守備側", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let imura = DencoManager.getDenco(context, "19", 50, 1)
    let offense = initUser(context, "とあるマスター", [reika])
    let defense = initUser(context, "とあるマスター２", [imura, seria])
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
      station: imura.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.access.defense, imura)).toBe(false)
    expect(result.access.attackPercent).toBe(0)
  })
  test("発動なし-攻撃編成内", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let imura = DencoManager.getDenco(context, "19", 50)
    let offense = initUser(context, "とあるマスター", [imura, seria])
    offense = activateSkill(context, offense, 0)
    let defense = initUser(context, "とあるマスター２", [reika])
    const config = {
      offense: {
        state: offense,
        carIndex: 1
      },
      defense: {
        state: defense,
        carIndex: 0
      },
      station: reika.link[0],
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.access.offense, imura)).toBe(false)
    expect(result.access.attackPercent).toBe(0)
  })
  test("発動なし-相手不在", () => {
    const context = initContext("test", "test", false)
    let imura = DencoManager.getDenco(context, "19", 50)
    let offense = initUser(context, "とあるマスター", [imura])
    offense = activateSkill(context, offense, 0)
    const station = StationManager.getRandomStation(context, 1)[0]
    const config = {
      offense: {
        state: offense,
        carIndex: 0
      },
      station: station,
    }
    const result = startAccess(context, config)
    expect(result.defense).toBeUndefined()
    expect(hasSkillTriggered(result.access.offense, imura)).toBe(false)
  })
  test("発動なし-フットバース", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let imura = DencoManager.getDenco(context, "19", 50)
    let offense = initUser(context, "とあるマスター", [imura, seria])
    offense = activateSkill(context, offense, 0)
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
      usePink: true,
    }
    const result = startAccess(context, config)
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.access.offense, imura)).toBe(false)
    expect(result.access.attackPercent).toBe(0)
  })
  test("発動あり", () => {
    const context = initContext("test", "test", false)
    let seria = DencoManager.getDenco(context, "1", 50)
    let reika = DencoManager.getDenco(context, "5", 50, 1)
    let imura = DencoManager.getDenco(context, "19", 50)
    let offense = initUser(context, "とあるマスター", [imura, seria])
    offense = activateSkill(context, offense, 0)
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
    expect(result.defense).not.toBeUndefined()
    expect(hasSkillTriggered(result.access.offense, imura)).toBe(true)
    expect(result.access.attackPercent).toBe(35)
    let d = getAccessDenco(result.access, "offense")
    expect(d.damage).toBeUndefined() // ダメージ扱いしない
    const hp = d.hpBefore
    expect(d.hpAfter).toBe(Math.floor(hp / 2)) // アクセス中にHPが半減する
    imura = result.offense.formation[0]
    expect(imura.currentHp).toBe(Math.floor(hp / 2))
  })
  test("発動あり-反撃受ける", () => {
    // 反撃を受けると ダメージ量 < hpBefore - hpAfter となる場合がある
    // イムラのスキル発動によりHP半減した後にカウンター攻撃が発動して別途ダメージが発生するため
    // example: <blockquote class="twitter-tweet"><p lang="ja" dir="ltr">これは…イムラちゃんは画竜点睛でHPが半減してるから、そこにシーナ様のカウンターで受けたダメージが乗っかってリブートしてる訳だけど、HPの表示は最大の306から0になってるんだよね…普段なら画竜点睛で減った後のHPが表示されるのに… <a href="https://t.co/djdrTXHCnQ">pic.twitter.com/djdrTXHCnQ</a></p>&mdash; クロスレッド (@clothread_sm) <a href="https://twitter.com/clothread_sm/status/897121600541151232?ref_src=twsrc%5Etfw">August 14, 2017</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>
    const context = initContext("test", "test", false)
    context.random.mode = "force"
    let mio = DencoManager.getDenco(context, "36", 80)
    let sheena = DencoManager.getDenco(context, "7", 80, 1)
    let imura = DencoManager.getDenco(context, "19", 80)
    let fubu = DencoManager.getDenco(context, "14", 50)
    let offense = initUser(context, "とあるマスター", [imura, fubu])
    offense = activateSkill(context, offense, 0, 1)
    let defense = initUser(context, "とあるマスター２", [sheena, mio])
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
      station: sheena.link[0],
    }
    const {access} = startAccess(context, config)
    expect(access.defense).not.toBeUndefined()
    expect(hasSkillTriggered(access.offense, imura)).toBe(true)
    expect(hasSkillTriggered(access.defense, sheena)).toBe(true)
    expect(hasSkillTriggered(access.defense, mio)).toBe(true)
    expect(access.attackPercent).toBe(50)
    expect(access.defendPercent).toBe(0)
    let d = getAccessDenco(access, "defense")
    expect(d.damage).not.toBeUndefined()
    expect(d.damage?.value).toBe(157) // ミオが軽減
    expect(d.damage?.attr).toBe(false)
    expect(d.hpBefore).toBe(420)
    expect(d.hpAfter).toBe(263) // no reboot
    d = getAccessDenco(access, "offense")
    expect(d.damage).not.toBeUndefined() // カウンター攻撃
    expect(d.damage?.value).toBe(263) // ふぶが効いている
    expect(d.damage?.attr).toBe(true)
    expect(d.hpBefore).toBe(290)
    expect(d.hpAfter).toBe(0) // damage < hpBefore - hpAfter
    expect(d.currentHp).toBe(290)
  })
})
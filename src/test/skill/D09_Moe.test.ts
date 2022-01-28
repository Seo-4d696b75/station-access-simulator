import StationManager from "../..//core/stationManager"
import SkillManager from "../../core/skillManager"
import DencoManager from "../../core/dencoManager"
import { initContext } from "../../core/context"
import { initUser, refreshCurrentTime } from "../../core/user"
import { getSkill } from "../../core/denco"
import { activateSkill, disactivateSkill, refreshSkillState } from "../../core/skill"

describe("もえのスキル", ()=>{
  test("setup", async () => {
    await StationManager.load()
    await SkillManager.load()
    await DencoManager.load()
    expect(StationManager.data.length).toBeGreaterThan(0)
    expect(SkillManager.map.size).toBeGreaterThan(0)
    expect(DencoManager.data.size).toBeGreaterThan(0)
  })
  test("スキル状態", ()=>{
    const context = initContext("test", "test", false)
    let moe = DencoManager.getDenco(context, "9", 1)
    expect(moe.skillHolder.type).toBe("not_aquired")
    moe = DencoManager.getDenco(context, "9", 50)
    expect(moe.skillHolder.type).toBe("possess")
    let state = initUser(context, "とあるマスター", [moe])
    moe = state.formation[0]
    let skill = getSkill(moe)
    expect(skill.state.type).toBe("unable")
    expect(skill.transitionType).toBe("auto-condition")
    expect(() => activateSkill(context, {...state, carIndex: 0})).toThrowError()
    expect(() => disactivateSkill(context, {...state, carIndex:0})).toThrowError()
  })
  test("スキル発動-1", () => {
    const context = initContext("test", "test", false)
    const now = Date.parse("2020-01-01T12:50:00.000")
    context.clock = now
    let moe = DencoManager.getDenco(context, "9", 50)
    let charlotte = DencoManager.getDenco(context, "6", 80)
    let state = initUser(context, "とあるマスター", [moe, charlotte])
    expect(state.queue.length).toBe(1)
    expect(state.queue[0].type).toBe("hour_cycle")
    expect(state.queue[0].time).toBe(now + 600 * 1000)
    moe = state.formation[0]
    let skill = getSkill(moe)
    expect(skill.state.type).toBe("unable")
    // 13:00
    context.clock = now + 600 * 1000
    state = refreshCurrentTime(context, state)
    expect(state.event.length).toBe(0)
    expect(state.queue.length).toBe(1)
    expect(state.queue[0].type).toBe("hour_cycle")
    expect(state.queue[0].time).toBe(now + 70 * 60 * 1000)
    charlotte = state.formation[1]
    charlotte.currentHp = Math.floor(charlotte.maxHp * 0.9)
    state = refreshSkillState(context, state)
    moe = state.formation[0]
    skill = getSkill(moe)
    expect(skill.state.type).toBe("active")
    // 14:00
    context.clock = now + 70 * 60 * 1000
    state = refreshCurrentTime(context, state)
    expect(state.event.length).toBe(1)
    let event = state.event[0]
    expect(event.type).toBe("skill_trigger")
    if ( event.type === "skill_trigger"){
      expect(event.data.time).toBe(now + 70 * 60 * 1000)
      expect(event.data.step).toBe("self")
      expect(event.data.denco.name).toBe("moe")
    }
    charlotte = state.formation[1]
    expect(charlotte.currentHp).toBe(charlotte.maxHp)
    moe = state.formation[0]
    skill = getSkill(moe)
    expect(skill.state.type).toBe("unable")
    expect(state.queue.length).toBe(1)
    expect(state.queue[0].type).toBe("hour_cycle")
    expect(state.queue[0].time).toBe(now + 130 * 60 * 1000)
  })
  test("スキル発動-2", ()=>{
    const context = initContext("test", "test", false)
    const now = Date.parse("2020-01-01T12:50:00.000")
    context.clock = now
    let moe = DencoManager.getDenco(context, "9", 80)
    let charlotte = DencoManager.getDenco(context, "6", 80)
    let sheena = DencoManager.getDenco(context, "7", 50)
    let state = initUser(context, "とあるマスター", [moe, charlotte, sheena])
    expect(state.queue.length).toBe(1)
    expect(state.queue[0].type).toBe("hour_cycle")
    expect(state.queue[0].time).toBe(now + 600 * 1000)
    moe = state.formation[0]
    let skill = getSkill(moe)
    expect(skill.state.type).toBe("unable")

    // chage HP
    charlotte = state.formation[1]
    sheena = state.formation[2]
    moe.currentHp = Math.floor(moe.maxHp * 0.9)
    charlotte.currentHp = Math.floor(charlotte.maxHp * 0.6)
    sheena.currentHp = Math.floor(sheena.maxHp * 0.2)
    
    // update skill state
    state = refreshSkillState(context, state)
    moe = state.formation[0]
    skill = getSkill(moe)
    expect(skill.state.type).toBe("active")

    // time
    context.clock = now + 600 * 1000
    state = refreshCurrentTime(context, state)
    moe = state.formation[0]
    charlotte = state.formation[1]
    sheena = state.formation[2]
    skill = getSkill(moe)
    // まだ回復できる
    expect(skill.state.type).toBe("active")
    expect(state.event.length).toBe(1)
    // スキル発動のイベント
    let event = state.event[0]
    expect(event.type).toBe("skill_trigger")
    if ( event.type === "skill_trigger"){
      expect(event.data.time).toBe(now + 600 * 1000)
      expect(event.data.step).toBe("self")
      expect(event.data.denco.name).toBe("moe")
    }
    // check current hp
    expect(moe.currentHp).toBe(moe.maxHp)
    expect(charlotte.currentHp).toBe(Math.floor(charlotte.maxHp * 0.6) + Math.floor(charlotte.maxHp * 0.4))
    expect(sheena.currentHp).toBe(Math.floor(sheena.maxHp * 0.2) + Math.floor(sheena.maxHp * 0.4))
  })
})
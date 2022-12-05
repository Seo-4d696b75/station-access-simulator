import assert from "assert"
import { Denco, DencoManager, init, initContext, initUser, startAccess } from ".."
import { copyAccessResult, copyDenco, copyDencoState, mergeDenco, mergeDencoState } from "../core/copy"

describe("schema", () => {
  beforeAll(init)

  test("Denco", () => {
    const d: Denco = {
      numbering: "0",
      name: "denco",
      type: "attacker",
      attr: "cool",
    }
    const c = copyDenco(d)
    expect(d).not.toBe(c)
    expect(d).toMatchObject(c)
    d.numbering = "1"
    mergeDenco(c, d)
    expect(d).toMatchObject(c)
  })
  test("DencoState", () => {
    const context = initContext()
    const d = DencoManager.getDenco(context, "1", 50)
    const copy = copyDencoState(d)
    expect(d).not.toBe(copy)
    expect(d).toMatchObject(copy)
    d.ap = 1000
    d.film = {
      type: "film",
      theme: "theme",
      attackPercent: 10,
      expPercent: 10,
      skill: {
        active: 300
      }
    }
    assert(d.skill.type === "possess")
    d.skill.level = 10
    d.skill.transition = {
      state: "active",
      data: undefined,
    }
    d.skill.data.putBoolean("key", true)
    mergeDencoState(copy, d)
    expect(d.film).not.toBe(copy.film)
    expect(d.skill).not.toBe(copy.skill)
    expect(d).toMatchObject(copy)
  })
  test("AccessResult", () => {
    const context = initContext()
    let reika = DencoManager.getDenco(context, "5", 50)
    let charlotte = DencoManager.getDenco(context, "6", 80, 3)
    const offense = initUser(context, "とあるマスター１", [reika])
    const defense = initUser(context, "とあるマスター２", [charlotte])
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
    const copy = copyAccessResult(result)
    expect(result).not.toBe(copy)
    expect(result).toMatchObject(copy)
  })
})
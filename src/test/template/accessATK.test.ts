import { hasSkillTriggered, startAccess } from "../../core/access/index"
import { initContext } from "../../core/context"
import DencoManager from "../../core/dencoManager"
import { activateSkill, isSkillActive } from "../../core/skill"
import StationManager from "../../core/stationManager"
import { initUser } from "../../core/user"

test("発動なし-攻撃側(アクセス)", () => {
  const context = initContext("test", "test", false)
  let seria = DencoManager.getDenco(context, "1", 50)
  let denco_name = DencoManager.getDenco(context, "DENCO_NUMBER", 50)
  let charlotte = DencoManager.getDenco(context, "6", 50, 1)
  let offense = initUser(context, "とあるマスター", [denco_name, seria])
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
  expect(hasSkillTriggered(result, "offense", denco_name)).toBe(false)
  // TODO ATK%
  expect(result.attackPercent).toBe(0)
})


test("発動なし-攻撃側(アクセス)-相手無し", () => {
  const context = initContext("test", "test", false)
  let seria = DencoManager.getDenco(context, "1", 50)
  let denco_name = DencoManager.getDenco(context, "DENCO_NUMBER", 50)
  let charlotte = DencoManager.getDenco(context, "6", 50, 1)
  let offense = initUser(context, "とあるマスター", [denco_name, seria])
  let defense = initUser(context, "とあるマスター２", [charlotte])
  const config = {
    offense: {
      state: offense,
      carIndex: 0
    },
    station: StationManager.getRandomStation(context, 1)[0],
  }
  const result = startAccess(context, config)
  expect(result.defense).not.toBeUndefined()
  expect(hasSkillTriggered(result, "offense", denco_name)).toBe(false)
  // TODO ATK%
  expect(result.attackPercent).toBe(0)
})

test("発動なし-攻撃側(編成内)", () => {
  const context = initContext("test", "test", false)
  let seria = DencoManager.getDenco(context, "1", 50)
  let denco_name = DencoManager.getDenco(context, "DENCO_NUMBER", 50)
  let charlotte = DencoManager.getDenco(context, "6", 50, 1)
  let offense = initUser(context, "とあるマスター", [seria, denco_name])
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
  expect(hasSkillTriggered(result, "offense", denco_name)).toBe(false)
  // TODO ATK%
  expect(result.attackPercent).toBe(0)
})

test("発動なし-守備側(被アクセス)", () => {
  const context = initContext("test", "test", false)
  let seria = DencoManager.getDenco(context, "1", 50)
  let denco_name = DencoManager.getDenco(context, "DENCO_NUMBER", 50, 1)
  let charlotte = DencoManager.getDenco(context, "6", 50)
  let defense = initUser(context, "とあるマスター", [denco_name, seria])
  /*   スキルの有効化
    defense = activateSkill(context, defense, 0)
    denco_name = defense.formation[0]
    expect(isSkillActive(denco_name.skill)).toBe(true) */
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
    station: denco_name.link[0],
  }
  const result = startAccess(context, config)
  expect(result.defense).not.toBeUndefined()
  expect(hasSkillTriggered(result, "defense", denco_name)).toBe(false)
  // TODO ATK%
  expect(result.attackPercent).toBe(0)
})

test("発動なし-守備側(編成内)", () => {
  const context = initContext("test", "test", false)
  let seria = DencoManager.getDenco(context, "1", 50, 1)
  let denco_name = DencoManager.getDenco(context, "DENCO_NUMBER", 50)
  let charlotte = DencoManager.getDenco(context, "6", 50)
  let defense = initUser(context, "とあるマスター", [seria, denco_name])
  /*   スキルの有効化
    defense = activateSkill(context, defense, 1)
    denco_name = defense.formation[1]
    expect(isSkillActive(denco_name.skill)).toBe(true) */
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
  expect(hasSkillTriggered(result, "defense", denco_name)).toBe(false)
  // TODO ATK%
  expect(result.attackPercent).toBe(0)
})

test("発動あり-攻撃側(アクセス)", () => {
  const context = initContext("test", "test", false)
  let seria = DencoManager.getDenco(context, "1", 50)
  let denco_name = DencoManager.getDenco(context, "DENCO_NUMBER", 50)
  let charlotte = DencoManager.getDenco(context, "6", 50, 1)
  let offense = initUser(context, "とあるマスター", [denco_name, seria])
  /*  スキルの有効化
   offense = activateSkill(context, offense, 0)
   denco_name = offense.formation[0]
   expect(isSkillActive(denco_name.skill)).toBe(true) */
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
  expect(hasSkillTriggered(result, "offense", denco_name)).toBe(true)
  // TODO ATK%
  expect(result.attackPercent).toBe(0)
})

test("発動あり-攻撃側(アクセス)-確率ブースト", () => {
  const context = initContext("test", "test", false)
  let hiiru = DencoManager.getDenco(context, "34", 50)
  let denco_name = DencoManager.getDenco(context, "DENCO_NUMBER", 50)
  let charlotte = DencoManager.getDenco(context, "6", 50, 1)
  let offense = initUser(context, "とあるマスター", [denco_name, hiiru])
  /* スキルの有効化
  offense = activateSkill(context, offense, 0)
  denco_name = offense.formation[0]
  expect(isSkillActive(denco_name.skill)).toBe(true) */
  offense = activateSkill(context, offense, 1)
  hiiru = offense.formation[1]
  expect(isSkillActive(hiiru.skill)).toBe(true)
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
  expect(hasSkillTriggered(result, "offense", denco_name)).toBe(true)
  // 確率補正が効くか true/false
  expect(hasSkillTriggered(result, "offense", hiiru)).toBe(true)
  // TODO ATK%
  expect(result.attackPercent).toBe(0)
})

test("発動あり-攻撃側(編成内)", () => {
  const context = initContext("test", "test", false)
  let seria = DencoManager.getDenco(context, "1", 50)
  let denco_name = DencoManager.getDenco(context, "DENCO_NUMBER", 50)
  let charlotte = DencoManager.getDenco(context, "6", 50, 1)
  let offense = initUser(context, "とあるマスター", [seria, denco_name])
  /* スキルの有効化
  offense = activateSkill(context, offense, 0)
  denco_name = offense.formation[0]
  expect(isSkillActive(denco_name.skill)).toBe(true) */
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
  expect(hasSkillTriggered(result, "offense", denco_name)).toBe(true)
  // TODO ATK%
  expect(result.attackPercent).toBe(0)
})
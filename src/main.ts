// 内部のテスト用エントリーポイント
import sourceMapSupport from 'source-map-support'
sourceMapSupport.install()

import { DencoState, init } from "./index"
import DencoManager from "./core/dencoManager"
import { AccessConfig, startAccess } from './core/access'
import { formatEvent, printEvents } from './core/format'
import { initContext } from './core/context'
import { initUser, UserState, refreshState } from './core/user'
import { activateSkill, getSkill, refreshSkillState } from './core/skill'
import moment from "moment-timezone"

init().then(() => {
  const context = initContext("test", "test")
  let nikoro = DencoManager.getDenco(context, "20", 50, 2)
  let reika = DencoManager.getDenco(context, "5", 50)
  reika.nextExp = Number.MAX_SAFE_INTEGER
  nikoro.nextExp = Number.MAX_SAFE_INTEGER
  let charlotte = DencoManager.getDenco(context, "6", 80)
  const offense = initUser(context, "とあるマスター１", [
    charlotte
  ])
  const defense = initUser(context, "とあるマスター２", [
    nikoro, reika
  ])
  const config: AccessConfig = {
    offense: {
      state: offense,
      carIndex: 0
    },
    defense: {
      state: defense,
      carIndex: 0
    },
    station: nikoro.link[0],
  }
  const result = startAccess(context, config)
  printEvents(context, result.offense, true)
  //printEvents(context, result.defense, true)

})


const test1: DencoState = {
  numbering: "test1",
  name: "test1",
  type: "supporter",
  attr: "flat",
  level: 50,
  currentExp: 0,
  nextExp: 100000,
  currentHp: 100,
  maxHp: 100,
  film: {},
  ap: 100,
  link: [],
  skill: {
    type: "possess",
    level: 1,
    name: "test-skill1",
    propertyReader: () => 0,
    state: {
      type: "active",
      transition: "always",
      data: undefined
    },
    canEvaluate: (context, state, step, self) => step === "damage_fixed" && self.which === "offense",
    evaluate: (context, state, step, self) => {
      state.damageFixed += 10
      return state
    } 
  }
}

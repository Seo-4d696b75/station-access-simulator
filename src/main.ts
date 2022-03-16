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
  context.random.mode = "force"
  let yunoka = DencoManager.getDenco(context, "76", 50)
  let charlotte = DencoManager.getDenco(context, "6", 50, 1)
  let mio = DencoManager.getDenco(context, "36", 80)
  let offense = initUser(context, "とあるマスター", [yunoka])
  offense = activateSkill(context, offense, 0)
  let defense = initUser(context, "master2", [charlotte, mio])
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
    station: charlotte.link[0]
  }
  const result = startAccess(context, config)
  printEvents(context, result.offense, true)
  //printEvents(context, result.defense, true)

})


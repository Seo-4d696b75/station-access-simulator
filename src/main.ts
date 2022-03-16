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
  let hokone = DencoManager.getDenco(context, "26", 50)
  let reika = DencoManager.getDenco(context, "5", 50)
  let urara = DencoManager.getDenco(context, "25", 50, 1)
  let offense = initUser(context, "とあるマスター", [hokone, reika])
  offense = activateSkill(context, offense, 0, 1)
  let defense = initUser(context, "とあるマスター２", [urara])
  const config = {
    offense: {
      state: offense,
      carIndex: 0
    },
    defense: {
      state: defense,
      carIndex: 0
    },
    station: urara.link[0],
  }
  const result = startAccess(context, config)
  printEvents(context, result.offense, true)
  //printEvents(context, result.defense, true)

})


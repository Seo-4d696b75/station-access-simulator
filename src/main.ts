// 内部のテスト用エントリーポイント
import sourceMapSupport from 'source-map-support'
sourceMapSupport.install()

import { init } from "./index"
import DencoManager from "./core/dencoManager"
import { AccessConfig, startAccess } from './core/access'
import { formatEvent, printEvents } from './core/format'
import { initContext } from './core/context'
import { initUser, refreshCurrentTime, UserState } from './core/user'
import { activateSkill, getSkill, refreshSkillState } from './core/skill'
import moment from "moment-timezone"

init().then(() => {
  const context = initContext("test", "test")
  const now = moment().valueOf()
  context.clock = now
  let fubu = DencoManager.getDenco(context, "14", 50)
  let reika = DencoManager.getDenco(context, "5", 50)
  let charlotte = DencoManager.getDenco(context, "6", 50, 1)
  let offense = initUser(context, "とあるマスター", [reika])
  let defense = initUser(context, "とあるマスター２", [charlotte, fubu])
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
    station: charlotte.link[0],
  }
  const result = startAccess(context, config)

})
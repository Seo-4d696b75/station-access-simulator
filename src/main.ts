// 内部のテスト用エントリーポイント
import sourceMapSupport from 'source-map-support'
sourceMapSupport.install()

import { init } from "./index"
import DencoManager from "./core/dencoManager"
import { AccessConfig, startAccess } from './core/access'
import { formatEvent, printEvents } from './core/format'
import { initContext } from './core/context'
import { initUser, UserState, refreshState } from './core/user'
import { activateSkill, getSkill, refreshSkillState } from './core/skill'
import moment from "moment-timezone"

init().then(() => {
  const context = initContext("test", "test")
  context.clock = moment('2022-01-01T23:00:00+0900').valueOf()
  let luna = DencoManager.getDenco(context, "3", 50, 1)
  let ringo = DencoManager.getDenco(context, "15", 50, 1)
  let defense = initUser(context, "とあるマスター", [luna])
  let offense = initUser(context, "とあるマスター２", [ringo])
  const config = {
    offense: {
      state: offense,
      carIndex: 0
    },
    defense: {
      state: defense,
      carIndex: 0
    },
    station: luna.link[0],
  }
  const result = startAccess(context, config)

})
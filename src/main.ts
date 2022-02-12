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
  let izuna = DencoManager.getDenco(context, "13", 80, 1)
  let luna = DencoManager.getDenco(context, "3", 50)
  let siira = DencoManager.getDenco(context, "11", 50)
  let mobo = DencoManager.getDenco(context, "12", 50)
  let reika = DencoManager.getDenco(context, "5", 50)
  let offense = initUser(context, "とあるマスター", [reika])
  let defense = initUser(context, "とあるマスター２", [izuna, luna, siira, mobo])
  const config = {
    offense: {
      carIndex: 0,
      ...offense
    },
    defense: {
      carIndex: 0,
      ...defense
    },
    station: izuna.link[0],
  }
  const result = startAccess(context, config)
  
})
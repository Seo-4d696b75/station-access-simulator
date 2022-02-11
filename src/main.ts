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
  const context = initContext("test", "test", false)
  const now = moment().valueOf()
  context.clock = now
  let iroha = DencoManager.getDenco(context, "10", 50, 2)
  let reika = DencoManager.getDenco(context, "5", 50)
  let state = initUser(context, "master", [iroha, reika])

  state = activateSkill(context, { ...state, carIndex: 0 })

  // wait終了後
  context.clock = now + 7200 * 1000
  state = refreshSkillState(context, state)
  
})
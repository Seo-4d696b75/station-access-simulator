// 内部のテスト用エントリーポイント
import sourceMapSupport from 'source-map-support'
sourceMapSupport.install()

import { init } from "./index"
import DencoManager from "./core/dencoManager"
import { AccessConfig, startAccess } from './core/access'
import { formatEvent, printEvents } from './core/format'
import { initContext } from './core/context'
import { getSkill } from './core/denco'
import { initUser, refreshCurrentTime, UserState } from './core/user'
import { activateSkill, refreshSkillState } from './core/skill'
import moment from "moment-timezone"

init().then(() => {
  const context = initContext("test", "test")
  context.random.mode = "ignore"
  let siira = DencoManager.getDenco(context, "11", 50, 1)
  let reika = DencoManager.getDenco(context, "5", 50)
  let hiiru = DencoManager.getDenco(context, "34", 50)
  let offense = initUser(context, "とあるマスター", [reika])
  let defense = initUser(context, "とあるマスター２", [hiiru, siira])
  defense = activateSkill(context, {...defense, carIndex: 0})
  const config = {
    offense: {
      carIndex: 0,
      ...offense
    },
    defense: {
      carIndex: 1,
      ...defense
    },
    station: siira.link[0],
  }
  const result = startAccess(context, config)
  console.log("攻撃側のタイムライン")
  printEvents(context, result.offense, true)
  console.log("守備側のタイムライン")
  printEvents(context, result.defense, true)
})
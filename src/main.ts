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
  const context = initContext("test", "test", false)
  let reika = DencoManager.getDenco(context, "5", 80)
  let charlotte = DencoManager.getDenco(context, "6", 50, 1)
  let offense = initUser(context, "とあるマスター１", [
    reika
  ])
  offense = activateSkill(context, { ...offense, carIndex: 0 })
  let defense = initUser(context, "とあるマスター２", [
    charlotte
  ])
  const config: AccessConfig = {
    offense: {
      carIndex: 0,
      ...offense
    },
    defense: {
      carIndex: 0,
      ...defense
    },
    station: charlotte.link[0],
  }
  const result = startAccess(context, config)
  console.log("攻撃側のタイムライン")
  printEvents(context, result.offense, true)
  console.log("守備側のタイムライン")
  printEvents(context, result.defense, true)
})
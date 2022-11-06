import moment from "moment-timezone"
import { AccessDencoState, AccessResult, AccessSide, AccessSideState, AccessState, getAccessDenco } from "."
import { Context } from "../context"
import { refreshSkillState } from "../skill/refresh"
import { copyState, ReadonlyState } from "../state"
import { Station } from "../station"
import { UserParam, UserState } from "../user"
import { execute } from "./main/execute"
import { completeAccess } from "./result"

/**
 * アクセス処理の入力・設定を定義します
 */
export interface AccessConfig {
  /**
   * 攻撃側の編成
   */
  offense: {
    state: ReadonlyState<UserState>
    carIndex: number
  }
  /**
   * アクセス先の駅
   */
  station: Station
  /**
   * 守備側の編成
   */
  defense?: {
    state: ReadonlyState<UserState>
    carIndex: number
  }
  /**
   * フットバースアイテム使用の有無を指定する
   */
  usePink?: boolean
}

export function startAccess(context: Context, config: AccessConfig): AccessResult {
  context = context.fixClock()
  const time = context.currentTime
  context.log.log(`アクセス処理の開始 ${moment(time).format("YYYY-MM-DD HH:mm:ss.SSS")}`)

  var state: AccessState = {
    time: time.valueOf(),
    station: config.station,
    offense: initAccessDencoState(context, config.offense.state, config.offense.carIndex, "offense"),
    defense: undefined,
    damageFixed: 0,
    attackPercent: 0,
    defendPercent: 0,
    damageRatio: 1.0,
    linkSuccess: false,
    linkDisconnected: false,
    pinkMode: false,
    pinkItemSet: !!config.usePink,
    pinkItemUsed: false,
    depth: 0,
  }

  // アクセス駅とリンクの確認
  const d = getAccessDenco(state, "offense")
  const idx = d.link.findIndex(link => link.name === config.station.name)
  if (idx >= 0) {
    context.log.warn(`攻撃側(${d.name})のリンクに対象駅(${config.station.name})が含まれています,削除します`)
    d.link = d.link.splice(idx, 1)
  }
  if (config.defense) {
    state.defense = initAccessDencoState(context, config.defense.state, config.defense.carIndex, "defense")
    const d = getAccessDenco(state, "defense")
    var link = d.link.find(link => link.name === config.station.name)
    if (!link) {
      context.log.warn(`守備側(${d.name})のリンクに対象駅(${config.station.name})が含まれていません,追加します`)
      link = {
        ...config.station,
        start: context.currentTime.valueOf() - 100
      }
      d.link.push(link)
    }
  }


  state = execute(context, state)
  context.log.log("アクセス処理の終了")

  return completeAccess(context, config, state)
}

function initAccessDencoState(context: Context, f: ReadonlyState<UserState>, carIndex: number, which: AccessSide): AccessSideState {
  const tmp = copyState<UserState>(f)
  refreshSkillState(context, tmp)
  const formation = tmp.formation.map((e, idx) => {
    const s: AccessDencoState = {
      ...e,
      hpBefore: e.currentHp,
      hpAfter: e.currentHp,
      which: which,
      who: idx === carIndex ? which : "other",
      carIndex: idx,
      reboot: false,
      skillInvalidated: false,
      damage: undefined,
      exp: {
        access: 0,
        skill: 0,
        link: 0,
      }
    }
    return s
  })
  const d = formation[carIndex]
  if (!d) {
    context.log.error(`対象のでんこが見つかりません side: ${which} carIndex: ${carIndex}, formation.length: ${formation.length}`)
  }
  return {
    user: copyState<UserParam>(f.user),
    carIndex: carIndex,
    formation: formation,
    triggeredSkills: [],
    probabilityBoostPercent: 0,
    probabilityBoosted: false,
    score: {
      access: 0,
      skill: 0,
      link: 0,
    },
    displayedScore: 0,
    displayedExp: 0,
  }
}
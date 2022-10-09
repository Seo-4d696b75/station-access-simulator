import { Context } from "../context"
import { refreshSkillState } from "../skill"
import { copyState, ReadonlyState } from "../state"
import { LinksResult } from "../station"
import { refreshEXPState, UserState } from "../user"
import { AccessConfig, AccessDencoState, AccessSide, AccessSideState, AccessState } from "./access"
import { calcLinksResult } from "./score"
import { filterActiveSkill } from "./skill"
/**
 * アクセスの結果
 * 
 * アクセス終了後の状態で、アクセス直後に発生した他のイベント  
 * - リブートによるリンクの解除・リンクスコア＆経験値の追加
 * - 経験値の追加によるレベルアップ
 * - アクセス直後に発動したスキル  
 * 
 * による状態の変化も含まれる
 * 
 * アクセスによって更新された攻守両側の状態は`offense, defense`を参照すること
 */
export interface AccessResult extends AccessState {
  offense: AccessUserResult
  defense?: AccessUserResult
}

/**
 * アクセス終了後の攻守各側の状態
 */
export interface AccessUserResult extends AccessSideState, UserState {
  formation: AccessDencoResult[]
}

/**
 * アクセス終了後のでんこの状態
 * 
 * 
 */
export interface AccessDencoResult extends AccessDencoState {
  /**
   * アクセスによってリブートしたリンク
   * 
   * リブート（{@link AccessDencoState reboot} === true）した場合は解除したすべてのリンク結果、  
   * リブートを伴わないフットバースの場合は解除したひとつのリンク結果
   */
  disconnectedLink?: LinksResult

  /**
   * 現在のHP
   */
  currentHp: number
}

/**
 * アクセス終了後の処理
 * @param context 
 * @param config 
 * @param access 
 * @returns 
 */
export function completeAccess(context: Context, config: AccessConfig, access: ReadonlyState<AccessState>): AccessResult {
  let result: AccessResult = {
    ...copyState(access),
    offense: initUserResult(context, config.offense.state, access, "offense"),
    defense: config.defense ? initUserResult(context, config.defense.state, access, "defense") : undefined,
  }

  // 各でんこのリンク状態を計算
  completeDencoLink(context, result, "offense")
  completeDencoLink(context, result, "defense")

  // 経験値の反映
  completeDencoEXP(context, result, "offense")
  completeDencoEXP(context, result, "defense")

  // アクセスイベントを追加
  addAccessEvent(context, config.offense.state, result, "offense")
  addAccessEvent(context, config.defense?.state, result, "defense")

  // レベルアップ処理
  checkLevelup(context, result)

  // アクセス直後のスキル発動イベント
  checkSKillState(context, result)
  checkSkillAfterAccess(context, result, "offense")
  checkSkillAfterAccess(context, result, "defense")
  checkSKillState(context, result)


  return result
}



function initUserResult(context: Context, state: ReadonlyState<UserState>, access: ReadonlyState<AccessState>, which: AccessSide): AccessUserResult {
  const side = (which === "offense") ? access.offense : access.defense
  if (!side) {
    context.log.error(`アクセス結果の初期化に失敗`)
    throw Error()
  }

  return {
    // UserState
    ...copyState<UserState>(state),
    event: [],
    // AccessSideState
    ...copyState<AccessSideState>(side),
  }
}

function completeDencoLink(context: Context, state: AccessResult, which: AccessSide) {
  const side = which === "offense" ? state.offense : state.defense
  // 編成全員のリンク解除を確認する
  side?.formation.map(d => {
    if (d.reboot) {
      // リブートにより全リンク解除
      const disconnectedLink = d.link
      d.link = []
      const linkResult = calcLinksResult(context, disconnectedLink, d, which)
      d.exp.link = linkResult.exp
      d.disconnectedLink = linkResult
      side.score.link = linkResult.totalScore
      side.event.push({
        type: "reboot",
        data: linkResult,
      })
    } else if (d.who === "offense" && state.linkSuccess) {
      // 攻撃側のリンク成功
      d.link.push({
        ...state.station,
        start: context.currentTime,
      })
    } else if (d.who === "defense" && state.linkDisconnected) {
      // 守備側のリンク解除 フットバースなどリブートを伴わない場合
      const idx = d.link.findIndex(link => link.name === state.station.name)
      if (idx < 0) {
        context.log.error(`リンク解除した守備側のリンクが見つかりません ${state.station.name}`)
        throw Error()
      }
      // 対象リンクのみ解除
      const disconnectedLink = d.link[idx]
      d.link.splice(idx, 1)
      const linkResult = calcLinksResult(context, [disconnectedLink], d, "defense")
      // 特にイベントは発生せず経験値だけ追加
      d.exp.link = linkResult.exp
      d.disconnectedLink = linkResult
      side.score.link = linkResult.totalScore
    }
  })
}

function completeDencoEXP(context: Context, state: AccessResult, which: AccessSide) {
  const side = which === "offense" ? state.offense : state.defense
  side?.formation?.forEach(d => {
    // アクセスによる経験値付与
    const exp = d.exp.access + d.exp.skill + d.exp.link
    if (d.who !== "other" || exp !== 0) {
      context.log.log(`経験値追加 ${d.name} ${d.currentExp}(current) + ${exp} -> ${d.currentExp + exp}`)
      context.log.log(`経験値詳細 access:${d.exp.access} skill:${d.exp.skill} link:${d.exp.link}`)
    }
    d.currentExp += exp
  })
}

function addAccessEvent(context: Context, origin: ReadonlyState<UserState> | undefined, result: AccessResult, which: AccessSide) {
  const side = (which === "offense") ? result.offense : result.defense
  if (!side || !origin) return
  side.event = [
    ...origin.event,
    {
      // このアクセスイベントを追加
      type: "access",
      data: {
        access: copyState(result),
        which: which
      }
    },
    ...side.event
  ]
}

function checkLevelup(context: Context, result: AccessResult) {
  refreshEXPState(context, result.offense)
  if (result.defense) {
    refreshEXPState(context, result.defense)
  }
}

function checkSKillState(context: Context, result: AccessResult) {
  refreshSkillState(context, result.offense)
  if (result.defense) {
    refreshSkillState(context, result.defense)
  }
}

function checkSkillAfterAccess(context: Context, state: AccessResult, which: AccessSide) {
  const side = (which === "offense") ? state.offense : state.defense
  if (!side) return
  let formation = side
  filterActiveSkill(side.formation).forEach(idx => {
    // スキル発動による状態変更を考慮して評価直前にコピー
    const d = copyState(formation.formation[idx])
    const skill = d.skill
    if (skill.type !== "possess") {
      context.log.error(`スキル評価処理中にスキル保有状態が変更しています ${d.name} possess => ${skill.type}`)
      throw Error()
    }
    const predicate = skill?.onAccessComplete
    if (skill && predicate) {
      const self = {
        ...d,
        skill: skill,
      }
      const next = predicate(context, formation, self, state)
      if (next) {
        formation = next
      }
    }
  })
  if (which === "offense") {
    state.offense = formation
  } else {
    state.defense = formation
  }
}
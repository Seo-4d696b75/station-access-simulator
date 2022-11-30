import { AccessConfig } from "."
import { assert, Context } from "../context"
import { DencoState } from "../denco"
import { isSkillActive } from "../skill"
import { withSkill } from "../skill/property"
import { refreshSkillState } from "../skill/refresh"
import { copyState, copyStateTo, ReadonlyState } from "../state"
import { LinksResult, Station } from "../station"
import { UserState } from "../user"
import { refreshEXPState } from "../user/refresh"
import { calcLinksResult } from "./score"
import { AccessDencoState, AccessSide, AccessSideState, AccessState } from "./state"
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
export interface AccessResult extends Omit<AccessState, "offense" | "defense"> {
  offense: AccessUserResult
  defense?: AccessUserResult
}

/**
 * アクセス終了後の攻守各側の状態
 */
export interface AccessUserResult extends Omit<AccessSideState, "user">, UserState {
  formation: AccessDencoResult[]
}

/**
 * アクセス終了後のでんこの状態
 * 
 * 
 */
export interface AccessDencoResult extends AccessDencoState {
  /**
   * アクセスによって解除されたリンク
   * 
   * - ダメージを受けてリブートした場合は保持していた全リンク
   * - フットバーされた場合は単独リンクのみ解除
   * 
   * カウンター攻撃を受ける場合など、リンク解除を伴わないリブート時は`undefined`です
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
    ...copyState<AccessState>(access),
    offense: initUserResult(context, config.offense.state, access, "offense"),
    defense: config.defense ? initUserResult(context, config.defense.state, access, "defense") : undefined,
  }

  // 各でんこのリンク状態を計算
  completeDencoLink(context, result, "offense")
  completeDencoLink(context, result, "defense")

  // 経験値の反映
  completeDencoEXP(context, result, "offense")
  completeDencoEXP(context, result, "defense")

  // レベルアップ処理
  checkLevelup(context, result)

  // アクセスイベントを追加
  addAccessEvent(context, config.offense.state, result, "offense")
  addAccessEvent(context, config.defense?.state, result, "defense")


  // アクセス直後のスキル発動イベント
  checkSKillState(context, result)
  callbackReboot(context, result, "offense")
  callbackReboot(context, result, "defense")
  callbackLinkDisconnect(context, result, "offense")
  callbackLinkDisconnect(context, result, "defense")
  callbackLinkStarted(context, result)
  callbackAfterAccess(context, result, "offense")
  callbackAfterAccess(context, result, "defense")
  checkSKillState(context, result)


  return result
}



function initUserResult(context: Context, state: ReadonlyState<UserState>, access: ReadonlyState<AccessState>, which: AccessSide): AccessUserResult {
  const side = (which === "offense") ? access.offense : access.defense
  if (!side) {
    context.log.error(`アクセス結果の初期化に失敗`)
  }

  const after = copyState<AccessSideState>(side)
  const before = copyState<UserState>(state)

  return {
    ...after,
    event: [],
    queue: before.queue,
    user: before.user,
  }
}

function completeDencoLink(context: Context, state: AccessResult, which: AccessSide) {
  const side = which === "offense" ? state.offense : state.defense
  if (!side) return
  // 編成全員のリンク解除を確認する
  side.formation.map(d => {
    if (d.reboot) {
      // リブートにより全リンク解除
      const disconnectedLink = d.link
      d.link = []
      // カウンター攻撃などリンク数0でもリブートする
      const linkResult = calcLinksResult(context, disconnectedLink, d)
      if (linkResult.link.length > 0) {
        // 解除リンク数1以上の場合
        d.exp.link = linkResult.exp
        d.disconnectedLink = linkResult
        side.score.link = linkResult.totalScore
      }
      // リンク数0でもリブートイベントは追加する！
      side.event.push({
        type: "reboot",
        data: linkResult,
      })
    } else if (d.who === "offense" && state.linkSuccess) {
      // 攻撃側のリンク成功
      d.link.push({
        ...copyState<Station>(state.station),
        start: context.currentTime,
      })
    } else if (d.who === "defense" && state.linkDisconnected) {
      // 守備側のリンク解除 フットバースなどリブートを伴わない場合
      const idx = d.link.findIndex(link => link.name === state.station.name)
      if (idx < 0) {
        context.log.error(`リンク解除した守備側のリンクが見つかりません ${state.station.name}`)
      }
      // 対象リンクのみ解除
      const disconnectedLink = d.link[idx]
      d.link.splice(idx, 1)
      const linkResult = calcLinksResult(context, [disconnectedLink], d)
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

function callbackReboot(context: Context, state: AccessResult, which: AccessSide) {
  const side = which === "offense" ? state.offense : state.defense
  if (!side) return

  // リブートのコールバック
  // コールバックで状態が変化する場合があるので最初に対象を検査
  // 無効化スキルの影響は無視
  side.formation
    .filter(d => isSkillActive(d.skill))
    .filter(d => d.reboot)
    .map(d => d.carIndex)
    .forEach(idx => {
      const d = side.formation[idx]
      const skill = d.skill
      if (skill.type === "possess" && skill.onDencoReboot) {
        const next = skill.onDencoReboot(context, side, withSkill(d, skill, idx))
        if (next) {
          copyStateTo<UserState>(next, side)
        }
      }
    })
}

function callbackLinkDisconnect(context: Context, state: AccessResult, which: AccessSide) {
  const side = (which === "offense") ? state.offense : state.defense
  if (!side) return

  // リンク解除のコールバック
  // 編成内の全でんこにコールバックする!
  // このコールバック中に新たにリンクが解除される場合は考慮しない
  const disconnects = side
    .formation
    .map(d => d.disconnectedLink)
    .filter((d): d is LinksResult => !!d && d.link.length > 0)
  if (disconnects.length === 0) return

  // コールバックで状態が変化する場合があるので最初に対象を検査
  // 無効化スキルの影響は無視
  side.formation
    .filter(d => isSkillActive(d.skill))
    .map(d => d.carIndex)
    .forEach(idx => {
      disconnects.forEach(disconnect => {
        // スキル発動による状態変更を考慮して評価直前に参照
        const d = side.formation[idx]
        const skill = d.skill
        if (skill.type === "possess" && skill.onLinkDisconnected) {
          const next = skill.onLinkDisconnected(context, side, withSkill(d, skill, idx), disconnect)
          if (next) {
            copyStateTo<UserState>(next, side)
          }
        }
      })
    })

}

function callbackLinkStarted(context: Context, state: AccessResult) {
  // 原則としてアクセスする側のみ
  const side = state.offense

  // リンク開始のコールバック
  if (!state.linkSuccess) return
  // 編成内の全でんこにコールバックする!
  // このコールバック中に新たにリンクが開始される場合は考慮しない
  const d = side.formation[side.carIndex]
  const link = d.link.find(l => l.name === state.station.name)
  assert(link, `獲得したリンクが見つかりません: ${state.station.name}`)

  const start = {
    ...copyState(link),
    denco: copyState<DencoState>(d),
  }

  // コールバックで状態が変化する場合があるので最初に対象を検査
  // 無効化スキルの影響は無視
  side.formation
    .filter(d => isSkillActive(d.skill))
    .map(d => d.carIndex)
    .forEach(idx => {
      // スキル発動による状態変更を考慮して評価直前に参照
      const d = side.formation[idx]
      const skill = d.skill
      if (skill.type === "possess" && skill.onLinkStarted) {
        const next = skill.onLinkStarted(context, side, withSkill(d, skill, idx), start)
        if (next) {
          copyStateTo<UserState>(next, side)
        }
      }
    })
}

function callbackAfterAccess(context: Context, state: AccessResult, which: AccessSide) {
  const side = (which === "offense") ? state.offense : state.defense
  if (!side) return
  let formation = side
  side.formation
    .filter(d => d.skill.type === "possess") // 保有スキルすべてにコールバック
    .map(d => d.carIndex)
    .forEach(idx => {
      // スキル発動による状態変更を考慮して評価直前にコピー
      const d = copyState(formation.formation[idx])
      const skill = d.skill
      if (skill.type !== "possess") {
        context.log.error(`スキル評価処理中にスキル保有状態が変更しています ${d.name} possess => ${skill.type}`)
      }
      if (skill && skill.onAccessComplete) {
        const next = skill.onAccessComplete(context, formation, withSkill(d, skill, idx), state)
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

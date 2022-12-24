import { AccessConfig } from "."
import { copy, merge } from "../../"
import { assert, Context } from "../context"
import { withSkill } from "../skill/property"
import { refreshSkillState } from "../skill/refresh"
import { ReadonlyState } from "../state"
import { LinksResult } from "../station"
import { UserState } from "../user"
import { refreshEXPState } from "../user/refresh"
import { calcExpPercent, calcLinksResult, calcScorePercent, ScoreExpResult } from "./score"
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

  score: ScoreExpResult

  /**
   * アクセス表示用のスコア値
   * 
   * アクセスで発生したスコア（リンクスコア除く） + 守備側のリンクが解除された場合のその駅のリンクスコア
   */
  displayedScore: number

  /**
   * アクセス表示用の経験値値
   * 
    * アクセス・被アクセスするでんこがアクセス中に得た経験値（リンクスコア除く） + 守備側のリンクが解除された場合のその駅のリンクスコア
   */
  displayedExp: number
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

  exp: ScoreExpResult
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
    ...copy.AccessState(access),
    offense: initUserResult(context, config.offense.state, access, "offense"),
    defense: config.defense ? initUserResult(context, config.defense.state, access, "defense") : undefined,
  }

  // 各でんこのリンク状態を計算
  completeDencoLink(context, result, "offense")
  completeDencoLink(context, result, "defense")

  // 経験値の増減・現在の経験値に反映
  completeDencoEXP(context, result, "offense")
  completeDencoEXP(context, result, "defense")

  // スコアの増減
  completeUserScore(context, result, "offense")
  completeUserScore(context, result, "defense")

  // 表示用の経験値＆スコアの計算
  completeDisplayScoreExp(context, result, "offense")
  completeDisplayScoreExp(context, result, "defense")

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

  const after = copy.AccessSideState(side)
  const before = copy.UserState(state)

  return {
    ...after,
    event: [],
    queue: before.queue,
    user: before.user,
    formation: after.formation.map(d => ({
      ...d,
      exp: {
        ...d.exp,
        total: 0,
        access: {
          ...d.exp.access,
          total: 0,
        }
      }
    })),
    displayedScore: 0,
    displayedExp: 0,
    score: {
      ...after.score,
      total: 0,
      access: {
        ...after.score.access,
        total: 0
      }
    }
  }
}

function completeDencoLink(context: Context, state: AccessResult, which: AccessSide) {
  const side = which === "offense" ? state.offense : state.defense
  if (!side) return
  // 編成全員のリンク解除を確認する
  side.formation.map((d, i) => {
    if (d.reboot) {
      // リブートにより全リンク解除
      const disconnectedLink = d.link
      d.link = []
      // カウンター攻撃などリンク数0でもリブートする
      const linkResult = calcLinksResult(context, disconnectedLink, side, i)
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
        ...copy.Station(state.station),
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
      const linkResult = calcLinksResult(context, [disconnectedLink], side, i)
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
    // スキルによる経験値付与なども考慮して編成内全員を確認すること！
    // スキル・フィルムによる獲得経験値の増減
    d.exp.access.accessBonus = calcExpPercent(d.exp.access.accessBonus, d, "access_bonus")
    d.exp.access.damageBonus = calcExpPercent(d.exp.access.damageBonus, d, "damage_bonus")
    d.exp.access.linkBonus = calcExpPercent(d.exp.access.linkBonus, d, "link_bonus")
    d.exp.access.total = d.exp.access.accessBonus
      + d.exp.access.damageBonus + d.exp.access.linkBonus
    // d.exp.skill スキルによる経験値付与（固定値）は変化しない！
    // d.exp.link リンク経験値には反映済み
    // 合計値
    d.exp.total = d.exp.access.total + d.exp.skill + d.exp.link
    const exp = d.exp.access.accessBonus + d.exp.access.damageBonus
      + d.exp.access.linkBonus + d.exp.skill + d.exp.link
    if (d.who !== "other" || exp !== 0) {
      context.log.log(`経験値追加 ${d.name} ${d.currentExp}(current) + ${exp} -> ${d.currentExp + exp}`)
      context.log.log(`経験値詳細 access:${d.exp.access} skill:${d.exp.skill} link:${d.exp.link}`)
    }
    d.currentExp += exp
  })
}

function completeUserScore(context: Context, state: AccessResult, which: AccessSide) {
  const side = which === "offense" ? state.offense : state.defense
  if (!side) return
  // スキルによる獲得スコア増減
  side.score.access.accessBonus = calcScorePercent(side.score.access.accessBonus, side, "access_bonus")
  side.score.access.damageBonus = calcScorePercent(side.score.access.damageBonus, side, "damage_bonus")
  side.score.access.linkBonus = calcScorePercent(side.score.access.linkBonus, side, "link_bonus")
  side.score.access.total = side.score.access.accessBonus
    + side.score.access.damageBonus + side.score.access.linkBonus
  // score.skill スキルによるスコア付与（固定値）は変化しない！
  // score.link リンクスコアには反映済み
  // 合計値
  side.score.total = side.score.access.total + side.score.skill + side.score.link
}

/**
 * 表示用の経験値＆スコアの計算（破壊的）
 * 
 * @param context 
 * @param state 
 * @param which 
 */
export function completeDisplayScoreExp(context: Context, state: AccessResult, which: AccessSide) {
  const side = which === "offense" ? state.offense : state.defense
  if (!side) return
  // 基本的には直接アクセスするでんこの経験値とスコア
  const d = side.formation[side.carIndex]
  // アクセスで獲得する・リンクスコア＆経験値はそのまま
  side.displayedScore = side.score.access.accessBonus + side.score.access.damageBonus
    + side.score.access.linkBonus + side.score.skill
  side.displayedExp = d.exp.access.accessBonus + d.exp.access.damageBonus + d.exp.access.linkBonus + d.exp.skill
  // 守備側がリンク解除（フットバースorリブート）した場合はその駅のリンクのスコア＆経験値を表示
  if (state.linkDisconnected && d.who === "defense") {
    assert(d.disconnectedLink)
    const idx = d.disconnectedLink.link.findIndex(l => l.name === state.station.name)
    assert(idx >= 0, `リブートした守備側のリンクが見つかりません ${state.station.name}`)
    const link = d.disconnectedLink.link[idx]
    side.displayedScore += link.totalScore
    side.displayedExp += link.exp
  }
}

function addAccessEvent(context: Context, origin: ReadonlyState<UserState> | undefined, result: AccessResult, which: AccessSide) {
  const side = (which === "offense") ? result.offense : result.defense
  if (!side || !origin) return
  side.event = [
    ...origin.event.map(e => copy.Event(e)),
    {
      // このアクセスイベントを追加
      type: "access",
      data: copy.AccessEventData({
        ...result,
        which: which
      })
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
  // 保有スキルすべてにコールバック
  side.formation
    .filter(d => d.skill.type === "possess")
    .filter(d => d.reboot)
    .map(d => d.carIndex)
    .forEach(idx => {
      const d = side.formation[idx]
      const skill = d.skill
      if (skill.type === "possess" && skill.onDencoReboot) {
        const active = withSkill(copy.AccessDencoResult(d), skill, idx)
        const next = skill.onDencoReboot(context, side, active)
        if (next) merge.UserState(side, next)
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
  // 保有スキルすべてにコールバック
  side.formation
    .filter(d => d.skill.type === "possess")
    .map(d => d.carIndex)
    .forEach(idx => {
      disconnects.forEach(disconnect => {
        // スキル発動による状態変更を考慮して評価直前に参照
        const d = side.formation[idx]
        const skill = d.skill
        if (skill.type === "possess" && skill.onLinkDisconnected) {
          const active = withSkill(copy.DencoState(d), skill, idx)
          const next = skill.onLinkDisconnected(context, side, active, disconnect)
          if (next) merge.UserState(side, next)
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
    ...copy.StationLink(link),
    denco: copy.DencoState(d),
  }

  // コールバックで状態が変化する場合があるので最初に対象を検査
  // 保有スキルすべてにコールバック
  side.formation
    .filter(d => d.skill.type === "possess")
    .map(d => d.carIndex)
    .forEach(idx => {
      // スキル発動による状態変更を考慮して評価直前に参照
      const d = side.formation[idx]
      const skill = d.skill
      if (skill.type === "possess" && skill.onLinkStarted) {
        const active = withSkill(copy.DencoState(d), skill, idx)
        const next = skill.onLinkStarted(context, side, active, start)
        if (next) merge.UserState(side, next)
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
      const d = copy.AccessDencoResult(formation.formation[idx])
      const skill = d.skill
      if (skill.type !== "possess") {
        context.log.error(`スキル評価処理中にスキル保有状態が変更しています ${d.name} possess => ${skill.type}`)
      }
      if (skill && skill.onAccessComplete) {
        const active = withSkill(d, skill, idx)
        const next = skill.onAccessComplete(context, formation, active, state)
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

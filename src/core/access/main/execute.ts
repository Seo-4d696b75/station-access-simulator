import { AccessState, addDamage, calcAccessDamage, getAccessDenco, getDefense, hasActiveSkill, hasDefense } from ".."
import { Context } from "../../context"
import { copyState, ReadonlyState } from "../../state"
import { calcAccessScoreExp, calcDamageScoreExp, calcLinkScoreExp } from "../score"
import { completeDisplayScoreExp } from "./display"
import { completeDencoHP, updateDencoHP } from "./hp"
import { checkProbabilityBoost, triggerSkillAt } from "./skill"

/**
 * アクセスを処理する
 * 
 * スキル発動・ダメージ計算・HPの変化・リンク成功・リブート有無までを処理する.  
 * アクセス直後に発動する特殊なスキル発動までは含まない
 * 
 * @param context 
 * @param initial アクセス開始時の状態
 * @param top このアクセスがトップレベルの呼び出しか カウンター攻撃などの場合は`false`を指定してください
 * @returns アクセス終了後の状態
 */
export function execute(context: Context, initial: ReadonlyState<AccessState>, top: boolean = true): AccessState {
  let state = copyState<AccessState>(initial)
  if (top) {
    // log active skill
    var names = state.offense.formation
      .filter(d => hasActiveSkill(d))
      .map(d => d.name)
      .join(",")
    context.log.log(`攻撃：${getAccessDenco(state, "offense").name}`)
    context.log.log(`アクティブなスキル(攻撃側): ${names}`)

    if (hasDefense(state)) {
      const defense = getDefense(state)
      names = defense.formation
        .filter(d => hasActiveSkill(d))
        .map(d => d.name)
        .join(",")
      context.log.log(`守備：${getAccessDenco(state, "defense").name}`)
      context.log.log(`アクティブなスキル(守備側): ${names}`)

    } else {
      context.log.log("守備側はいません")
    }

    // pink_check
    // フットバの確認、アイテム優先=>スキル評価
    if (hasDefense(state)) {
      if (state.pinkItemSet) {
        state.pinkItemUsed = true
        state.pinkMode = true
        context.log.log("フットバースアイテムを使用")
      } else {
        // PROBABILITY_CHECK の前に評価する
        // 現状メロしか存在せずこの実装でもよいだろう
        context.log.log("スキルを評価：フットバースの確認")
        state = triggerSkillAt(context, state, "pink_check")
      }
    }
    if (state.pinkMode) context.log.log("フットバースが発動！")

    // 確率補正の可能性 とりあえず発動させて後で調整
    context.log.log("スキルを評価：確率ブーストの確認")
    state = triggerSkillAt(context, state, "probability_check")


    // アクセスによるスコアと経験値
    const [score, exp] = calcAccessScoreExp(context, state.offense, state.station)
    const accessDenco = getAccessDenco(state, "offense")
    accessDenco.exp.access += exp
    state.offense.score.access += score
    context.log.log(`アクセスによる追加 ${accessDenco.name} score:${score} exp:${exp}`)

  }

  // 他ピンクに関係なく発動するもの
  context.log.log("スキルを評価：アクセス開始前")
  state = triggerSkillAt(context, state, "before_access")
  context.log.log("スキルを評価：アクセス開始")
  state = triggerSkillAt(context, state, "start_access")


  if (hasDefense(state) && !state.pinkMode) {
    context.log.log("攻守のダメージ計算を開始")

    // 属性ダメージの補正値
    const attrOffense = getAccessDenco(state, "offense").attr
    const attrDefense = getAccessDenco(state, "defense").attr
    const attr = (attrOffense === "cool" && attrDefense === "heat") ||
      (attrOffense === "heat" && attrDefense === "eco") ||
      (attrOffense === "eco" && attrDefense === "cool")
    if (attr) {
      state.damageRatio = 1.3
      context.log.log("攻守の属性によるダメージ補正が適用：1.3")
    } else {
      state.damageRatio = 1.0
    }

    // TODO filmによる増減の設定
    context.log.warn("フィルムによる補正をスキップ")

    // ダメージ増減の設定
    context.log.log("スキルを評価：ATK&DEFの増減")
    state = triggerSkillAt(context, state, "damage_common")

    // 特殊なダメージの計算
    context.log.log("スキルを評価：特殊なダメージ計算")
    state = triggerSkillAt(context, state, "damage_special")

    // 基本ダメージの計算
    if (!state.damageBase) {
      state.damageBase = {
        variable: calcAccessDamage(context, state),
        constant: 0
      }
    }

    // 固定ダメージの計算
    context.log.log("スキルを評価：固定ダメージ")
    state = triggerSkillAt(context, state, "damage_fixed")
    context.log.log(`固定ダメージの計算：${state.damageFixed}`)

    // 最終ダメージ計算 固定ダメージ等の影響でも負数にはならない
    const defense = getAccessDenco(state, "defense")
    const damageBase = state.damageBase
    if (!damageBase) {
      context.log.error("基本ダメージの値が見つかりません")
    }
    if (damageBase.variable < 0) {
      context.log.error(`基本ダメージの値は非負である必要があります ${damageBase.variable}`)
    }
    if (damageBase.constant < 0) {
      context.log.log(`基本ダメージ(const.)の値が負数です(回復) ${damageBase.constant}`)
    }
    const damage = {
      // 固定ダメージで負数にはせず0以上に固定 & 確保されたダメージ量を加算
      value: Math.max(damageBase.variable + state.damageFixed, 0) + damageBase.constant,
      attr: state.damageRatio !== 1.0
    }
    // ダメージ量に応じたスコア＆経験値の追加
    const [score, exp] = calcDamageScoreExp(context, damage.value)
    const accessDenco = getAccessDenco(state, "offense")
    accessDenco.exp.access += exp
    state.offense.score.access += score
    context.log.log(`ダメージ量による追加 ${accessDenco.name} score:${score} exp:${exp}`)
    // 反撃など複数回のダメージ計算が発生する場合はそのまま加算
    const damageSum = addDamage(defense.damage, damage)
    context.log.log(`ダメージ計算が終了：${damageSum.value}`)

    // 攻守ふたりに関してアクセス結果を仮決定
    defense.damage = damageSum

    // HPの決定 & HP0 になったらリブート
    updateDencoHP(context, defense)

    // 被アクセス側がリブートしたらリンク解除（ピンク除く）
    state.linkDisconnected = defense.reboot

    // 被アクセス側がリンク解除、かつアクセス側がリブートしていない
    state.linkSuccess = state.linkDisconnected

    context.log.log(`守備の結果 HP: ${defense.hpBefore} > ${defense.hpAfter} reboot:${defense.reboot}`)
  } else if (state.pinkMode) {
    // ピンク
    state.linkDisconnected = true
    state.linkSuccess = true
  } else {
    // 相手不在
    state.linkSuccess = true
  }

  context.log.log("アクセス結果を仮決定")
  context.log.log(`攻撃側のリンク成果：${state.linkSuccess}`)
  context.log.log(`守備側のリンク解除：${state.linkDisconnected}`)

  context.log.log("スキルを評価：ダメージ計算完了後")
  state = triggerSkillAt(context, state, "after_damage")

  if (top) {
    context.log.log("最終的なアクセス結果を決定")
    // 最後に確率ブーストの有無を判定
    checkProbabilityBoost(state.offense)
    if (hasDefense(state)) {
      checkProbabilityBoost(state.defense)
    }

    // 最終的なリブート有無＆変化後のHPを計算
    completeDencoHP(context, state, "offense")
    completeDencoHP(context, state, "defense")

    // 最終的なアクセス結果を計算 カウンターで変化する場合あり
    if (hasDefense(state) && !state.pinkMode) {
      let defense = getAccessDenco(state, "defense")
      state.linkDisconnected = defense.reboot
      let offense = getAccessDenco(state, "offense")
      state.linkSuccess = state.linkDisconnected && !offense.reboot
    }
    context.log.log(`攻撃側のリンク成果：${state.linkSuccess}`)
    context.log.log(`守備側のリンク解除：${state.linkDisconnected}`)

    if (state.linkSuccess) {
      // リンク成功によるスコア＆経験値の付与
      const [score, exp] = calcLinkScoreExp(context, state.offense, state)
      const linkDenco = getAccessDenco(state, "offense")
      linkDenco.exp.access += exp
      state.offense.score.access += score
      context.log.log(`リンク成功による追加 ${linkDenco.name} score:${score} exp:${exp}`)
    }

    // 表示用の経験値＆スコアの計算
    completeDisplayScoreExp(context, state, "offense")
    completeDisplayScoreExp(context, state, "defense")

  }
  return state
}

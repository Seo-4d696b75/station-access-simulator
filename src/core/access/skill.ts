import { copy } from "../../";
import { Context } from "../context";
import { Denco } from "../denco";
import { random } from "../random";
import { canSkillInvalidated } from "../skill";
import { SkillProperty, withSkill } from "../skill/property";
import { AccessSkillEffect, AccessSkillTriggerState, SkillEffectState } from "../skill/trigger";
import { ReadonlyState } from "../state";
import { AccessDencoState, AccessSide, AccessSideState, AccessSkillStep, AccessState } from "./state";

/**
 * アクセス時に発動したスキル効果の処理
 *
 * @param state 可変(mutable)です. スキル効果による状態変化を直接書き込めます.
 * @return `AccessState`を返す場合は返り値で状態を更新します.
 *   `undefined`を返す場合は引数`state`を次の状態として扱います.
 */

export type AccessSkillRecipe = (state: AccessState) => void | AccessState;

/**
 * スキル発動の確率計算の方法・発動時の処理を定義します
 * 
 * ### 複数の発動処理
 * スキル発動の確率計算・発動効果が複数ある場合は配列でも指定できます  
 * 
 */
export type AccessSkillTriggers = AccessSkillTrigger | AccessSkillTrigger[]

/**
 * スキル発動の確率計算の方法・発動時の処理を定義します
 * 
 */
export type AccessSkillTrigger = {
  /**
   * スキルの発動確率を指定します
   * 
   * number, string型によって指定方法が変わります
   * 
   * ## number
   * 発動確率[%]を直接指定します
   * 
   * ## string
   * スキルプロパティから発動確率[%]を読み出します  
   * ```js
   * readNumber(probability, 100)
   * ```
   * 
   * - スキルプロパティに未定義の場合はデフォルト値100[%]を使用します. 
   * - **フィルム補正が影響します！** `probability`で定義されたスキル補正により
   * 読み出す発動確率の値[%]が変化する場合があります.
   */
  probability: number | string
  /**
   * スキルが発動した場合の処理を関数として指定します.  
   * {@link probabilityKey}で指定した確率[%]で判定が成功した場合のみ実行されます.
   * 
   * 指定した関数には現在の状態が引数として渡されるので、関数内に状態を更新する処理を定義してください
   */
  recipe: AccessSkillRecipe

  /**
   * {@link probabilityKey}で指定した確率[%]で判定が失敗したときの処理
   * 
   * 判定失敗時の処理が定義されている場合は{@link recipe}, {@link fallbackRecipe}のどちらか必ず発動し、
   * いずれの場合でも**スキルは発動した扱いで記録されます**
   */
  fallbackRecipe?: AccessSkillRecipe
}

/**
 * 指定したでんこのスキルが発動済みか確認する
 * 
 * @param state 
 * @param denco 
 * @param step `undefined`の場合は`denco`の一致でのみ検索する
 * @returns true if has been triggered
 */
export function hasSkillTriggered(state: ReadonlyState<{skillTriggers: AccessSkillTriggerState[]}>, which: AccessSide, denco: ReadonlyState<Denco> | string): boolean {
  return getSkillEffectState(state, which, denco).some(e => e.triggered)
}

export function hasSkillInvalidated(state: ReadonlyState<{skillTriggers: AccessSkillTriggerState[]}>, which: AccessSide, denco: ReadonlyState<Denco> | string): boolean {
  return getSkillEffectState(state, which, denco).some(e => e.invalidated)
}

export function getSkillEffectState(state: ReadonlyState<{skillTriggers: AccessSkillTriggerState[]}>, which: AccessSide, denco: ReadonlyState<Denco> | string): SkillEffectState<AccessSkillEffect>[]{
  return getSkillTriggerState(state, which, denco).map(t => t.effect).flat()
}

export function getSkillTriggerState(state: ReadonlyState<{skillTriggers: AccessSkillTriggerState[]}>, which: AccessSide, denco: ReadonlyState<Denco> | string): ReadonlyState<AccessSkillTriggerState>[]{
  const predicate = (d: ReadonlyState<Denco>) => {
    return typeof denco === "object"
      ? d.numbering === denco.numbering
      : denco.match(/^[a-z]+$/)
      ? d.name === denco
      : d.numbering === denco
  }
  return state.skillTriggers
    .filter(t => t.denco.which === which && predicate(t.denco))
}

/**
 * アクセス中のスキル無効化の影響も考慮してアクティブなスキルか判定
 * 
 * - スキルを保有する
 * - 保有するスキルがactive
 * - 無効化の影響を受けていない
 * - アクセス時に影響を受けるスキルである  
 * 
 * {@link canSkillInvalidated}と同様の実装
 * 
 * @param d 
 * @returns 
 */
export function hasValidatedSkill(d: ReadonlyState<AccessDencoState>): boolean {
  return canSkillInvalidated(d)
}

/**
 * アクセス処理中のスキル発動判定の対象となるスキルを選択
 * 
 * see {@link hasValidatedSkill}
 * 
 * @param state 現在の状態
 * @param which 守備・攻撃側どちらか
 * @returns 対象のスキルを保有するでんこの編成内の位置
 */
export function filterValidatedSkill(state: ReadonlyState<AccessState>, which: AccessSide): number[] {
  if (which === "defense" && !state.defense) return []
  const formation = (which === "offense") ?
    state.offense.formation : state.defense!.formation
  return formation.filter(d => {
    return hasValidatedSkill(d)
  }).map(d => d.carIndex)
}

/**
 * 各段階でスキルを評価する
 * @param context 
 * @param current 現在の状態
 * @param step どの段階を評価するか
 * @returns 新しい状態
 */
export function triggerSkillAt(
  context: Context,
  current: ReadonlyState<AccessState>,
  step: AccessSkillStep,
): AccessState {
  let state = copy.AccessState(current)

  // 攻撃側 > 守備側の順序で発動判定・発動処理を行う
  // ただし、発動判定は各編成内で一括で行う
  // 同編成内のスキル無効化は互いに無効化はしない
  state = triggerSkillOnSide(
    context,
    state,
    step,
    "offense",
    filterValidatedSkill(state, "offense"),
  )
  state = triggerSkillOnSide(
    context,
    state,
    step,
    "defense",
    filterValidatedSkill(state, "defense"),
  )
  return state
}


/**
 * 各段階でスキルを評価する **破壊的**
 * @param context 
 * @param state 現在の状態
 * @param step どの段階を評価するか
 * @param which 攻撃・守備側どちらか
 * @param indices スキルの発動判定の対象 スキル無効化の影響などで対象外の場合はindicesに含めない
 * @returns 新しい状態
 */
export function triggerSkillOnSide(
  context: Context,
  state: AccessState,
  step: AccessSkillStep,
  which: AccessSide,
  indices: number[],
): AccessState {
  const sideName = (which === "offense") ? "攻撃側" : "守備側"
  const side = (which === "offense") ? state.offense : state.defense
  if (!side) return state
  indices.forEach(idx => {
    // 他スキルの発動で状態が変化する場合があるので毎度参照してからコピーする
    const d = copy.AccessDencoState(side.formation[idx])
    const skill = d.skill
    if (skill.type !== "possess") {
      context.log.error(`スキル評価処理中にスキル保有状態が変更しています ${d.name} possess => ${skill.type}`)
    }
    if (skill.triggerOnAccess) {
      // 状態に依存するスキル発動有無の判定は毎度行う
      const active = withSkill(d, skill, idx)
      const result = skill.triggerOnAccess(context, state, step, active)
      const recipes = getTargetRecipes(context, state, step, d, result, active.skill.property)
      recipes.forEach(recipe => {
        markTriggerSkill(side, step, d)
        context.log.log(`スキルが発動(${sideName}) name:${d.name}(${d.numbering}) skill:${skill.name}`)
        state = recipe(state) ?? state
      })
    }
  })
  return state
}

function getTargetRecipes(context: Context, state: AccessState, step: AccessSkillStep, d: ReadonlyState<AccessDencoState>, result: void | AccessSkillTriggers, property: SkillProperty): AccessSkillRecipe[] {
  if (typeof result === "undefined") return []
  const list = Array.isArray(result) ? result : [result]
  const recipe: AccessSkillRecipe[] = []
  list.forEach(trigger => {
    const r = canTriggerSkill(context, state, d, trigger, property)
    if (r) recipe.push(r)
  })
  return recipe
}

/**
 * スキルのロジックと発動確率まで総合して発動有無を判定する
 * 
 * 確率計算が発生する場合は確率補正の有無を記録する（破壊的）
 * 
 * @param state 
 * @param d 発動する可能性があるアクティブなスキル
 * @returns 
 */
function canTriggerSkill(context: Context, state: AccessState, d: ReadonlyState<AccessDencoState>, trigger: AccessSkillTrigger, property: SkillProperty): AccessSkillRecipe | null {
  let percent = typeof trigger.probability === "number"
    ? trigger.probability
    : property.readNumber(trigger.probability, 100)
  percent = Math.min(percent, 100)
  percent = Math.max(percent, 0)
  if (percent >= 100) return trigger.recipe
  if (percent <= 0) return canTriggerOnFailure(context, trigger)
  // 上記までは確率に依存せず決定可能

  const boost = d.which === "offense" ? state.offense.probabilityBoostPercent : state.defense?.probabilityBoostPercent
  if (!boost && boost !== 0) {
    context.log.error("存在しない守備側の確率補正計算を実行しようとしました")
  }
  if (boost !== 0) {
    const v = percent * (1 + boost / 100.0)
    context.log.log(`確率補正: +${boost}% ${percent}% > ${v}%`)
    percent = Math.min(v, 100)
    // 発動の如何を問わず確率補正のスキルは発動した扱いになる
    const defense = state.defense
    if (d.which === "offense") {
      state.offense.probabilityBoosted = true
    } else if (defense) {
      defense.probabilityBoosted = true
    }
  }
  if (random(context, percent)) {
    context.log.log(`スキルが発動できます ${d.name} 確率:${percent}%`)
    return trigger.recipe
  } else {
    context.log.log(`スキルが発動しませんでした ${d.name} 確率:${percent}%`)
    return canTriggerOnFailure(context, trigger)
  }
}

function canTriggerOnFailure(context: Context, trigger: AccessSkillTrigger): AccessSkillRecipe | null {
  if (trigger.fallbackRecipe) {
    context.log.log(`スキル不発時の処理があります`)
    return trigger.fallbackRecipe
  }
  return null
}

function markTriggerSkill(state: AccessSideState, step: AccessSkillStep, denco: Denco) {
}

/**
 * 発動したものの影響がなかった確率ブーストのスキルを発動しなかったことにする（破壊的）
 * 
 * @param d アクセス終了後の状態
 */
export function checkProbabilityBoost(d: AccessSideState) {
}
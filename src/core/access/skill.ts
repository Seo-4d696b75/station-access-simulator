import { Context } from "../context";
import { Denco } from "../denco";
import { random } from "../random";
import { isSkillActive } from "../skill";
import { SkillProperty, withActiveSkill } from "../skill/property";
import { copyState, ReadonlyState } from "../state";
import { AccessDencoState, AccessSide, AccessSideState, AccessSkillStep, AccessState, AccessTriggeredSkill } from "./state";
import { getDefense } from "./utils";

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
   * スキルプロパティから発動確率[%]を読み出します  
   * ```js
   * readNumber(probabilityKey, 100)
   * ```
   * 
   * - スキルプロパティに未定義の場合はデフォルト値100[%]を使用します. 
   * - **フィルム補正が影響します！** `probabilityKey`で定義されたスキル補正により
   * 読み出す発動確率の値[%]が変化する場合があります.
   */
  probabilityKey: string
  /**
   * スキルが発動した場合の処理を関数として指定します. 
   * 
   * 指定した関数には現在の状態が引数として渡されるので、関数内に状態を更新する処理を定義してください
   */
  recipe: AccessSkillRecipe
}

/**
 * 指定したでんこのスキルが発動済みか確認する
 * 
 * @param state 
 * @param denco 
 * @param step `undefined`の場合は`denco`の一致でのみ検索する
 * @returns true if has been triggered
 */
export function hasSkillTriggered(state: { readonly triggeredSkills: readonly AccessTriggeredSkill[] } | undefined, denco: Denco, step?: AccessSkillStep): boolean {
  if (!state) return false
  return state.triggeredSkills.findIndex(t => {
    return t.numbering === denco.numbering && (!step || step === t.step)
  }) >= 0
}

/**
 * アクセス中のスキル無効化の影響も考慮してアクティブなスキルか判定
 * @param d 
 * @returns 
 */
export function hasActiveSkill(d: ReadonlyState<AccessDencoState>): boolean {
  return isSkillActive(d.skill) && !d.skillInvalidated
}

export interface SkillTriggerQueueEntry {
  carIndex: number
  which: AccessSide
}

/**
 * 編成からアクティブなスキル（スキルの保有・スキル状態・スキル無効化の影響を考慮）を抽出する
 * @param state
 * @returns 
 */
export function filterActiveSkill(state: ReadonlyState<AccessState>): SkillTriggerQueueEntry[] {
  // 編成順に スキル発動有無の確認 > 発動による状態の更新 
  const list = Array.from(state.offense.formation)
  if (state.defense) {
    list.push(...state.defense.formation)
  }
  return list.filter(d => {
    return hasActiveSkill(d)
  }).map(d => ({
    carIndex: d.carIndex,
    which: d.which,
  }))
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
  target?: readonly SkillTriggerQueueEntry[],
): AccessState {
  let state = copyState<AccessState>(current)
  // ただしアクティブなスキルの確認は初めに一括で行う（同じステップで発動するスキル無効化は互いに影響しない）
  //  const offenseActive = filterActiveSkill(state.offense.formation)
  //const defense = state.defense
  //const defenseActive = defense ? filterActiveSkill(defense.formation) : undefined
  const list = target ?? filterActiveSkill(state)
  list.forEach(entry => {
    const idx = entry.carIndex
    const side = (entry.which === "offense") ? state.offense : getDefense(state)
    const sideName = (entry.which === "offense") ? "攻撃側" : "守備側"
    // 他スキルの発動で状態が変化する場合があるので毎度参照してからコピーする
    const d = copyState<AccessDencoState>(side.formation[idx])
    const skill = d.skill
    if (skill.type !== "possess") {
      context.log.error(`スキル評価処理中にスキル保有状態が変更しています ${d.name} possess => ${skill.type}`)
    }
    if (skill.triggerOnAccess) {
      // 状態に依存するスキル発動有無の判定は毎度行う
      const active = withActiveSkill(d, skill, idx)
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
  let percent = property.readNumber(trigger.probabilityKey, 100)
  percent = Math.min(percent, 100)
  percent = Math.max(percent, 0)
  if (percent >= 100) return trigger.recipe
  if (percent <= 0) return null
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
    return null
  }
}

function markTriggerSkill(state: AccessSideState, step: AccessSkillStep, denco: Denco) {
  const list = state.triggeredSkills
  const idx = list.findIndex(d => d.numbering === denco.numbering)
  if (idx < 0) {
    list.push({
      ...denco,
      step: step
    })
  }
}

/**
 * 発動したものの影響がなかった確率ブーストのスキルを発動しなかったことにする（破壊的）
 * 
 * @param d アクセス終了後の状態
 */
export function checkProbabilityBoost(d: AccessSideState) {
  if (!d.probabilityBoosted && d.probabilityBoostPercent !== 0) {
    d.triggeredSkills = d.triggeredSkills.filter(s => s.step !== "probability_check")
  }
}
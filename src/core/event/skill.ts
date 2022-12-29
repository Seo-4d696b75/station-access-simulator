import { SkillTriggerEvent } from "."
import { copy, merge } from "../../"
import { AccessDencoResult, AccessUserResult } from "../access"
import { assert, Context, withFixedClock } from "../context"
import { Denco, DencoState } from "../denco"
import { random } from "../random"
import { isSkillActive, ProbabilityPercent, Skill, WithSkill } from "../skill"
import { SkillProperty, SkillPropertyReader, withSkill } from "../skill/property"
import { ReadonlyState } from "../state"
import { UserState } from "../user"
import { refreshUserState } from "../user/refresh"

/**
 * スキル発動型のイベントの詳細
 */
export interface EventTriggeredSkill {
  time: number
  carIndex: number
  /**
   * 発動したスキルを保有する本人の状態
   * 
   * スキルが発動して状態が更新された直後の状態
   */
  denco: DencoState
  skillName: string
  step: EventSkillStep
}

/**
 * スキル発動型イベントにおけるスキル評価中の状態
 */
export interface SkillEventState extends UserState {
  time: number

  formation: SkillEventDencoState[]
  carIndex: number

  /**
   * 確率補正%
   */
  probabilityBoostPercent: number
  probabilityBoosted: boolean

}

export interface SkillEventDencoState extends DencoState {
  who: "self" | "other"
  carIndex: number
  skillInvalidated: boolean
}

/**
 * アクセスを除くスキル発動時の評価ステップ
 * 
 * 以下の順序で編成内のスキルを評価する
 * ただし、発動確率の関係で発動なしと処理された場合は"self"はスキップされる
 * 
 * - probability_check 確率を補正する効果を反映（現状はひいるのみ）
 * - self 評価するスキル本体
 * 
 * 評価される編成内のスキルは以下の条件を満たすでんこのスキルを編成順に行われる
 * - スキルを保持している
 * - スキルがactive状態
 * - アクセス直後の場合 {@link SkillLogic}#onAccessComplete は直前のアクセス処理中に無効化スキルの影響を受けていない
 */
export type EventSkillStep =
  "probability_check" |
  "self"

/**
 * スキル発動型イベントにおいてスキル発動時の状態変更を定義します
 * 
 * @param state 現在の状態 可変(mutable)です. スキル効果による状態変化を直接書き込めます.
 * @return `SkillEventState`を返す場合は返り値で状態を更新します.  
 *   `undefined`を返す場合は引数`state`を次の状態として扱います.
 */
export type EventSkillRecipe = (state: SkillEventState) => void | SkillEventState

/**
 * スキル発動型イベントにおいてスキル発動の確率計算の方法・発動時の処理を定義します
 * 
 */
export type EventSkillTrigger = {

  /** 
   * スキルプロパティから発動確率[%]を読み出します  
   * 
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
  recipe: EventSkillRecipe

  /**
   * {@link probabilityKey}で指定した確率[%]で発動判定が失敗したときに実行する処理
   * 
   * こちらの処理は実行されてもスキル発動として記録されません
   */
  fallbackRecipe?: EventSkillRecipe
}

/**
 * アクセス直後のタイミングでスキル発動型のイベントを処理する
 * 
 * {@link Skill onAccessComplete}からの呼び出しが想定されています
 * 
 * ### 発動条件の指定
 * 引数`trigger`で発動の条件・発動のよる状態の更新処理を指定できます.  
 * `trigger.probability`に{@link ProbabilityPercent}を指定した場合は確率補正も考慮して確率計算を行い  
 * 発動が可能な場合のみ`recipe`で指定されたスキル発動時の状態変更を適用します
 * 
 * ### スキル無効化の影響
 * 発動確率以外にも直前のアクセスで該当スキルが無効化されている場合は状態変更は行いません
 * 
 * @param context ログ・乱数等の共通状態
 * @param state 現在の状態
 * @param self スキル発動の主体
 * @param trigger スキル発動の確率計算の方法・発動時の処理方法
 * @returns スキルが発動した場合は効果が反映さらた新しい状態・発動しない場合はstateと同値な状態
 */
export const triggerSkillAfterAccess = (context: Context, state: ReadonlyState<AccessUserResult>, self: ReadonlyState<WithSkill<AccessDencoResult>>, trigger: EventSkillTrigger): AccessUserResult => withFixedClock(context, () => {
  if (!self.skill.active) {
    context.log.error(`スキルの状態がactiveではありません ${self.name}`)
  }
  let next = copy.AccessUserResult(state)
  if (self.skillInvalidated) {
    context.log.log(`スキルが直前のアクセスで無効化されています ${self.name}`)
    return next
  }
  const eventState: SkillEventState = {
    user: copy.UserProperty(state.user),
    time: context.currentTime,
    formation: state.formation.map((d, idx) => {
      return {
        ...copy.DencoState(d),
        who: idx === self.carIndex ? "self" : "other",
        carIndex: idx,
        skillInvalidated: d.skillInvalidated
      }
    }),
    carIndex: self.carIndex,
    event: state.event.map(e => copy.Event(e)),
    queue: state.queue.map(e => copy.EventQueueEntry(e)),
    probabilityBoostPercent: 0,
    probabilityBoosted: false,
  }
  const result = execute(context, eventState, trigger)
  if (result) {
    // スキル発動による影響の反映
    // formation: UserState[], event, queueを更新
    merge.UserState(next, result)
    refreshUserState(context, next)
  }
  return next
})

/**
 * スキルを評価する
 * 
 * アクセス中のスキル発動とは別に単独で発動する場合に使用します  
 * - アクセス直後のタイミングで評価する場合は {@link triggerSkillAfterAccess}を使用してください
 * - アクセス処理中のスキル評価は{@link Skill}のコールバック関数`triggerOnAccess`で行ってください
 * 
 * `probability`に`number`を指定した場合は確率補正も考慮して確率計算を行い  
 * 発動が可能な場合のみ`recipe`で指定されたスキル発動時の状態変更を適用します
 * 
 * @param context 
 * @param state 現在の状態
 * @param self だれのスキルが発動するか
 * @param trigger スキル発動の確率計算の方法・発動時の処理
 * @returns スキルを評価して更新した新しい状態
 */
export function triggerSkillAtEvent(context: Context, state: ReadonlyState<UserState>, self: Denco, trigger: EventSkillTrigger): UserState {
  const idx = state.formation.findIndex(d => d.numbering === self.numbering)
  if (idx < 0) {
    context.log.log(`スキル発動の主体となるでんこが編成内に居ません（終了） formation: ${state.formation.map(d => d.name)}`)
    return copy.UserState(state)
  }
  if (state.formation[idx].skill.type !== "possess") {
    context.log.log(`スキル発動の主体となるでんこがスキルを保有していません（終了） skill: ${state.formation[idx].skill.type}`)
    return copy.UserState(state)
  }
  const eventState: SkillEventState = {
    ...copy.UserState(state),
    time: context.currentTime,
    formation: state.formation.map((d, i) => {
      return {
        ...copy.DencoState(d),
        who: idx === i ? "self" : "other",
        carIndex: i,
        skillInvalidated: false
      }
    }),
    carIndex: idx,
    probabilityBoostPercent: 0,
    probabilityBoosted: false,
  }
  const result = execute(context, eventState, trigger)
  if (result) {
    refreshUserState(context, result)
    return result
  } else {
    return copy.UserState(state)
  }
}

function execute(context: Context, state: SkillEventState, trigger: EventSkillTrigger): SkillEventState | undefined {
  context.log.log(`スキル評価イベントの開始`)
  let self = state.formation[state.carIndex]
  if (self.skill.type !== "possess") {
    context.log.error(`スキルを保持していません ${self.name}`)
  }

  const skill = self.skill
  context.log.log(`${self.name} ${skill.name}`)

  // 主体となるスキルとは別に事前に発動するスキル
  const others = state.formation.filter(s => {
    return isSkillActive(s.skill) && !s.skillInvalidated && s.carIndex !== self.carIndex
  }).map(d => d.carIndex)
  others.forEach(idx => {
    // スキル発動による状態変更を考慮して各評価直前にコピー
    const s = copy.SkillEventDencoState(state.formation[idx])
    const skill = s.skill
    if (skill.type !== "possess") {
      context.log.error(`スキル評価処理中にスキル保有状態が変更しています ${s.name} possess => ${skill.type}`)
    }
    if (!skill.triggerOnEvent) return
    const active = withSkill(s, skill, s.carIndex)
    const trigger = skill.triggerOnEvent?.(context, state, active)
    const recipe = canTriggerSkill(context, state, trigger, active.skill.property)
    if (!recipe) return
    state = recipe(state) ?? state
    let e: SkillTriggerEvent = {
      type: "skill_trigger",
      data: {
        time: state.time.valueOf(),
        carIndex: idx,
        denco: copy.DencoState(state.formation[idx]),
        skillName: skill.name,
        step: "probability_check"
      },
    }
    state.event.push(e)
  })

  // 最新の状態を参照
  self = state.formation[state.carIndex]
  assert(self.skill.type === "possess")
  // スキル発動本人のスキルプロパティwithフィルム補正
  const property = new SkillPropertyReader(self.skill.property, self.film)
  // 発動確率の確認
  const recipe = canTriggerSkill(context, state, trigger, property)
  if (!recipe) {
    context.log.log("スキル評価イベントの終了（発動なし）")
    if (trigger.fallbackRecipe) {
      // 発動失敗時の処理
      context.log.log(`スキル不発時の処理があります`)
      state = trigger.fallbackRecipe(state) ?? state
      // 発動の記録はなし
      state.event = []
      return state
    }
    // 主体となるスキルが発動しない場合は他すべての付随的に発動したスキルも取り消し
    return
  }

  state = recipe(state) ?? state
  let triggerEvent: SkillTriggerEvent = {
    type: "skill_trigger",
    data: {
      time: state.time,
      carIndex: state.carIndex,
      denco: copy.DencoState(state.formation[state.carIndex]),
      skillName: skill.name,
      step: "self"
    },
  }
  state.event.push(triggerEvent)

  // 確率補正が効いたか確認
  checkProbabilityBoosted(state)

  context.log.log("スキル評価イベントの終了")
  return state
}

function canTriggerSkill(context: Context, state: SkillEventState, trigger: EventSkillTrigger | void, property: SkillProperty): EventSkillRecipe | undefined {
  if (typeof trigger === "undefined") return
  let percent = property.readNumber(trigger.probabilityKey, 100)
  const boost = state.probabilityBoostPercent
  if (percent >= 100) {
    return trigger.recipe
  }
  if (percent <= 0) {
    return
  }
  // ここまでは確率に依存せず決定できる（確率補正は効かなかった）

  if (boost !== 0) {
    const v = percent * (1 + boost / 100.0)
    context.log.log(`確率補正: +${boost}% ${percent}% > ${v}%`)
    percent = Math.min(v, 100)
    state.probabilityBoosted = true
  }
  if (random(context, percent)) {
    context.log.log(`スキルが発動できます 確率:${percent}%`)
    return trigger.recipe
  }
  context.log.log(`スキルが発動しませんでした 確率:${percent}%`)
  return
}

function checkProbabilityBoosted(state: SkillEventState) {
  if (!state.probabilityBoosted && state.probabilityBoostPercent !== 0) {
    state.event = state.event.filter(e => !(e.type === "skill_trigger" && e.data.step === "probability_check"))
  }
}
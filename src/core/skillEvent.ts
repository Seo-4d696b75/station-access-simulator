import moment from "moment-timezone";
import { AccessUserResult, copyAccessUserResult, TIME_FORMAT } from "..";
import * as Access from "./access";
import { Context, fixClock, getCurrentTime } from "./context";
import { copyDencoState, Denco, DencoState } from "./denco";
import { Event, SkillTriggerEvent } from "./event";
import { ActiveSkill, isSkillActive, ProbabilityPercent } from "./skill";
import { Station } from "./station";
import { copyUserParam, copyUserState, copyUserStateTo, ReadonlyState, refreshState, refreshUserState, UserParam, UserState } from "./user";

export interface SkillEventDencoState extends DencoState {
  who: "self" | "other"
  carIndex: number
  skillInvalidated: boolean
}

function copySKillEventDencoState(state: ReadonlyState<SkillEventDencoState>): SkillEventDencoState {
  return {
    ...copyDencoState(state),
    who: state.who,
    carIndex: state.carIndex,
    skillInvalidated: state.skillInvalidated,
  }
}

function copySkillEventState(state: ReadonlyState<SkillEventState>): SkillEventState {
  return {
    time: state.time,
    user: state.user,
    formation: state.formation.map(d => copySKillEventDencoState(d)),
    carIndex: state.carIndex,
    event: Array.from(state.event),
    probabilityBoostPercent: state.probabilityBoostPercent,
  }
}

/**
 * スキル発動型のイベントの詳細
 */
export interface EventTriggeredSkill {
  readonly time: number
  readonly carIndex: number
  /**
   * 発動したスキルを保有する本人の状態
   * 
   * スキルが発動して状態が更新された直後の状態
   */
  readonly denco: ReadonlyState<DencoState>
  readonly skillName: string
  readonly step: SkillEventEvaluateStep
}

/**
 * スキル発動型イベントにおけるスキル評価中の状態
 */
export interface SkillEventState {
  time: number
  user: UserParam

  formation: SkillEventDencoState[]
  carIndex: number

  /**
   * このスキル発動に付随して発動する他スキルのイベント
   * 現状だと確率補正のひいるのスキル発動イベントのみ
   */
  event: Event[]

  /**
   * 確率補正%
   */
  probabilityBoostPercent: number

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
export type SkillEventEvaluateStep =
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
 * - 確率計算に依存せず発動することが確定している場合は`EventSkillRecipe`を直接返します
 * - 確率計算に依存して発動する場合は, `probability`:発動の確率, `recipe`:発動した場合の状態の更新方法をそれぞれ指定します
 */
export type EventSkillTrigger = {
  probability: ProbabilityPercent
  recipe: EventSkillRecipe
} | EventSkillRecipe

/**
 * アクセス直後のタイミングでスキル発動型のイベントを処理する
 * 
 * {@link Skill onAccessComplete}からの呼び出しを想定
 * 
 * `trigger.probability`に{@link ProbabilityPercent}を指定した場合は確率補正も考慮して確率計算を行い  
 * 発動が可能な場合のみ`evaluate`で指定されたスキル発動時の状態変更を適用します
 * 
 * 発動確率以外にも直前のアクセスで該当スキルが無効化されている場合は状態変更は行いません
 * 
 * @param context ログ・乱数等の共通状態
 * @param state 現在の状態
 * @param self スキル発動の主体
 * @param trigger スキル発動の確率計算の方法・発動時の処理方法
 * @returns スキルが発動した場合は効果が反映さらた新しい状態・発動しない場合はstateと同値な状態
 */
export function evaluateSkillAfterAccess(context: Context, state: ReadonlyState<AccessUserResult>, self: ReadonlyState<Access.AccessDencoResult & ActiveSkill>, trigger: EventSkillTrigger): AccessUserResult {
  context = fixClock(context)
  let next = copyAccessUserResult(state)
  if (!isSkillActive(self.skill)) {
    context.log.error(`スキル状態がアクティブでありません ${self.name}`)
    throw Error()
  }
  if (self.skillInvalidated) {
    context.log.log(`スキルが直前のアクセスで無効化されています ${self.name}`)
    return next
  }
  const eventState: SkillEventState = {
    user: copyUserParam(state.user),
    time: getCurrentTime(context),
    formation: state.formation.map((d, idx) => {
      return {
        ...copyDencoState(d),
        who: idx === self.carIndex ? "self" : "other",
        carIndex: idx,
        skillInvalidated: self.skillInvalidated
      }
    }),
    carIndex: self.carIndex,
    event: [],
    probabilityBoostPercent: 0,
  }
  const result = execute(context, eventState, trigger)
  if (result) {
    // スキル発動による影響の反映
    next = {
      ...next,
      formation: result.formation.map((d, idx) => {
        // 編成内位置は不変と仮定
        let access = state.formation[idx]
        return {
          ...access,           // アクセス中の詳細など
          ...copyDencoState(d) // でんこ最新状態(順番注意)
        }
      }),
      event: [
        ...state.event,
        ...result.event,
      ],
    }
  }
  refreshUserState(context, next)
  return next
}

function execute(context: Context, state: SkillEventState, trigger: EventSkillTrigger): SkillEventState | undefined {
  context.log.log(`スキル評価イベントの開始`)
  let self = state.formation[state.carIndex]
  if (self.skill.type !== "possess") {
    context.log.error(`スキルを保持していません ${self.name}`)
    throw Error("no active skill found")
  }

  const skill = self.skill
  context.log.log(`${self.name} ${skill.name}`)

  // TODO ラッピングによる補正

  // 主体となるスキルとは別に事前に発動するスキル
  const others = state.formation.filter(s => {
    return isSkillActive(s.skill) && !s.skillInvalidated && s.carIndex !== self.carIndex
  }).map(d => d.carIndex)
  others.forEach(idx => {
    // スキル発動による状態変更を考慮して各評価直前にコピー
    const s = copySKillEventDencoState(state.formation[idx])
    const skill = s.skill
    if (skill.type !== "possess") {
      context.log.error(`スキル評価処理中にスキル保有状態が変更しています ${s.name} possess => ${skill.type}`)
      throw Error()
    }
    const active: SkillEventDencoState & ActiveSkill = {
      ...s,
      skill: skill,
    }
    const trigger = skill.evaluateOnEvent?.(context, state, active)
    const recipe = canSkillEvaluated(context, state, trigger)
    if (recipe) {
      state = recipe(state) ?? state
      let e: SkillTriggerEvent = {
        type: "skill_trigger",
        data: {
          time: state.time.valueOf(),
          carIndex: state.carIndex,
          denco: copyDencoState(state.formation[idx]),
          skillName: skill.name,
          step: "probability_check"
        },
      }
      state.event.push(e)
    }
  })

  // 発動確率の確認
  const recipe = canSkillEvaluated(context, state, trigger)
  if (!recipe) {
    context.log.log("スキル評価イベントの終了（発動なし）")
    // 主体となるスキルが発動しない場合は他すべての付随的に発動したスキルも取り消し
    return
  }

  // 最新の状態を参照
  self = copySKillEventDencoState(state.formation[state.carIndex])
  state = recipe(state) ?? state
  let triggerEvent: SkillTriggerEvent = {
    type: "skill_trigger",
    data: {
      time: state.time.valueOf(),
      carIndex: state.carIndex,
      denco: copyDencoState(state.formation[state.carIndex]),
      skillName: skill.name,
      step: "self"
    },
  }
  state.event.push(triggerEvent)
  context.log.log("スキル評価イベントの終了")
  return state
}

function canSkillEvaluated(context: Context, state: ReadonlyState<SkillEventState>, trigger: EventSkillTrigger | void): EventSkillRecipe | undefined {
  if (typeof trigger === "undefined") return
  if (typeof trigger === "function") return trigger
  let percent = trigger.probability
  const boost = state.probabilityBoostPercent
  if (percent >= 100) {
    return trigger.recipe
  }
  if (percent <= 0) {
    return
  }
  if (boost !== 0) {
    const v = percent * (1 + boost / 100.0)
    context.log.log(`確率補正: +${boost}% ${percent}% > ${v}%`)
    percent = Math.min(v, 100)
  }
  if (Access.random(context, percent)) {
    context.log.log(`スキルが発動できます 確率:${percent}%`)
    return trigger.recipe
  }
  context.log.log(`スキルが発動しませんでした 確率:${percent}%`)
  return
}

export function randomeAccess(context: Context, state: ReadonlyState<SkillEventState>): SkillEventState {
  context = fixClock(context)
  //TODO ランダム駅の選択
  const station: Station = {
    name: "ランダムな駅",
    nameKana: "らんだむなえき",
    attr: "unknown",
  }
  const config: Access.AccessConfig = {
    offense: {
      state: {
        user: state.user,
        formation: state.formation.map(d => copyDencoState(d)),
        event: [],
        queue: [],
      },
      carIndex: state.carIndex
    },
    station: station
  }
  const result = Access.startAccess(context, config)
  if (result.offense.event.length !== 1) {
    context.log.error(`イベント数が想定外 event:${JSON.stringify(result.offense.event)}`)
  }
  return {
    time: state.time,
    user: state.user,
    formation: result.offense.formation.map((d, idx) => {
      let current = state.formation[idx]
      return {
        ...copyDencoState(d),
        who: current.who,
        carIndex: current.carIndex,
        skillInvalidated: current.skillInvalidated,
      }
    }),
    carIndex: state.carIndex,
    event: [
      ...state.event,
      result.offense.event[0],
    ],
    probabilityBoostPercent: state.probabilityBoostPercent,
  }
}

/**
 * 指定した時刻にトリガーされるスキル発動型イベント
 */
export interface SkillEventReservation {
  readonly denco: Denco
  readonly trigger: EventSkillTrigger
}

/**
 * スキル発動型イベントを指定時刻に評価するよう待機列に追加する
 * 
 * @param context 
 * @param state 現在の状態
 * @param time スキルが発動する時刻 
 * @param denco だれのスキルが発動するか
 * @param trigger スキル発動の確率計算の方法・発動時の処理
 * @returns 待機列に追加した新しい状態
 */
export function enqueueSkillEvent(context: Context, state: ReadonlyState<UserState>, time: number, denco: Denco, trigger: EventSkillTrigger): UserState {
  const now = getCurrentTime(context).valueOf()
  if (now > time) {
    context.log.error(`現在時刻より前の時刻は指定できません time: ${time}, denco: ${JSON.stringify(denco)}`)
    throw Error()
  }
  const next = copyUserState(state)
  next.queue.push({
    type: "skill",
    time: time,
    data: {
      denco: denco,
      trigger: trigger
    }
  })
  next.queue.sort((a, b) => a.time - b.time)
  refreshEventQueue(context, next)
  return next
}

/**
 * スキルを評価する
 * 
 * アクセス中のスキル発動とは別に単独で発動する場合に使用します  
 * - アクセス直後のタイミングで評価する場合は {@link evaluateSkillAfterAccess}を使用してください
 * - アクセス処理中のスキル評価は{@link Skill}のコールバック関数`evaluate`で行ってください
 * 
 * `probability`に`number`を指定した場合は確率補正も考慮して確率計算を行い  
 * 発動が可能な場合のみ`evaluate`で指定されたスキル発動時の状態変更を適用します
 * 
 * @param context 
 * @param state 現在の状態
 * @param self だれのスキルが発動するか
 * @param trigger スキル発動の確率計算の方法・発動時の処理
 * @returns スキルを評価して更新した新しい状態
 */
export function evaluateSkillAtEvent(context: Context, state: ReadonlyState<UserState>, self: Denco, trigger: EventSkillTrigger): UserState {
  let next = copyUserState(state)
  const idx = state.formation.findIndex(d => d.numbering === self.numbering)
  if (idx < 0) {
    context.log.log(`スキル発動の主体となるでんこが編成内に居ません（終了） formation: ${state.formation.map(d => d.name)}`)
    return next
  }
  if (state.formation[idx].skill.type !== "possess") {
    context.log.log(`スキル発動の主体となるでんこがスキルを保有していません（終了） skill: ${state.formation[idx].skill.type}`)
    return next
  }
  const eventState: SkillEventState = {
    time: getCurrentTime(context).valueOf(),
    user: state.user,
    formation: next.formation.map((d, i) => {
      return {
        ...copyDencoState(d),
        who: idx === i ? "self" : "other",
        carIndex: i,
        skillInvalidated: false
      }
    }),
    carIndex: idx,
    event: [],
    probabilityBoostPercent: 0,
  }
  const result = execute(context, eventState, trigger)
  if (result) {
    // スキル発動による影響の反映
    next = {
      user: result.user,
      formation: result.formation.map(d => copyDencoState(d)),
      event: [
        ...next.event,
        ...result.event,
      ],
      queue: next.queue,
    }
  }
  refreshUserState(context, next)
  return next
}

/**
 * 待機列中のイベントの指定時刻を現在時刻に参照して必要なら評価を実行する(破壊的)
 * @param context 現在時刻は`context#clock`を参照する {@see getCurrentTime}
 * @param state 現在の状態 
 * @returns 発動できるイベントが待機列中に存在する場合は評価を実行した新しい状態
 */
export function refreshEventQueue(context: Context, state: UserState) {
  context = fixClock(context)
  const time = getCurrentTime(context).valueOf()
  while (state.queue.length > 0) {
    const entry = state.queue[0]
    if (time < entry.time) break
    state.queue.splice(0, 1)
    // start event
    context.log.log(`待機列中のスキル評価イベントが指定時刻になりました time: ${moment(entry.time).format(TIME_FORMAT)} type: ${entry.type}`)
    switch (entry.type) {
      case "skill": {
        const next = evaluateSkillAtEvent(context, state, entry.data.denco, entry.data.trigger)
        copyUserStateTo(next, state)
        break
      }
      case "hour_cycle": {
        const size = state.formation.length
        for (let i = 0; i < size; i++) {
          const d = state.formation[i]
          const skill = d.skill
          if (skill.type !== "possess" || skill.state.type !== "active") continue
          const callback = skill.onHourCycle
          if (!callback) continue
          let self = {
            ...copyDencoState(d),
            carIndex: i,
            skill: skill,
            skillPropertyReader: skill.property,
          }
          const next = callback(context, state, self)
          if (next) copyUserStateTo(next, state)
        }
        // 次のイベント追加
        const date = moment(entry.time).add(1, "h")
        state.queue.push({
          type: "hour_cycle",
          time: date.valueOf(),
          data: undefined
        })
        state.queue.sort((a, b) => a.time - b.time)
        break
      }
    }
    // end event
  }
}

import * as Access from "./access";
import { Context, fixClock, getCurrentTime } from "./context";
import { copyDencoState, Denco, DencoState } from "./denco";
import { Event, SkillTriggerEvent } from "./event";
import { ActiveSkill, isSkillActive, ProbabilityPercent, Skill, SkillTrigger } from "./skill";
import { Station } from "./station";
import { copyUserState, ReadonlyState, User, UserState } from "./user";


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
    probability: state.probability,
    probabilityBoostPercent: state.probabilityBoostPercent,
  }
}

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
  readonly step: SkillEvaluationStep
}

export interface SkillEventState {
  time: number
  user: User

  formation: SkillEventDencoState[]
  carIndex: number

  event: Event[]

  probability: SkillTrigger
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
export type SkillEvaluationStep =
  "probability_check" |
  "self"

export type EventSkillEvaluate = (context: Context, state: SkillEventState, self: ReadonlyState<SkillEventDencoState & ActiveSkill>) => SkillEventState

/**
 * アクセス直後のタイミングでスキル発動型のイベントを処理する
 * 
 * @param context ログ・乱数等の共通状態
 * @param state 現在の状態
 * @param self スキル発動の主体
 * @param access アクセス処理の結果
 * @param probability スキル発動が確率依存かどうか
 * @param evaluate スキル発動時の処理
 * @returns 
 */
export function evaluateSkillAfterAccess(context: Context, state: ReadonlyState<UserState>, self: ReadonlyState<Access.AccessDencoState & ActiveSkill>, access: ReadonlyState<Access.AccessState>, probability: SkillTrigger, evaluate: EventSkillEvaluate): UserState {
  context = fixClock(context)
  const accessFormation = (self.which === "offense") ? access.offense.formation : access.defense?.formation
  if (!accessFormation) {
    context.log.error(`指定されたでんこが直前のアクセスの状態で見つかりません`)
    throw Error()
  }
  if (self.skillInvalidated) {
    context.log.error(`スキルが直前のアクセスで無効化されています ${self.name}`)
    throw Error()
  }
  if (!isSkillActive(self.skillHolder)) {
    context.log.error(`スキル状態がアクティブでありません ${self.name}`)
    throw Error()
  }
  const eventState: SkillEventState = {
    user: state,
    time: access.time,
    formation: state.formation.map((d, idx) => {
      return {
        ...copyDencoState(d),
        who: idx === self.carIndex ? "self" : "other",
        carIndex: idx,
        skillInvalidated: accessFormation[idx].skillInvalidated
      }
    }),
    carIndex: self.carIndex,
    event: [],
    probability: probability,
    probabilityBoostPercent: 0,
  }
  const result = execute(context, eventState, evaluate)
  if (result) {
    // スキル発動による影響の反映
    return {
      name: state.name,
      formation: result.formation.map(d => copyDencoState(d)),
      event: [
        ...state.event,
        ...result.event,
      ],
      queue: Array.from(state.queue),
    }
  } else {
    return copyUserState(state)
  }
}

function execute(context: Context, state: SkillEventState, evaluate: EventSkillEvaluate): SkillEventState | undefined {
  context.log.log(`スキル評価イベントの開始`)
  let self = state.formation[state.carIndex]
  if (self.skillHolder.type !== "possess") {
    context.log.error(`スキルを保持していません ${self.name}`)
    throw Error("no active skill found")
  }

  const skill = self.skillHolder.skill
  context.log.log(`${self.name} ${skill.name}`)

  // TODO ラッピングによる補正

  // 主体となるスキルとは別に事前に発動するスキル
  const others = state.formation.filter(s => {
    return isSkillActive(s.skillHolder) && !s.skillInvalidated && s.carIndex !== self.carIndex
  }).map(d => d.carIndex)
  others.forEach(idx => {
    const s = copySKillEventDencoState(state.formation[idx])
    const skill = s.skillHolder.skill as Skill
    const active: SkillEventDencoState & ActiveSkill = {
      ...s,
      skillPropertyReader: skill.propertyReader,
      skill: skill,
    }
    const next = skill.evaluateOnEvent ? skill.evaluateOnEvent(context, state, active) : undefined
    if (next) {
      state = next
      let e: SkillTriggerEvent = {
        type: "skill_trigger",
        data: {
          time: state.time,
          carIndex: state.carIndex,
          denco: copyDencoState(state.formation[state.carIndex]),
          skillName: skill.name,
          step: "probability_check"
        },
      }
      state.event.push(e)
    }
  })

  // 発動確率の確認
  if (!canSkillEvaluated(context, state)) {
    context.log.log("スキル評価イベントの終了（発動なし）")
    // 主体となるスキルが発動しない場合は他すべての付随的に発動したスキルも取り消し
    return
  }

  // 最新の状態を参照
  self = copySKillEventDencoState(state.formation[state.carIndex])
  // 主体となるスキルの発動
  const d: SkillEventDencoState & ActiveSkill = {
    ...self,
    skill: skill,
    skillPropertyReader: skill.propertyReader
  }
  const result = evaluate(context, state, d)
  state = result
  let trigger: SkillTriggerEvent = {
    type: "skill_trigger",
    data: {
      time: state.time,
      carIndex: state.carIndex,
      denco: copyDencoState(state.formation[state.carIndex]),
      skillName: skill.name,
      step: "self"
    },
  }
  state.event.push(trigger)
  context.log.log("スキル評価イベントの終了")
  return state
}

function canSkillEvaluated(context: Context, state: SkillEventState): boolean {
  let percent = state.probability
  const boost = state.probabilityBoostPercent
  if (typeof percent === "boolean") {
    return percent
  }
  if (percent >= 100) {
    return true
  }
  if (percent <= 0) {
    return false
  }
  if (boost !== 0) {
    const v = percent * (1 + boost / 100.0)
    context.log.log(`確率補正: +${boost}% ${percent}% > ${v}%`)
    percent = Math.min(v, 100)
  }
  if (Access.random(context, percent)) {
    context.log.log(`スキルが発動できます 確率:${percent}%`)
    return true
  }
  context.log.log(`スキルが発動しませんでした 確率:${percent}%`)
  return false
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
      name: state.user.name,
      carIndex: state.carIndex,
      formation: state.formation.map(d => copyDencoState(d)),
      event: [],
      queue: [],
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
    probability: state.probability,
    probabilityBoostPercent: state.probabilityBoostPercent,
  }
}

/**
 * 指定した時刻にトリガーされるスキル発動型イベント
 */
export interface SkillEventQueueEntry {
  readonly denco: Denco
  readonly time: number
  readonly probability: SkillTrigger
  readonly evaluate: EventSkillEvaluate
}

/**
 * スキル発動型イベントを指定時刻に評価するよう待機列に追加する
 * 
 * @param context 
 * @param state 
 * @param entry 
 * @returns 待機列に追加した新しい状態
 */
export function enqueueSkillEvent(context: Context, state: ReadonlyState<UserState>, entry: SkillEventQueueEntry): UserState {
  const now = getCurrentTime(context)
  if (now > entry.time) {
    context.log.error(`現在時刻より前の時刻は指定できません entry: ${JSON.stringify(entry)}`)
    throw Error()
  }
  const next = copyUserState(state)
  next.queue.push(entry)
  return refreshSkillEventQueue(context, next)
}

/**
 * 待機列中のスキル発動型イベントの指定時刻を現在時刻に参照して必要なら評価を実行する
 * @param context 現在時刻は`context#clock`を参照する {@see getCurrentTime}
 * @param state 
 * @returns 発動できるイベントが待機列中に存在する場合は評価を実行した新しい状態
 */
export function refreshSkillEventQueue(context: Context, state: ReadonlyState<UserState>): UserState {
  context = fixClock(context)
  let next = copyUserState(state)
  next.queue.sort((a, b) => a.time - b.time)
  const time = getCurrentTime(context)
  while (next.queue.length > 0) {
    const entry = next.queue[0]
    if (time < entry.time) break
    next.queue.splice(0, 1)
    // start skill event
    context.log.log(`待機列中のスキル評価イベントが指定時刻になりました time: ${new Date(entry.time).toTimeString()} dneco: ${entry.denco.name}`)
    const idx = next.formation.findIndex(d => d.numbering === entry.denco.numbering)
    if (idx < 0) {
      context.log.log(`スキル発動の主体となるでんこが編成内に居ません（終了） formation: ${next.formation.map(d => d.name)}`)
      continue
    }
    if (next.formation[idx].skillHolder.type !== "possess") {
      context.log.log(`スキル発動の主体となるでんこがスキルを保有していません（終了） skill: ${next.formation[idx].skillHolder.type}`)
      continue
    }
    const eventState: SkillEventState = {
      time: time,
      user: state,
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
      probability: entry.probability,
      probabilityBoostPercent: 0,
    }
    const result = execute(context, eventState, entry.evaluate)
    if (result) {
      // スキル発動による影響の反映
      next = {
        name: next.name,
        formation: result.formation.map(d => copyDencoState(d)),
        event: [
          ...next.event,
          ...result.event,
        ],
        queue: next.queue,
      }
    }
    // end skill event
  }
  return next
}


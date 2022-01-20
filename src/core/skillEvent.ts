import * as Access from "./access";
import { Context, getCurrentTime } from "./context";
import { copyDencoState, Denco, DencoState } from "./denco";
import { SkillTriggerEvent } from "./event";
import { ActiveSkill, isSkillActive, ProbabilityPercent, Skill } from "./skill";
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

export type TriggeredSkill = Readonly<{
  time: number
  carIndex: number
  denco: ReadonlyState<DencoState>
  skillName: string
  step: SkillEvaluationStep
}>

export interface SkillEventState {
  time: number

  formation: SkillEventDencoState[]
  carIndex: number

  triggeredSkills: TriggeredSkill[]

  probability?: ProbabilityPercent
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

export type EventSkillEvaluate = (state: SkillEventState, self: ReadonlyState<SkillEventDencoState & ActiveSkill>) => SkillEventState

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
export function evaluateSkillAfterAccess(context: Context, state: ReadonlyState<UserState>, self: ReadonlyState<Access.AccessDencoState & ActiveSkill>, access: ReadonlyState<Access.AccessState>, probability: ProbabilityPercent, evaluate: EventSkillEvaluate): UserState {
  const accessFormation = (self.which === "offense") ? access.offense.formation : access.defense?.formation
  if (!accessFormation) {
    context.log.error(`指定されたでんこが直前のアクセスの状態で見つかりません`)
    throw Error()
  }
  const eventState: SkillEventState = {
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
    triggeredSkills: [],
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
        ...result.triggeredSkills.map(t => {
          let e: SkillTriggerEvent = {
            type: "skill_trigger",
            data: t
          }
          return e
        })
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
  if (!isSkillActive(self.skillHolder)) {
    context.log.error(`アクティブなスキルを保持していません ${self.name}`)
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
      state.triggeredSkills.push({
        time: state.time,
        carIndex: s.carIndex,
        denco: s,
        skillName: skill.name,
        step: "probability_check"
      })
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
  const result = evaluate(state, d)
  state = result
  state.triggeredSkills.push({
    time: state.time,
    carIndex: self.carIndex,
    denco: self,
    skillName: skill.name,
    step: "self"
  })
  context.log.log("スキル評価イベントの終了")
  return state
}

function canSkillEvaluated(context: Context, state: SkillEventState): boolean {
  if (state.probability) {
    if (context.random.mode === "force") {
      context.log.log("確率計算は無視されます mode: force")
      return true
    }
    if (context.random.mode === "ignore") {
      context.log.log("確率計算は無視されます mode: ignore")
      return false
    }
    const percent = state.probability
    const boost = state.probabilityBoostPercent
    if (percent >= 100) {
      return true
    }
    if (context.random() < (percent * (1.0 + boost / 100.0)) / 100.0) {
      context.log.log(`スキルが発動できます 確率:${percent}%`)
      return true
    }
    context.log.log(`スキルが発動しませんでした 確率:${percent}%`)
    return false
  } else {
    return true
  }
}

/**
 * 指定した時刻にトリガーされるスキル発動型イベント
 */
export interface SkillEventQueueEntry {
  readonly denco: Denco
  readonly time: number
  readonly probability: ProbabilityPercent
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
  return refreshSkillEventQueue(context, state)
}

/**
 * 待機列中のスキル発動型イベントの指定時刻を現在時刻に参照して必要なら評価を実行する
 * @param context 現在時刻は`context#clock`を参照する {@see getCurrentTime}
 * @param state 
 * @returns 発動できるイベントが待機列中に存在する場合は評価を実行した新しい状態
 */
export function refreshSkillEventQueue(context: Context, state: ReadonlyState<UserState>): UserState {
  let next = copyUserState(state)
  next.queue.sort((a, b) => a.time - b.time)
  const time = getCurrentTime(context)
  while (next.queue.length > 0) {
    const entry = next.queue[0]
    if (entry.time >= time) break
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
      formation: next.formation.map((d, i) => {
        return {
          ...copyDencoState(d),
          who: idx === i ? "self" : "other",
          carIndex: i,
          skillInvalidated: false
        }
      }),
      carIndex: idx,
      triggeredSkills: [],
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
          ...result.triggeredSkills.map(t => {
            let e: SkillTriggerEvent = {
              type: "skill_trigger",
              data: t
            }
            return e
          })
        ],
        queue: next.queue,
      }
    }
    // end skill event
  }
  return next
}


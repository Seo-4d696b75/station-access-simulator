import * as access from "./access";
import { Context } from "./context";
import { copyDencoState, DencoState } from "./denco";
import { ActiveSkill, isSkillActive, ProbabilityPercent, Skill } from "./skill";
import { SkillPropertyReader } from "./skillManager";
import { copyUserState, ReadonlyState, UserState } from "./user";


export interface SkillEventDencoState extends DencoState {
  who: "self" | "other"
  carIndex: number
  skillInvalidated: boolean
}

export interface TriggeredSkill {
  time: number
  carIndex: number
  denco: ReadonlyState<DencoState>
  skillName: string
  step: SkillEvaluationStep
}

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

export interface SkillTriggerResult {
  triggeredSkill: TriggeredSkill[]
  state: access.AccessState
}

export type EventSkillEvaluate = (state: SkillEventState, self: SkillEventDencoState & ActiveSkill) => SkillEventState

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
export function evaluateSkillAfterAccess(context: Context, state: ReadonlyState<UserState>, self: ReadonlyState<access.AccessDencoState> & ActiveSkill, access: ReadonlyState<access.AccessState>, probability: ProbabilityPercent, evaluate: EventSkillEvaluate): UserState {
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
      ...copyUserState(state),
      formation: result.formation,
    }
  } else {
    return copyUserState(state)
  }
}

function execute(context: Context, state: SkillEventState, evaluate: EventSkillEvaluate): SkillEventState | undefined {
  context.log.log(`スキル評価イベントの開始`)
  const self = state.formation[state.carIndex]
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
  })
  others.forEach(s => {
    const skill = s.skillHolder.skill as Skill
    const d: SkillEventDencoState & ActiveSkill = {
      ...s,
      skillPropertyReader: skill.propertyReader,
      skill: skill,
    }
    const next = skill.evaluateOnEvent ? skill.evaluateOnEvent(context, state, d) : undefined
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


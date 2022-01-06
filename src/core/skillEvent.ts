import * as access from "./access";
import { Logger, Random } from "./context";
import { DencoState } from "./denco";
import { EventSkillPreEvaluate, isSkillActive, ProbabilityPercent, Skill } from "./skill";
import { SkillPropertyReader } from "./skillManager";


export interface SkillEventDencoState extends DencoState {
  who: "self" | "other"
  carIndex: number
  skillInvalidated: boolean
}

export interface ActiveSkillDenco extends SkillEventDencoState {
  propertyReader: SkillPropertyReader
  skill: Skill
}

export interface TriggeredSkill {
  time: number
  carIndex: number
  denco: DencoState
  skillName: string
  step: SkillEvaluationStep
}

export interface SkillEventState {
  time: number
  log: Logger

  formation: SkillEventDencoState[]
  carIndex: number

  triggeredSkills: TriggeredSkill[]

  probability?: ProbabilityPercent 
  probabilityBoostPercent: number

  random: Random | "ignore" | "force"
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

export type EventSkillEvaluate = (state: SkillEventState, self: ActiveSkillDenco) => SkillEventState

export function evaluateSkillAfterAccess(a: access.AccessState, self: access.ActiveSkillDenco, evaluate: EventSkillEvaluate, probability?: ProbabilityPercent): SkillTriggerResult {
  const state: SkillEventState = {
    time: a.time,
    log: a.log,
    formation: getFormation(a, self.which).map(d => {
      return {
        ...d,
        who: d.carIndex === self.carIndex ? "self" : "other",
      }
    }),
    carIndex: self.carIndex,
    triggeredSkills: [],
    probability: probability,
    probabilityBoostPercent: 0,
    random: a.random,
  }
  const result = execute(state, evaluate)
  // スキル発動による影響の反映
  const nextState = assignResult(a, result, self.which)
  return {
    triggeredSkill: result.triggeredSkills,
    state: nextState,
  }
}

function assignResult(state: access.AccessState, reuslt: SkillEventState, which: access.AccessSide): access.AccessState {
  const next = {...state}
  const side = (which === "offense") ? state.offense : state.defense as access.AccessSideState
  const nextSide = {
    ...side,
    formation: reuslt.formation.map((d,idx) => {
      const origin = side.formation[idx]
      let s: access.AccessDencoState = {
        ...d,
        which: which,
        who: d.carIndex === side.carIndex ? which : "other",
        hpBefore: origin.hpBefore,
        hpAfter: origin.hpAfter,
        reboot: origin.reboot
      }
      return s
    })
  }
  if ( which === "offense"){
    next.offense = nextSide
  } else {
    next.defense = nextSide
  }
  return next
}

function getFormation(state: access.AccessState, which: access.AccessSide): access.AccessDencoState[] {
  if (which === "offense") {
    return state.offense.formation
  } else {
    const d = state.defense
    if (!d) throw Error("no defense found")
    return d.formation
  }
}

function execute(state: SkillEventState, evaluate: EventSkillEvaluate): SkillEventState {
  state.log.log(`スキル評価イベントの開始`)
  const origin: SkillEventState = {
    ...state,
    formation: state.formation.map( d => { return {...d}}),
    triggeredSkills: Array.from(state.triggeredSkills)
  }
  const self = state.formation[state.carIndex]
  if ( !isSkillActive(self.skillHolder)) {
    state.log.error(`アクティブなスキルを保持していません ${self.name}`)
    throw Error("no active skill found")
  }

  const skill = self.skillHolder.skill
  state.log.log(`${self.name} ${skill.name}`)

  // TODO ラッピングによる補正

  // 主体となるスキルとは別に事前に発動するスキル
  const others = state.formation.filter(s => {
    return isSkillActive(s.skillHolder) && !s.skillInvalidated && s.carIndex !== self.carIndex
  })
  others.forEach(s => {
    const skill = s.skillHolder.skill as Skill
    const d: ActiveSkillDenco = {
      ...s,
      propertyReader: skill.propertyReader,
      skill: skill,
    }
    const next = skill.evaluateOnEvent ? skill.evaluateOnEvent(state, d) : undefined
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
  if ( !canSkillEvaluated(state) ) {
    state.log.log("スキル評価イベントの終了（発動なし）")
    // 主体となるスキルが発動しない場合は他すべての付随的に発動したスキルも取り消し
    return origin
  }

  // 主体となるスキルの発動
  const d: ActiveSkillDenco = {
    ...self,
    skill: skill,
    propertyReader: skill.propertyReader
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

function canSkillEvaluated(state: SkillEventState) : boolean {
  if ( state.probability) {
    if ( state.random === "force") {
      state.log.log("確率計算は無視されます mode: force")
      return true
    }
    if (state.random === "ignore") {
      state.log.log("確率計算は無視されます mode: ignore")
      return false
    }
    const percent = state.probability
    const boost = state.probabilityBoostPercent
    if ( percent >= 100 ) {
      return true
    }
    if ( state.random() < (percent * (1.0 + boost / 100.0)) / 100.0){
      state.log.log(`スキルが発動できます 確率:${percent}%`)
      return true
    }
    state.log.log(`スキルが発動しませんでした 確率:${percent}%`)
    return false
  } else {
    return true
  }
}


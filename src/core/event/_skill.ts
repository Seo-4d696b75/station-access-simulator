import { copy, merge } from "../../gen/copy";
import { AccessDencoResult, AccessResult, AccessSide, getSide } from "../access";
import { assert, Context, withFixedClock } from "../context";
import { Denco, DencoState } from "../denco";
import { random } from "../random";
import { isSkillActive, Skill, WithSkill } from "../skill";
import { withSkill } from "../skill/property";
import { EventSkillTrigger, EventSkillTriggerState, SkillProbabilityBoost, WithSkillEventPosition } from "../skill/trigger";
import { ReadonlyState } from "../state";
import { UserState } from "../user";
import { refreshUserState } from "../user/refresh";
import { Event, SkillTriggerEvent } from "./type";

/**
 * スキル発動型のイベントの詳細
 */
export interface EventTriggeredSkill {
  time: number
  denco: WithSkillEventPosition<DencoState>
  skillName: string
  probability: number
  boostedProbability: number
}

export type SkillEventDencoState = WithSkillEventPosition<DencoState>

export type EventSkillTriggerStateHolder = {
  type: "skill_trigger_state"
  data: EventSkillTriggerState
}

export interface SkillEventState extends UserState {
  time: number

  formation: SkillEventDencoState[]
  carIndex: number

  /**
   * スキル発動処理中に新たに記録されるイベント
   */
  eventTriggers: (Event | EventSkillTriggerStateHolder)[]
}

export const triggerSkillAfterAccess = (
  context: Context,
  access: ReadonlyState<AccessResult>,
  self: ReadonlyState<WithSkill<AccessDencoResult>>,
  trigger: EventSkillTrigger
): AccessResult => withFixedClock(context, () => {

  assert(self.skill.active, "スキル状態がactiveではありません")

  const next = copy.AccessResult(access)
  const side = getSide(next, self.which)

  const state: SkillEventState = {
    ...copy.UserState(side),
    time: context.currentTime,
    formation: side.formation.map((d, idx) => ({
      ...copy.DencoState(d),
      who: idx === self.carIndex ? "self" : "other",
      carIndex: idx,
    })),
    carIndex: self.carIndex,
    eventTriggers: [],
  }
  //const result = execute(context, state, trigger)
  const result = execute(
    context,
    state,
    trigger,
    {
      result: next,
      which: self.which,
    }
  )
  if (result) {
    // スキル発動による影響の反映
    // formation: UserState[], event, queueを更新
    merge.UserState(side, result)
    refreshUserState(context, side)
  }
  return next
})

export const triggerSkillAtEvent = (
  context: Context,
  state: ReadonlyState<UserState>,
  self: Denco,
  trigger: EventSkillTrigger
): UserState => withFixedClock(context, () => {
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
    eventTriggers: [],
  }

  const result = execute(context, eventState, trigger)
  if (result) {
    refreshUserState(context, result)
    return result
  } else {
    return copy.UserState(state)
  }
})

function execute(
  context: Context,
  state: SkillEventState,
  trigger: EventSkillTrigger,
  access?: {
    result: AccessResult,
    which: AccessSide,
  }
): SkillEventState | undefined {
  const self = state.formation[state.carIndex]
  const skill = self.skill
  assert(skill.type === "possess", "スキルを保有していません")

  // TODO triggerに確率ブーストは含めない

  context.log.log(`スキル評価イベントの開始: ${self.firstName} ${skill.name}`)

  // 確率補正のスキル発動
  state.formation.forEach(d => {
    const s = d.skill
    if (!isSkillActive(s)) return

    const callback = s.onSkillProbabilityBoost
    if (!callback) return

    const c = copy.DencoState(d)
    const t = callback(
      context,
      withSkill(c, c.skill as Skill, d.carIndex),
    )
    if (!t) return

    const checked = checkEventSkillTrigger(
      context,
      d,
      state.eventTriggers,
      t,
      access
    )
    state.eventTriggers.push({
      type: "skill_trigger_state",
      data: checked
    })
  })

  // 本人のスキル発動
  const triggerState = checkEventSkillTrigger(
    context,
    self,
    state.eventTriggers,
    trigger,
    access
  )

  // 発動なし
  // 確率or直前のアクセスでの無効化
  if (!triggerState.canTrigger) {
    context.log.log("スキル評価イベントの終了（発動なし）")
    return
    // TODO fallback
  }

  assert(triggerState.triggered)
  assert(triggerState.type === "skill_event")

  // TODO　ランダムな駅アクセス発動の場合のイベント記録の順序
  // ランダム駅アクセスのスキル発動 > 駅アクセス > (アクセス時のスキル発動) の方が自然では？
  // 現行：(ひいる発動) > 駅アクセス > (アクセス時のスキル発動) > ランダム駅アクセスのスキル発動 時系列になっていない
  // 特に確率補正が効く場合はひいるダイアログと離れてしまいどのスキル発動に影響しているか分かりにくい
  state = triggerState.recipe(state) ?? state
  state.eventTriggers.push({
    type: "skill_trigger_state",
    data: triggerState,
  })

  // スキル発動処理中のイベントを記録
  state.eventTriggers.forEach(event => {
    if (event.type === "skill_trigger_state") {
      const t = event.data
      if (!t.triggered) return
      let e: SkillTriggerEvent = {
        type: "skill_trigger",
        data: {
          time: state.time.valueOf(),
          denco: t.denco,
          skillName: t.skillName,
          probability: t.probability,
          boostedProbability: t.boostedProbability,
        },
      }
      state.event.push(e)
    } else {
      state.event.push(event)
    }
  })

  return state

}



function checkEventSkillTrigger(
  context: Context,
  denco: ReadonlyState<SkillEventDencoState>,
  triggered: (Event | EventSkillTriggerStateHolder)[],
  trigger: EventSkillTrigger | SkillProbabilityBoost,
  access?: {
    result: AccessResult,
    which: AccessSide,
  }
): EventSkillTriggerState {

  const skill = denco.skill
  assert(skill.type === "possess")

  const state: EventSkillTriggerState = {
    ...trigger,
    denco: {
      ...copy.DencoState(denco),
      carIndex: denco.carIndex,
      who: denco.who,
    },
    boostedProbability: 0,
    canTrigger: false,
    invalidated: false,
    triggered: false,
    skillName: skill.name,
  }


  // 確率・無効化を考慮して発動有無を計算

  // スキル無効化の影響を確認
  // 直前のアクセスがある場合のみ
  if (
    access &&
    !checkSkillInvalidated(context, access.result, access.which, denco, skill)
  ) {
    state.invalidated = true
    return state
  }

  // 発動確率の確認
  if (!checkSkillProbability(context, triggered, state)) {
    return state
  }

  // 発動判定をパス
  state.canTrigger = true

  // 各発動効果の有無を計算
  switch (state.type) {
    case "probability_boost":
      // 対象のスキルが存在するがまだ分からない
      state.triggered = false
      break
    case "skill_event":
      state.triggered = true
      break
    default:
      assert(false, "not expected")
  }

  return state
}

function checkSkillInvalidated(
  context: Context,
  access: AccessResult,
  which: AccessSide,
  denco: ReadonlyState<SkillEventDencoState>,
  skill: ReadonlyState<Skill>
): boolean {
  const side = getSide(access, which)
  // 編成位置は不変と仮定
  const d = side.formation[denco.carIndex]
  const invalidated = access.skillTriggers
    .filter(t => t.canTrigger)
    .some(t => {
      if (t.type === "invalidate_skill" && t.isTarget(d)) {
        // 無効化の発動を記録
        t.triggered = true
        context.log.log(`スキル発動が無効化されました`)
        context.log.log(`  無効化スキル；${t.denco.firstName} ${t.skillName}`)
        context.log.log(`  無効化の対象：${d.firstName} ${skill.name}`)
        return true
      }
      return false
    })
  return !invalidated
}


function checkSkillProbability(
  context: Context,
  triggered: (Event | EventSkillTriggerStateHolder)[],
  trigger: EventSkillTriggerState,
): boolean {
  // 発動確率の読み出し
  let percent = Math.max(0, Math.min(trigger.probability, 100))
  trigger.boostedProbability = percent

  // 確率補正のスキル自体の発動確率は100%を前提
  assert(trigger.type !== "probability_boost" || percent === 100)

  // 確率補正不要な場合
  if (percent >= 100) return true
  if (percent <= 0) return false

  // 確率補正の計算
  const boost = triggered
    .filter((e): e is EventSkillTriggerStateHolder => e.type === "skill_trigger_state")
    .map(e => e.data)
    .filter(t => t.canTrigger)
    .map(t => {
      if (t.type === "probability_boost") {
        assert(t.percent > 0)
        context.log.log(`確率補正：+${t.percent}% by ${t.denco.firstName} ${t.skillName}`)
        // 補正相手の発動の如何を問わず確率補正のスキル効果は発動した扱いになる
        t.triggered = true
        return t.percent
      }
      return 0
    })
    .reduce((a, b) => a + b, 0)

  if (boost > 0) {
    const percentBoosted = Math.min(percent * (1 + boost / 100.0), 100)
    context.log.log(`確率補正（合計）: +${boost}% ${percent}% > ${percentBoosted}%`)
    percent = percentBoosted
    trigger.boostedProbability = percentBoosted
  }

  // 乱数計算
  if (random(context, percent)) {
    context.log.log(`スキルが発動できます ${trigger.denco.name} 確率:${percent}%`)
    return true
  } else {
    context.log.log(`スキルが発動しませんでした ${trigger.denco.name} 確率:${percent}%`)
    return false
  }
}
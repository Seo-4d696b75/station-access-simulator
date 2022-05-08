// 外部公開用のエントリーポイント
import SkillManager from "./core/skillManager"
import DencoManager from "./core/dencoManager"
import StationManager from "./core/stationManager"

/**
 * ライブラリを初期化する
 * 
 * ライブラリが使用する各種データを非同期でロードします  
 * 最初の呼び出し時のみロード処理を実行して２回目以降の呼び出しは無視します
 */
export async function init() {
  if (initLib) {
    console.log("already init")
    return initLib
  }
  const job = Promise.all([
    SkillManager.load(),
    DencoManager.load(),
    StationManager.load()
  ]).then(() => {
    console.log("ライブラリを初期化しました")
  })
  initLib = job
  return job
}

let initLib: Promise<void> | undefined = undefined

/**
 * ライブラリにロードされた全データを空にします
 */
export function clear() {
  SkillManager.clear()
  DencoManager.clear()
  StationManager.clear()
  initLib = undefined
}

export { default as SkillManager } from "./core/skillManager"
export { default as DencoManager } from "./core/dencoManager"
export { default as StationManager } from "./core/stationManager"
export {
  ReadonlyState,
  UserParam,
  EventQueueEntry,
  UserState,
  FormationPosition,
  getTargetDenco,
  initUser,
  changeFormation,
  refreshState,
  copyUserState
} from "./core/user"
export {
  SkillStateTransition,
  SkillStateType,
  SkillCooldownTimeout,
  SkillActiveTimeout,
  SkillState,
  ProbabilityPercent,
  SkillTrigger,
  SkillTriggerPredicate,
  AccessSkillEvaluate,
  SkillLogic,
  Skill,
  ActiveSkill,
  SkillHolder,
  getSkill,
  isSkillActive,
  activateSkill,
  deactivateSkill
} from "./core/skill"
export * from "./core/access"
export {
  SkillEventDencoState,
  EventTriggeredSkill,
  SkillEventState,
  SkillEventEvaluateStep,
  SkillEventEvaluate,
  evaluateSkillAfterAccess,
  evaluateSkillAtEvent,
  randomAccess,
  SkillEventReservation,
  enqueueSkillEvent
} from "./core/skillEvent"
export * from "./core/format"
export * from "./core/context"
export * from "./core/denco"
export * from "./core/station"
export * from "./core/event"
export * from "./core/film"
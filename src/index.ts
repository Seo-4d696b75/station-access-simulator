// 外部公開用のエントリーポイント
import SkillManager from "./core/skillManager"
import DencoManager from "./core/dencoManager"
import StationManager from "./core/stationManager"

export async function init() {
  await SkillManager.load()
  await DencoManager.load()
  await StationManager.load()
}

export { default as SkillManager } from "./core/skillManager"
export { default as DencoManager } from "./core/dencoManager"
export { default as StationManager } from "./core/stationManager"
export {
  ReadonlyState,
  User,
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
  disactivateSkill
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
  randomeAccess,
  SkillEventReservation,
  enqueueSkillEvent
} from "./core/skillEvent"
export * from "./core/format"
export * from "./core/context"
export * from "./core/denco"
export * from "./core/station"
export * from "./core/event"
export * from "./core/film"
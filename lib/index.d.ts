/**
 * ライブラリを初期化する
 *
 * ライブラリが使用する各種データを非同期でロードします
 * 最初の呼び出し時のみロード処理を実行して２回目以降の呼び出しは無視します
 */
export declare function init(): Promise<void>;
/**
 * ライブラリにロードされた全データを空にします
 */
export declare function clear(): void;
export { default as SkillManager } from "./core/skillManager";
export { default as DencoManager } from "./core/dencoManager";
export { default as StationManager } from "./core/stationManager";
export { ReadonlyState, UserParam, EventQueueEntry, UserState, FormationPosition, getTargetDenco, initUser, changeFormation, refreshState, copyUserState } from "./core/user";
export { SkillStateTransition, SkillStateType, SkillCooldownTimeout, SkillActiveTimeout, SkillState, ProbabilityPercent, SkillTrigger, SkillTriggerPredicate, AccessSkillEvaluate, SkillLogic, Skill, ActiveSkill, SkillHolder, getSkill, isSkillActive, activateSkill, disactivateSkill } from "./core/skill";
export * from "./core/access";
export { SkillEventDencoState, EventTriggeredSkill, SkillEventState, SkillEventEvaluateStep, SkillEventEvaluate, evaluateSkillAfterAccess, evaluateSkillAtEvent, randomeAccess, SkillEventReservation, enqueueSkillEvent } from "./core/skillEvent";
export * from "./core/format";
export * from "./core/context";
export * from "./core/denco";
export * from "./core/station";
export * from "./core/event";
export * from "./core/film";

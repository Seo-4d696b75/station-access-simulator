// 外部公開用のエントリーポイント
import DencoManager from "./core/dencoManager"
import SkillManager from "./core/skillManager"
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

// src/core/access/*
export * from "./core/access/index"
export * from "./core/context"
export * from "./core/denco"
export { default as DencoManager } from "./core/dencoManager"
export * from "./core/event/index"
export * from "./core/film"
export * from "./core/format"
export * from "./core/random"
export {
  activateSkill, ActiveSkill, deactivateSkill, getSkill,
  isSkillActive, ProbabilityPercent, Skill, SkillActiveTimeout, SkillCooldownTimeout, SkillHolder, SkillLogic, SkillState, SkillStateTransition,
  SkillStateType
} from "./core/skill"
export { default as SkillManager } from "./core/skillManager"
export * from "./core/state"
export * from "./core/station"
export { default as StationManager } from "./core/stationManager"
export * from "./core/user"


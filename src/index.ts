// 外部公開用のエントリーポイント
import SkillManager from "./core/skillManager"
import DencoManager from "./core/dencoManager"
import StationManager from "./core/stationManager"

export async function init() {
  await SkillManager.load()
  await DencoManager.load()
  await StationManager.load()
}

export {default as SkillManager} from "./core/skillManager"
export {default as DencoManager} from "./core/dencoManager"
export {default as StationManager} from "./core/stationManager"
export * from "./core/access"
export * from "./core/format"
export * from "./core/context"
export * from "./core/denco"
export * from "./core/user"
export * from "./core/skill"
export * from "./core/station"
export * from "./core/event"
export * from "./core/skillEvent"
export * from "./core/film"
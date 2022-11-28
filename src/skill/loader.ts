import { SimulatorError } from "../core/context";
import { SkillLogic } from "../core/skill";

export default async function loadSkillLogic(moduleName: string): Promise<SkillLogic> {
  try {
    const module = await import(
      /* webpackMode: "eager" */
      "./" + moduleName
    )
    return module.default as SkillLogic
  } catch {
    throw new SimulatorError(`fail to import skill logic: ${moduleName}`)
  }
}
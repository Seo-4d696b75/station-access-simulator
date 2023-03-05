import { getSkillTrigger, hasSkillTriggered } from "../core/access";
import { assert } from "../core/context";
import { formatPercent } from "../core/format";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onAccessBeforeStart: (context, state, self) => {
    // フットバースでも・相手不在でも発動する
    // 通常、獲得スコア増加スキルはstart_accessで発動し無効化の影響を受けるが
    // なるは特別に無効化の影響を受けない（謎）
    if (self.who === "offense") {
      return {
        probability: self.skill.property.readNumber("probability"),
        type: "skill_recipe",
        recipe: (state) => {
          const scorePercent = self.skill.property.readNumber("score_percent")
          // アクセスで獲得するスコアを増加させる
          state.offense.scorePercent.access += scorePercent
          context.log.log(`獲得スコアを増加${formatPercent(scorePercent)}`)
        },
        fallbackRecipe: (state) => {
          const scorePercent = self.skill.property.readNumber("score_percent_failure")
          state.offense.scorePercent.access += scorePercent
          context.log.log(`獲得スコアを減少${formatPercent(scorePercent)}`)
        }
      }
    }
  },
  onAccessDamagePercent: (context, state, self) => {
    // AKT増加は無効化影響を受ける

    // 獲得スコアの増減を確認
    if (!hasSkillTriggered(state, "offense", self)) return
    const triggers = getSkillTrigger(state, "offense", self)
    assert(triggers.length === 1)
    const t = triggers[0]
    assert(t.type === "skill_recipe")
    if (t.fallbackTriggered) {
      return {
        probability: 100,
        type: "damage_atk",
        percent: self.skill.property.readNumber("ATK")
      }
    }
  }
}

export default skill
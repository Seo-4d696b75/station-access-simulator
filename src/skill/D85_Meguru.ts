import { assert } from "../core/context";
import { SkillLogic } from "../core/skill";
import { copy } from "../gen/copy";

const KEY = "link_count"

const skill: SkillLogic = {
  transitionType: "manual",
  deactivate: "default_timeout",
  onLinkStarted: (context, state, self, link) => {
    // 自身がリンク開始＆スキルactive
    if (link.denco.numbering === self.numbering && self.skill.active) {
      const current = self.skill.data.readNumber(KEY, 0)
      const max = self.skill.property.readNumber("count_max")
      if (current < max) {
        // 書き込み可能な状態にコピーする
        const next = copy.UserState(state)
        const d = next.formation[self.carIndex]
        assert(d.skill.type === "possess")
        d.skill.data.putNumber(KEY, current + 1)
        context.log.log(`めぐるがリンク開始しました 回数：${current} => ${current + 1}`)
        return next
      } else {
        context.log.log(`めぐるがリンク開始しました 回数は既に上限です：${max}`)
      }
    }
  },
  onAccessDamagePercent: (context, state, self) => {
    if (self.who === "offense") {
      const cnt = self.skill.data.readNumber(KEY, 0)
      const max = self.skill.property.readNumber("count_max")
      const atkMax = self.skill.property.readNumber("ATK_max")
      const atk = atkMax * Math.min(cnt, max) / max
      return {
        probability: self.skill.property.readNumber("probability"), // 100%
        type: "damage_atk",
        percent: atk
      }
    }
  }
}

export default skill
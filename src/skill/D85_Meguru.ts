import { assert } from "../core/context";
import { formatPercent } from "../core/format";
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
  triggerOnAccess: (context, state, step, self) => {
    if (step === "damage_common" && self.who === "offense") {
      return {
        probabilityKey: "probability", // 100%
        recipe: (state) => {
          const cnt = self.skill.data.readNumber(KEY, 0)
          const max = self.skill.property.readNumber("count_max")
          const atkMax = self.skill.property.readNumber("ATK_max")
          const atk = atkMax * Math.min(cnt, max) / max
          state.attackPercent += atk
          context.log.log(`めぐはこうみえてマジメなんでぇ～♪ ATK${formatPercent(atk)}`)
        }
      }
    }
  }
}

export default skill
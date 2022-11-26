import { assert } from "../core/context";
import { triggerSkillAtEvent } from "../core/event";
import { SkillLogic } from "../core/skill";

const skill: SkillLogic = {
  transitionType: "always",
  onLinkDisconnected: (context, state, self, links) => {
    // 自身は対象外
    if (links.denco.name === self.name) return
    // 最新の状態を参照
    // links.dencoはリンク解除時点でのスナップショット
    const idx = state.formation.findIndex(d => d.name === links.denco.name)
    assert(idx >= 0, `リンク解除したでんこが編成内にいません ${links.denco.name}`)
    const d = state.formation[idx]
    if (d.currentExp < d.nextExp) {
      // 経験値追加できる？
      return triggerSkillAtEvent(context, state, self, {
        probabilityKey: "probability",
        recipe: (state) => {
          const d = state.formation[idx]
          const cnt = links.link.length
          assert(cnt > 0, "解除されたリンクが見つかりません")
          const unit = self.skill.property.readNumber("EXP")
          const exp = unit * cnt
          context.log.log(`みなさんの成長はわたしがサポートしますよ！ EXP: ${unit} x ${cnt}`)
          context.log.log(`  ${d.name} EXP: ${d.currentExp} => ${d.currentExp + exp}`)
          d.currentExp += exp
        }
      })
    }
  }
}

export default skill
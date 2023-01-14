import { formatLinkTime, SkillLogic, triggerSkillAtEvent } from "..";

const skill: SkillLogic = {
  transitionType: "manual-condition",
  deactivate: "default_timeout",
  canEnabled: (context, state, self) => {
    if (state.formation.length < 2) return false
    //　リンク移譲先
    const dstIdx = self.carIndex === 0 ? 1 : 0
    const dst = state.formation[dstIdx]
    // 自身より高レベルは対象外
    if (dst.level > self.level) return false
    // 自身がcnt数以上のリンクを保持している
    const cnt = self.skill.property.readNumber("links")
    return self.link.length >= cnt
  },
  onActivated: (context, state, self) => {
    // スキルが有効化した瞬間にスキル発動
    return triggerSkillAtEvent(context, state, self, {
      probability: "probability",
      recipe: (state) => {
        const links = state.formation[self.carIndex].link
        const stations = links.map(link => link.name).join(",")
        if (links.length <= 1) context.log.error("リンク数>1が必要です")
        const linkIdx = Math.floor(links.length * context.random())
        const link = links[linkIdx]
        // 移譲するリンクは開始時刻そのまま いろは本人には経験値入らない
        state.formation[self.carIndex].link.splice(linkIdx, 1)
        // 移譲先の決定
        if (state.formation.length <= 1) context.log.error("リンクの移譲先が見つかりません")
        const dstIdx = self.carIndex === 0 ? 1 : 0
        const dst = state.formation[dstIdx]
        if (dst.level > self.level) context.log.error("リンク移譲先のでんこレベルが自身より高いです")
        // リンクの移譲
        dst.link.push(link)
        context.log.log(`渡したい駅を渡せなくてど～しよ～！！`)
        context.log.log(`保持リンク：${stations}`)
        context.log.log(`移譲するリンク：${link.name} ${formatLinkTime(context.currentTime, link)}`)
        context.log.log(`移譲相手：${dst.name}`)
      }
    })
  }
}

export default skill
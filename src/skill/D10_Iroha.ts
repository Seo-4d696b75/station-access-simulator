import { evaluateSkillAtEvent, getCurrentTime, SkillEventEvaluate, SkillLogic } from "..";

const skill: SkillLogic = {
  canEnabled: (context, state, self) => {
    // 自身がcnt数以上のリンクを保持している
    const cnt = self.skill.propertyReader("links")
    return self.link.length >= cnt && state.formation.length > 1
  },
  disactivateAt: (context, state, self) => {
    const active = self.skill.propertyReader("active")
    const wait = self.skill.propertyReader("wait")
    const now = getCurrentTime(context)
    return {
      activeTimeout: now + active * 1000,
      cooldownTimeout: now + (active + wait) * 1000,
    }
  },
  onActivated: (context, state, self) => {
    // スキルが有効化した瞬間にスキル発動
    return evaluateSkillAtEvent(context, state, self, true, evaluate)
  }
}

// スキル発動時の処理内容
const evaluate: SkillEventEvaluate = (context, state, self) => {
  const links = self.link
  const stataions = links.map(link => link.name).join(",")
  if (links.length <= 1) context.log.error("リンク数>1が必要です")
  let idx = Math.floor(links.length * context.random())
  const link = links[idx]
  // 移譲するリンクは開始時刻そのまま いろは本人には経験値入らない
  state.formation[self.carIndex].link.splice(idx, 1)
  // 移譲先の決定
  if (state.formation.length <= 1) context.log.error("リンクの移譲先が見つかりません")
  if (self.carIndex === 0) {
    idx = 1
  } else {
    idx = 0
  }
  // リンクの移譲
  state.formation[idx].link.push(link)
  context.log.log(`渡したい駅を渡せなくてど～しよ～！！ リンク:${stataions} 移譲するリンク:${JSON.stringify(link)} 移譲相手:${state.formation[idx].name}`)
  return state
}

export default skill
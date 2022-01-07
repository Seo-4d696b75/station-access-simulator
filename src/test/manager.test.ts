import { Context, initContext } from "../core/context"
import StationManager from "../core/stationManager"
import SkillManager from "../core/skillManager"

const stations = [
  {
    name: "適当な駅１",
    name_kana: "てきとうなえきいち",
    attr: "heat",
  },
  {
    name: "適当な駅２",
    name_kana: "てきとうなえきに",
    attr: "cool",
  }
]

const skills = [
  {numbering:"0",class:"D00_Nozomi",type:"manual",list:[
    {skill_level:1,denco_level:1,name:"目指せステーションマスター♪","ATK":50,"DEF":50,active:1200,wait:1800}
  ]},
  {numbering:"1",class:"D01_Seria",type:"manual",list:[
    {skill_level:1,denco_level:5,name:"検測開始しま～す♡ Lv.1",active:1800,wait:10800,heal:15,probability:20},
    {skill_level:2,denco_level:15,name:"検測開始しま～す♡ Lv.2",active:1800,wait:10800,heal:25,probability:25},
    {skill_level:3,denco_level:30,name:"検測開始しま～す♡ Lv.3",active:1800,wait:10800,heal:35,probability:30},
    {skill_level:4,denco_level:50,name:"検測開始しま～す♡ Lv.4",active:1800,wait:10800,heal:45,probability:35},
    {skill_level:5,denco_level:60,name:"検測開始しま～す♡ Lv.5",active:1800,wait:10800,heal:55,probability:40},
    {skill_level:6,denco_level:70,name:"検測開始しま～す♡ Lv.6",active:1800,wait:10800,heal:65,probability:45},
    {skill_level:7,denco_level:80,name:"幸せの黄色い検測",active:1800,wait:10800,heal:80,probability:50}
  ]},
  {numbering:"2",class:"D02_Mero",type:"always",list:[
    {skill_level:1,denco_level:5, name:"きゃのんぱんち Lv.1",probability:1.0},
    {skill_level:2,denco_level:15, name:"きゃのんぱんち Lv.2",probability:1.2},
    {skill_level:3,denco_level:30, name:"きゃのんぱんち Lv.3",probability:1.4},
    {skill_level:4,denco_level:50, name:"きゃのんぱんち Lv.4",probability:1.6},
    {skill_level:5,denco_level:60, name:"きゃのんぱんち Lv.5",probability:1.8},
    {skill_level:6,denco_level:70, name:"きゃのんぱんち Lv.6",probability:2.0},
    {skill_level:7,denco_level:80, name:"すーぱーぎがんとぱんち",probability:2.5}
  ]},
  {numbering:"3",class:"D03_Luna",type:"always",list:[
    {skill_level:1,denco_level:5,name:"ナイトライダー Lv.1",DEF_night:5,DEF_morning:-30},
    {skill_level:2,denco_level:15,name:"ナイトライダー Lv.2",DEF_night:10,DEF_morning:-30},
    {skill_level:3,denco_level:30,name:"ナイトライダー Lv.3",DEF_night:15,DEF_morning:-30},
    {skill_level:4,denco_level:50,name:"ナイトライダー Lv.4",DEF_night:25,DEF_morning:-30},
    {skill_level:5,denco_level:60,name:"ナイトライダー Lv.5",DEF_night:35,DEF_morning:-30},
    {skill_level:6,denco_level:70,name:"ナイトライダー Lv.6",DEF_night:40,DEF_morning:-30},
    {skill_level:7,denco_level:80,name:"ナイトエクスプレス",DEF_night:50,DEF_morning:-30}
  ]}
]

describe("manager", () => {
  test("station-manager", () => {
    StationManager.load(JSON.stringify(stations)).then(() => {
      const context = initContext("test", "test", false)
      expect(StationManager.data.length).toBe(2)
      const s = StationManager.getRandomStation(context, 2).find(s => s.name === "適当な駅１")
      expect(s).not.toBeUndefined()
      expect(s?.nameKana).toBe(stations[0].name_kana)
      expect(s?.attr).toBe("heat")
      const now = Date.now()
      const link = StationManager.getRandomLink(context, 1, 1, 2)[0]
      expect(link.start).toBeGreaterThan(now - 2000)
      expect(link.start).toBeLessThanOrEqual(now - 1000)
      expect(() => StationManager.getRandomStation(context, 10)).toThrowError()
      expect(() => StationManager.getRandomLink(context, 10)).toThrowError()
    })
  })
  test("skill-manager", () => {
    SkillManager.load(JSON.stringify(skills)).then(() => {
      // スキルあり
      let skill = SkillManager.getSkill("3", 50)
      expect(skill.type).toBe("possess")
      expect(skill.skill).not.toBeUndefined()
      const s = skill.skill
      expect(s?.level).toBe(4)
      expect(s?.name).toBe("ナイトライダー Lv.4")
      expect(s?.propertyReader("DEF_night")).toBe(25)
      expect(s?.propertyReader("DEF_morning")).toBe(-30)
      expect(() => s?.propertyReader("hoge")).toThrowError()
      // スキルをまだ取得していない
      skill = SkillManager.getSkill("3", 1)
      expect(skill.type).toBe("not_aquired")
      expect(skill.skill).toBeUndefined()
      // スキルなし
      skill = SkillManager.getSkill("8", 80)
      expect(skill.type).toBe("none")
      expect(skill.skill).toBeUndefined()
    })
  })
})
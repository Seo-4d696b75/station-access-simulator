import { Context, initContext } from "../core/context"
import StationManager from "../core/stationManager"
import SkillManager from "../core/skillManager"
import DencoManager from "../core/dencoManager"
import moment from "moment-timezone"

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
  {
    numbering: "0", class: "D00_Nozomi", type: "manual", list: [
      { skill_level: 1, denco_level: 1, name: "目指せステーションマスター♪", "ATK": 50, "DEF": 50, active: 1200, wait: 1800 }
    ]
  },
  {
    numbering: "1", class: "D01_Seria", type: "manual", list: [
      { skill_level: 1, denco_level: 5, name: "検測開始しま～す♡ Lv.1", active: 1800, wait: 10800, heal: 15, probability: 20 },
      { skill_level: 2, denco_level: 15, name: "検測開始しま～す♡ Lv.2", active: 1800, wait: 10800, heal: 25, probability: 25 },
      { skill_level: 3, denco_level: 30, name: "検測開始しま～す♡ Lv.3", active: 1800, wait: 10800, heal: 35, probability: 30 },
      { skill_level: 4, denco_level: 50, name: "検測開始しま～す♡ Lv.4", active: 1800, wait: 10800, heal: 45, probability: 35 },
      { skill_level: 5, denco_level: 60, name: "検測開始しま～す♡ Lv.5", active: 1800, wait: 10800, heal: 55, probability: 40 },
      { skill_level: 6, denco_level: 70, name: "検測開始しま～す♡ Lv.6", active: 1800, wait: 10800, heal: 65, probability: 45 },
      { skill_level: 7, denco_level: 80, name: "幸せの黄色い検測", active: 1800, wait: 10800, heal: 80, probability: 50 }
    ]
  },
  {
    numbering: "2", class: "D02_Mero", type: "always", list: [
      { skill_level: 1, denco_level: 5, name: "きゃのんぱんち Lv.1", probability: 1.0 },
      { skill_level: 2, denco_level: 15, name: "きゃのんぱんち Lv.2", probability: 1.2 },
      { skill_level: 3, denco_level: 30, name: "きゃのんぱんち Lv.3", probability: 1.4 },
      { skill_level: 4, denco_level: 50, name: "きゃのんぱんち Lv.4", probability: 1.6 },
      { skill_level: 5, denco_level: 60, name: "きゃのんぱんち Lv.5", probability: 1.8 },
      { skill_level: 6, denco_level: 70, name: "きゃのんぱんち Lv.6", probability: 2.0 },
      { skill_level: 7, denco_level: 80, name: "すーぱーぎがんとぱんち", probability: 2.5 }
    ]
  },
  {
    numbering: "3", class: "D03_Luna", type: "always", list: [
      { skill_level: 1, denco_level: 5, name: "ナイトライダー Lv.1", DEF_night: 5, DEF_morning: -30 },
      { skill_level: 2, denco_level: 15, name: "ナイトライダー Lv.2", DEF_night: 10, DEF_morning: -30 },
      { skill_level: 3, denco_level: 30, name: "ナイトライダー Lv.3", DEF_night: 15, DEF_morning: -30 },
      { skill_level: 4, denco_level: 50, name: "ナイトライダー Lv.4", DEF_night: 25, DEF_morning: -30 },
      { skill_level: 5, denco_level: 60, name: "ナイトライダー Lv.5", DEF_night: 35, DEF_morning: -30 },
      { skill_level: 6, denco_level: 70, name: "ナイトライダー Lv.6", DEF_night: 40, DEF_morning: -30 },
      { skill_level: 7, denco_level: 80, name: "ナイトエクスプレス", DEF_night: 50, DEF_morning: -30 }
    ]
  }
]

const dencos = [
  { numbering: "0", name: "nozomi", full_name: "のぞみ", type: "supporter", attribute: "flat", EXP: [0], AP: [101], HP: [124] },
  { numbering: "1", name: "seria", full_name: "黄陽セリア", type: "supporter", attribute: "eco", EXP: [0, 400, 800, 1200, 1600, 2100, 2600, 3200, 3700, 4300, 4900, 5500, 6100, 6800, 7500, 8100, 8800, 9500, 10200, 10900, 11700, 12400, 13200, 13900, 14700, 15500, 16300, 17100, 17900, 18700, 19600, 20400, 21200, 22100, 23000, 23800, 24700, 25600, 26500, 27300, 28300, 29200, 30100, 31000, 32000, 32900, 33800, 34800, 35800, 36700, 37600, 38700, 39600, 40600, 41600, 42600, 43600, 44600, 45600, 46600, 47600, 48700, 49700, 50800, 51700, 52900, 53800, 55000, 56000, 57000, 58100, 59200, 60300, 61400, 62400, 63600, 64600, 65800, 66800, 68000], AP: [50, 53, 57, 60, 64, 67, 71, 74, 77, 81, 84, 87, 91, 94, 97, 100, 103, 107, 110, 112, 115, 118, 121, 123, 126, 129, 131, 133, 136, 138, 140, 142, 144, 145, 147, 149, 150, 151, 153, 154, 155, 156, 157, 157, 158, 159, 159, 159, 159, 160, 163, 166, 170, 173, 176, 180, 183, 186, 190, 193, 196, 200, 203, 206, 210, 213, 216, 220, 223, 226, 230, 233, 236, 240, 243, 246, 250, 253, 256, 260], HP: [72, 75, 78, 82, 85, 89, 92, 96, 99, 102, 106, 109, 113, 116, 120, 123, 126, 130, 133, 137, 140, 144, 147, 150, 154, 157, 161, 164, 168, 171, 174, 178, 181, 185, 188, 192, 195, 198, 202, 205, 209, 212, 216, 219, 222, 226, 229, 233, 236, 240, 243, 247, 250, 254, 258, 261, 265, 268, 272, 276, 279, 283, 286, 290, 294, 297, 301, 304, 308, 312, 315, 319, 322, 326, 330, 333, 337, 340, 344, 348] },
  { numbering: "2", name: "mero", full_name: "為栗メロ", type: "attacker", attribute: "eco", EXP: [0, 400, 800, 1200, 1600, 2100, 2600, 3200, 3700, 4300, 4900, 5500, 6100, 6800, 7500, 8100, 8800, 9500, 10200, 10900, 11700, 12400, 13200, 13900, 14700, 15500, 16300, 17100, 17900, 18700, 19600, 20400, 21200, 22100, 23000, 23800, 24700, 25600, 26500, 27300, 28300, 29200, 30100, 31000, 32000, 32900, 33800, 34800, 35800, 36700, 37600, 38700, 39600, 40600, 41600, 42600, 43600, 44600, 45600, 46600, 47600, 48700, 49700, 50800, 51700, 52900, 53800, 55000, 56000, 57000, 58100, 59200, 60300, 61400, 62400, 63600, 64600, 65800, 66800, 68000], AP: [70, 72, 75, 77, 80, 83, 85, 88, 91, 93, 96, 99, 101, 104, 107, 109, 112, 115, 117, 120, 123, 125, 128, 131, 133, 136, 138, 141, 144, 146, 149, 152, 154, 157, 160, 162, 165, 168, 170, 173, 176, 178, 181, 184, 186, 189, 192, 194, 197, 200, 203, 207, 211, 214, 218, 222, 225, 229, 233, 236, 240, 244, 247, 251, 255, 258, 262, 266, 269, 273, 277, 280, 284, 288, 291, 295, 299, 302, 306, 310], HP: [60, 60, 60, 60, 61, 61, 62, 63, 64, 65, 66, 68, 69, 71, 73, 74, 76, 79, 81, 83, 86, 88, 91, 94, 97, 100, 103, 106, 109, 113, 116, 119, 123, 127, 130, 134, 138, 142, 146, 150, 154, 158, 162, 166, 170, 175, 179, 183, 187, 192, 195, 199, 202, 206, 210, 213, 217, 220, 224, 228, 231, 235, 238, 242, 246, 249, 253, 256, 260, 264, 267, 271, 274, 278, 282, 285, 289, 292, 296, 300] },
  { numbering: "3", name: "luna", full_name: "新阪ルナ", type: "defender", attribute: "cool", EXP: [0, 400, 800, 1200, 1600, 2100, 2600, 3200, 3700, 4300, 4900, 5500, 6100, 6800, 7500, 8100, 8800, 9500, 10200, 10900, 11700, 12400, 13200, 13900, 14700, 15500, 16300, 17100, 17900, 18700, 19600, 20400, 21200, 22100, 23000, 23800, 24700, 25600, 26500, 27300, 28300, 29200, 30100, 31000, 32000, 32900, 33800, 34800, 35800, 36700, 37600, 38700, 39600, 40600, 41600, 42600, 43600, 44600, 45600, 46600, 47600, 48700, 49700, 50800, 51700, 52900, 53800, 55000, 56000, 57000, 58100, 59200, 60300, 61400, 62400, 63600, 64600, 65800, 66800, 68000], AP: [30, 32, 35, 38, 41, 44, 47, 50, 52, 55, 58, 61, 63, 66, 69, 71, 74, 76, 79, 81, 83, 86, 88, 90, 92, 94, 96, 98, 100, 102, 103, 105, 106, 108, 109, 111, 112, 113, 114, 115, 116, 117, 117, 118, 118, 119, 119, 119, 119, 120, 123, 126, 130, 133, 136, 140, 143, 146, 150, 153, 156, 160, 163, 166, 170, 173, 176, 180, 183, 186, 190, 193, 196, 200, 203, 206, 210, 213, 216, 220], HP: [120, 122, 124, 127, 129, 132, 134, 137, 139, 142, 144, 146, 149, 151, 154, 156, 159, 161, 164, 166, 168, 171, 173, 176, 178, 181, 183, 186, 188, 191, 193, 195, 198, 200, 203, 205, 208, 210, 213, 215, 217, 220, 222, 225, 227, 230, 232, 235, 237, 240, 244, 248, 252, 256, 260, 264, 268, 272, 276, 280, 284, 288, 292, 296, 300, 304, 308, 312, 316, 320, 324, 328, 332, 336, 340, 344, 348, 352, 356, 360] },
]

describe("manager", () => {
  test("station-manager", async () => {
    await StationManager.load(JSON.stringify(stations))
    const context = initContext("test", "test", false)
    expect(StationManager.data.length).toBe(2)
    const s = StationManager.getRandomStation(context, 2).find(s_1 => s_1.name === "適当な駅１")
    expect(s).not.toBeUndefined()
    expect(s?.nameKana).toBe(stations[0].name_kana)
    expect(s?.attr).toBe("heat")
    const now = moment().valueOf()
    const link = StationManager.getRandomLink(context, 1, 1, 2)[0]
    expect(link.start).toBeGreaterThan(now - 2000)
    expect(link.start).toBeLessThanOrEqual(now - 1000)
    expect(() => StationManager.getRandomStation(context, 10)).toThrowError()
    expect(() => StationManager.getRandomLink(context, 10)).toThrowError()
  })
  test("skill-manager", async () => {
    await SkillManager.load(JSON.stringify(skills))
    // スキルあり
    let skill = SkillManager.getSkill("3", 50)
    expect(skill.type).toBe("possess")
    const s = skill
    if (s.type === "possess") {
      expect(s?.level).toBe(4)
      expect(s?.name).toBe("ナイトライダー Lv.4")
      expect(s?.propertyReader("DEF_night")).toBe(25)
      expect(s?.propertyReader("DEF_morning")).toBe(-30)
      expect(() => s?.propertyReader("hoge")).toThrowError()
    }
    // スキルをまだ取得していない
    skill = SkillManager.getSkill("3", 1)
    expect(skill.type).toBe("not_aquired")
    // スキルなし
    skill = SkillManager.getSkill("8", 80)
    expect(skill.type).toBe("none")
  })
  test("denco-manager", async () => {
    await DencoManager.load(JSON.stringify(dencos))
    const context = initContext("test", "test", false)
    // 正常
    let luna = DencoManager.getDenco(context, "3", 50, 1)
    const data_1 = dencos[3]
    expect(luna.numbering).toBe("3")
    expect(luna.name).toBe(data_1.name)
    expect(luna.level).toBe(50)
    expect(luna.type).toBe(data_1.type)
    expect(luna.ap).toBe(data_1.AP[49])
    expect(luna.maxHp).toBe(data_1.HP[49])
    expect(luna.attr).toBe(data_1.attribute)
    // 次のlevel:51に必要な経験値
    expect(luna.nextExp).toBe(data_1.EXP[50])
    expect(luna.skill.type).toBe("possess")
    if (luna.skill.type === "possess") {
      expect(luna.skill.name).toBe("ナイトライダー Lv.4")
    }
    expect(luna.link.length).toBe(1)
    // invalid numbering
    expect(() => DencoManager.getDenco(context, "hoge")).toThrowError()
    // invalid level
    expect(() => DencoManager.getDenco(context, "3", 120)).toThrowError()
  })
})
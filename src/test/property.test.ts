import assert from "assert";
import { isEqual } from "lodash";
import { activateSkill, copy, DencoManager, Film, getSkill, initContext, initUser, merge, SkillManager } from "..";
import { TypedMap } from "../core/property";
import { SkillPropertyReader } from "../core/skill/property";

describe("copy, equals, merge of TypedMap", () => {
  test("read", () => {
    const p = new Map<string, any>([["key1", 1], ["key2", "string"]])
    const m1 = new TypedMap(p)
    expect(m1.readNumber("key1")).toBe(1)
    expect(m1.readString("key2")).toBe("string")
    const m2 = copy.MutableProperty(m1)
    expect(m2.readNumber("key1")).toBe(1)
    expect(m2.readString("key2")).toBe("string")
    expect(isEqual(m1, m2)).toBeTruthy()
    expect(m1).not.toBe(m2)
    const m3 = new TypedMap(new Map<string, any>([["key1", true], ["key3", [1, 2, 3]]]))
    merge.MutableProperty(m3, m1)
    expect(m3.readNumber("key1")).toBe(1)
    expect(m3.readString("key2")).toBe("string")
    expect(m3.readNumberArray("key3")).toEqual([1, 2, 3])
  })
  test("write", () => {
    const m1 = new TypedMap()
    m1.putNumber("key1", 1)
    m1.putString("key2", "string")
    const m2 = copy.MutableProperty(m1)
    expect(m2.readNumber("key1")).toBe(1)
    expect(m2.readString("key2")).toBe("string")
    expect(isEqual(m1, m2)).toBeTruthy()
    expect(m1).not.toBe(m2)
    const m3 = new TypedMap()
    m3.putNumber("key1", 10)
    m3.putBoolean("key3", true)
    merge.MutableProperty(m3, m1)
    expect(m3.readNumber("key1")).toBe(1)
    expect(m3.readString("key2")).toBe("string")
    expect(m3.readBoolean("key3")).toBe(true)
  })
})

describe("SkillPropertyReader", () => {
  const p = new Map<string, any>([["key1", 1], ["key2", 2]])
  const base = new TypedMap(p)
  const film: Film = {
    type: "film",
    theme: "theme",
    skill: {
      key1: 1,
      key3: -2,
    }
  }
  beforeAll(() => {
    base.putNumber("key1", 10)
    base.putNumberArray("key3", [1, 2, 3])
    base.putBoolean("key4", true)
    base.putString("key5", "string")
  })
  test("Film補正あり", () => {
    const reader = new SkillPropertyReader(base, film)
    expect(reader.readNumber("key1")).toBe(11)
    expect(reader.readNumber("key2")).toBe(2)
    expect(reader.readNumberArray("key3")).toEqual([-1, 0, 1])
    expect(() => reader.readNumber("key4")).toThrowError()
    expect(reader.readBoolean("key4")).toBe(true)
  })
  test("Film補正なし", () => {
    const reader = new SkillPropertyReader(base, { type: "none" })
    expect(reader.readNumber("key1")).toBe(10)
    expect(reader.readNumber("key2")).toBe(2)
    expect(reader.readNumberArray("key3")).toEqual([1, 2, 3])
    expect(() => reader.readNumber("key4")).toThrowError()
    expect(reader.readBoolean("key4")).toBe(true)
  })
  test("copy", () => {
    const reader1 = new SkillPropertyReader(base, film)
    const reader2 = copy.MutableProperty(reader1)
    assert(reader2 instanceof SkillPropertyReader)
    expect(reader1.film).not.toBe(reader2.film)
    expect(reader1.film).toEqual(reader2.film)
    expect(reader1.base).not.toBe(reader2.base)
    const f = reader2.film
    assert(f.type === "film")
    assert(f.skill)
    f.skill.key1 = 10
    expect(reader1.readNumber("key1")).toBe(11)
    expect(reader2.readNumber("key1")).toBe(20)
  })
  test("merge", () => {
    const reader = new SkillPropertyReader(base, film)
    const reader1 = copy.MutableProperty(reader)
    const reader2 = copy.MutableProperty(reader)
    assert(reader1 instanceof SkillPropertyReader)
    assert(reader2 instanceof SkillPropertyReader)
    const f = reader2.film
    assert(f.type === "film")
    assert(f.skill)
    f.skill.key1 = 10
    expect(reader1.readNumber("key1")).toBe(11)
    expect(reader2.readNumber("key1")).toBe(20)
    merge.MutableProperty(reader1, reader2)
    expect(reader1.film).not.toBe(reader2.film)
    expect(reader1.film).toEqual(reader2.film)
    expect(reader1.readNumber("key1")).toBe(20)
  })
})

describe("型安全なプロパティの読み書き", () => {
  const dencos = [
    { numbering: "1", name: "seria", full_name: "黄陽セリア", first_name: "セリア", type: "supporter", attr: "eco", AP: [50, 53, 57, 60, 64, 67, 71, 74, 77, 81, 84, 87, 91, 94, 97, 100, 103, 107, 110, 112, 115, 118, 121, 123, 126, 129, 131, 133, 136, 138, 140, 142, 144, 145, 147, 149, 150, 151, 153, 154, 155, 156, 157, 157, 158, 159, 159, 159, 159, 160, 163, 166, 170, 173, 176, 180, 183, 186, 190, 193, 196, 200, 203, 206, 210, 213, 216, 220, 223, 226, 230, 233, 236, 240, 243, 246, 250, 253, 256, 260], HP: [72, 75, 78, 82, 85, 89, 92, 96, 99, 102, 106, 109, 113, 116, 120, 123, 126, 130, 133, 137, 140, 144, 147, 150, 154, 157, 161, 164, 168, 171, 174, 178, 181, 185, 188, 192, 195, 198, 202, 205, 209, 212, 216, 219, 222, 226, 229, 233, 236, 240, 243, 247, 250, 254, 258, 261, 265, 268, 272, 276, 279, 283, 286, 290, 294, 297, 301, 304, 308, 312, 315, 319, 322, 326, 330, 333, 337, 340, 344, 348] },
  ]
  const skills = [
    {
      numbering: "1",
      class: "D01_Seria",
      key1: 100,
      key2: "string",
      key3: true,
      key4: [1, 2, 3],
      key5: ["hoge", "piyo"],
      list: [
        { skill_level: 1, denco_level: 5, name: "検測開始しま～す♡ Lv.1", active: 1800, cooldown: 10800, heal: 15, probability: "20%" },
        { skill_level: 2, denco_level: 15, name: "検測開始しま～す♡ Lv.2", active: 1800, cooldown: 10800, heal: 25, probability: "25%" },
        { skill_level: 3, denco_level: 30, name: "検測開始しま～す♡ Lv.3", active: 1800, cooldown: 10800, heal: 35, probability: "30%" },
        { skill_level: 4, denco_level: 50, name: "検測開始しま～す♡ Lv.4", active: 1800, cooldown: 10800, heal: 45, probability: "35%" },
        { skill_level: 5, denco_level: 60, name: "検測開始しま～す♡ Lv.5", active: 1800, cooldown: 10800, heal: 55, probability: "40%" },
        { skill_level: 6, denco_level: 70, name: "検測開始しま～す♡ Lv.6", active: 1800, cooldown: 10800, heal: 65, probability: "45%" },
        { skill_level: 7, denco_level: 80, name: "幸せの黄色い検測", active: 1800, cooldown: 10800, heal: 80, probability: "50%" }
      ]
    },
  ]
  const context = initContext()

  beforeAll(async () => {
    await DencoManager.load(JSON.stringify(dencos))
    await SkillManager.load(JSON.stringify(skills))
  })
  describe("SkillProperty", () => {

    test("各データ型", () => {
      const d = DencoManager.getDenco(context, "1", 50)
      const s = getSkill(d)
      expect(s.property.readNumber("key1")).toBe(100)
      expect(s.property.readString("key2")).toBe("string")
      expect(s.property.readBoolean("key3")).toBe(true)
      expect(s.property.readNumberArray("key4")).toEqual([1, 2, 3])
      expect(s.property.readStringArray("key5")).toEqual(["hoge", "piyo"])
    })
    test("デフォルト値の指定", () => {
      const d = DencoManager.getDenco(context, "1", 50)
      const s = getSkill(d)
      expect(s.property.readNumber("key", 10)).toBe(10)
      expect(s.property.readString("key", "hoge")).toBe("hoge")
      expect(s.property.readBoolean("key", false)).toBe(false)
      expect(s.property.readNumberArray("key", [1])).toEqual([1])
      expect(s.property.readStringArray("key", ["hoge"])).toEqual(["hoge"])
    })
    test("スキルレベルに応じた値の取得", () => {
      const d50 = DencoManager.getDenco(context, "1", 50)
      const d80 = DencoManager.getDenco(context, "1", 80)
      expect(getSkill(d50).property.readNumber("heal")).toBe(45)
      expect(getSkill(d80).property.readNumber("heal")).toBe(80)
      expect(getSkill(d50).property.readString("probability")).toBe("35%")
      expect(getSkill(d80).property.readString("probability")).toBe("50%")
    })
    test("Not found", () => {
      const d = DencoManager.getDenco(context, "1", 50)
      const s = getSkill(d)
      expect(() => s.property.readNumber("key")).toThrowError()
      expect(() => s.property.readString("key")).toThrowError()
      expect(() => s.property.readBoolean("key")).toThrowError()
      expect(() => s.property.readNumberArray("key")).toThrowError()
      expect(() => s.property.readStringArray("key")).toThrowError()
    })
    test("type mismatch", () => {
      const d = DencoManager.getDenco(context, "1", 50)
      const s = getSkill(d)
      expect(() => s.property.readNumber("key2")).toThrowError()
      expect(() => s.property.readString("key3")).toThrowError()
      expect(() => s.property.readBoolean("key1")).toThrowError()
      expect(() => s.property.readNumberArray("key5")).toThrowError()
      expect(() => s.property.readStringArray("key4")).toThrowError()
    })
  })

  describe("SkillData", () => {
    test("各データ型の読み書き", () => {
      const d = DencoManager.getDenco(context, "1", 50)
      const s = getSkill(d)
      s.data.putBoolean("key1", true)
      expect(s.data.readBoolean("key1")).toBe(true)
      s.data.putBoolean("key1", false)
      expect(s.data.readBoolean("key1")).toBe(false)
      s.data.putString("key2", "string")
      expect(s.data.readString("key2")).toBe("string")
      s.data.putNumber("key3", 100)
      expect(s.data.readNumber("key3")).toBe(100)
      s.data.putNumberArray("key4", [1, 2])
      expect(s.data.readNumberArray("key4")).toEqual([1, 2])
      s.data.putStringArray("key5", ["hoge", "piyo"])
      expect(s.data.readStringArray("key5")).toEqual(["hoge", "piyo"])
    })
    test("デフォルト値", () => {
      const d = DencoManager.getDenco(context, "1", 50)
      const s = getSkill(d)
      expect(s.data.readBoolean("key1", true)).toBe(true)
      expect(s.data.readString("key2", "string")).toBe("string")
      expect(s.data.readNumber("key3", 100)).toBe(100)
      expect(s.data.readNumberArray("key4", [1, 2])).toEqual([1, 2])
      expect(s.data.readStringArray("key5", ["hoge", "piyo"])).toEqual(["hoge", "piyo"])
    })
    test("read - type mismatch", () => {
      const d = DencoManager.getDenco(context, "1", 50)
      const s = getSkill(d)
      s.data.putBoolean("key1", true)
      s.data.putString("key2", "string")
      s.data.putNumber("key3", 100)
      s.data.putNumberArray("key4", [1, 2])
      s.data.putStringArray("key5", ["hoge", "piyo"])
      expect(() => s.data.readNumber("key1")).toThrowError()
      expect(() => s.data.readString("key3")).toThrowError()
      expect(() => s.data.readBoolean("key2")).toThrowError()
      expect(() => s.data.readNumberArray("key5")).toThrowError()
      expect(() => s.data.readStringArray("key4")).toThrowError()
    })
    test("put - type mismatch", () => {
      const d = DencoManager.getDenco(context, "1", 50)
      const s = getSkill(d)
      s.data.putBoolean("key1", true)
      s.data.putString("key2", "string")
      s.data.putNumber("key3", 100)
      s.data.putNumberArray("key4", [1, 2])
      s.data.putStringArray("key5", ["hoge", "piyo"])
      expect(() => s.data.putNumber("key1", 0)).toThrowError()
      expect(() => s.data.putString("key3", "hoge")).toThrowError()
      expect(() => s.data.putBoolean("key2", false)).toThrowError()
      expect(() => s.data.putNumberArray("key5", [0])).toThrowError()
      expect(() => s.data.putStringArray("key4", ["hoge"])).toThrowError()
    })
    test("Not found", () => {
      const d = DencoManager.getDenco(context, "1", 50)
      const s = getSkill(d)
      expect(() => s.data.readNumber("key")).toThrowError()
      expect(() => s.data.readString("key")).toThrowError()
      expect(() => s.data.readBoolean("key")).toThrowError()
      expect(() => s.data.readNumberArray("key")).toThrowError()
      expect(() => s.data.readStringArray("key")).toThrowError()
    })
    test("初期化", () => {
      const d = DencoManager.getDenco(context, "1", 50)
      const s = getSkill(d)
      s.data.putBoolean("key1", true)
      s.data.putString("key2", "string")
      s.data.putNumber("key3", 100)
      s.data.putNumberArray("key4", [1, 2])
      s.data.putStringArray("key5", ["hoge", "piyo"])
      s.data.clear()
      expect(() => s.data.readNumber("key3")).toThrowError()
      expect(() => s.data.readString("key2")).toThrowError()
      expect(() => s.data.readBoolean("key1")).toThrowError()
      expect(() => s.data.readNumberArray("key4")).toThrowError()
      expect(() => s.data.readStringArray("key5")).toThrowError()
    })
    test("スキル有効化のタイミングで初期化", () => {
      const d = DencoManager.getDenco(context, "1", 50)
      let s = getSkill(d)
      s.data.putBoolean("key1", true)
      s.data.putString("key2", "string")
      s.data.putNumber("key3", 100)
      s.data.putNumberArray("key4", [1, 2])
      s.data.putStringArray("key5", ["hoge", "piyo"])
      let state = initUser(context, "user", [d])
      state = activateSkill(context, state, 0)
      s = getSkill(state.formation[0])
      expect(() => s.data.readNumber("key3")).toThrowError()
      expect(() => s.data.readString("key2")).toThrowError()
      expect(() => s.data.readBoolean("key1")).toThrowError()
      expect(() => s.data.readNumberArray("key4")).toThrowError()
      expect(() => s.data.readStringArray("key5")).toThrowError()
    })
  })
})
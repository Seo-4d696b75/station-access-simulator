import { readFile } from "fs/promises"
import moment from "moment-timezone"
import { AccessConfig, AccessResult, activateSkill, Context, DencoManager, formatEvents, init, initContext, initUser, refreshState, startAccess, UserState } from "../.."

describe("format", () => {
  beforeAll(init)

  const compareAccessOutput = async (context: Context, result: AccessResult, fileName: string) => {
    let stdout = formatEvents(context, result.offense, true, false)
      + "\n" + formatEvents(context, result.defense, true, false)
    let txt = await readFile(`src/test/format/${fileName}.detail.txt`)
    expect(stdout).toBe(txt.toString())

    stdout = formatEvents(context, result.offense, false, false)
      + "\n" + formatEvents(context, result.defense, false, false)
    txt = await readFile(`src/test/format/${fileName}.txt`)
    expect(stdout).toBe(txt.toString())
  }

  const compareStateOutput = async (context: Context, state: UserState, fileName: string) => {
    let stdout = formatEvents(context, state, true, false)
    let txt = await readFile(`src/test/format/${fileName}.txt`)
    expect(stdout).toBe(txt.toString())
  }

  test("01基本的なアクセス", async () => {
    const context = initContext("this is test", "random seed", false)

    let reika = DencoManager.getDenco(context, "5", 80)
    let master1 = initUser(context, "master1", [reika])
    master1 = activateSkill(context, master1, 0)

    let charlotte = DencoManager.getDenco(context, "6", 50, 3)
    let master2 = initUser(context, "master2", [charlotte])

    let config = {
      offense: { state: master1, carIndex: 0 },
      defense: { state: master2, carIndex: 0 },
      station: charlotte.link[0]
    }
    const result = startAccess(context, config)
    await compareAccessOutput(context, result, "01")
  })
  test("02スキル無効化", async () => {
    const context = initContext("this is test", "random seed", false)
    context.random.mode = "force" // 確率依存のスキルを強制的に発動させます

    let reika = DencoManager.getDenco(context, "5", 80)
    let ren = DencoManager.getDenco(context, "22", 80)
    let master1 = initUser(context, "master1", [ren, reika])
    master1 = activateSkill(context, master1, 0, 1)

    let siira = DencoManager.getDenco(context, "11", 80, 3)
    let chitose = DencoManager.getDenco(context, "61", 80)
    let master2 = initUser(context, "master2", [siira, chitose])
    master2 = activateSkill(context, master2, 1)

    let config: AccessConfig = {
      offense: { state: master1, carIndex: 0 },
      defense: { state: master2, carIndex: 0 },
      station: siira.link[0]
    }
    const result = startAccess(context, config)
    await compareAccessOutput(context, result, "02")
  })
  test("03スキル無効化-アクセス後", async () => {
    const context = initContext("this is test", "random seed", false)
    context.random.mode = "force" // 確率依存のスキルを強制的に発動させます

    let miroku = DencoManager.getDenco(context, "4", 70)
    let chitose = DencoManager.getDenco(context, "61", 80)
    let master1 = initUser(context, "master1", [miroku, chitose])
    master1 = activateSkill(context, master1, 1)

    let siira = DencoManager.getDenco(context, "11", 80, 3)
    let seria = DencoManager.getDenco(context, "1", 80)
    let master2 = initUser(context, "master2", [siira, seria])
    master2 = activateSkill(context, master2, 1)

    let config: AccessConfig = {
      offense: { state: master1, carIndex: 0 },
      defense: { state: master2, carIndex: 0 },
      station: siira.link[0]
    }
    const result = startAccess(context, config)
    await compareAccessOutput(context, result, "03")
  })
  test("04アクセス後のスキル発動", async () => {
    const context = initContext("this is test", "random seed", false)
    context.random.mode = "force" // 確率依存のスキルを強制的に発動させます

    let reika = DencoManager.getDenco(context, "5", 80)
    let master1 = initUser(context, "master1", [reika])
    master1 = activateSkill(context, master1, 0)

    let siira = DencoManager.getDenco(context, "11", 80, 3)
    let seria = DencoManager.getDenco(context, "1", 80)
    let master2 = initUser(context, "master2", [siira, seria])
    master2 = activateSkill(context, master2, 1)

    let config: AccessConfig = {
      offense: { state: master1, carIndex: 0 },
      defense: { state: master2, carIndex: 0 },
      station: siira.link[0]
    }
    const result = startAccess(context, config)
    await compareAccessOutput(context, result, "04")
  })
  test("05時刻指定", async () => {
    const context = initContext("this is test", "random seed", false)

    // 昼の時間帯に指定
    context.clock = moment('2022-01-01T12:00:00+0900').valueOf()
    context.setClock('2022-01-01T12:00:00+0900') // どっちでもOK

    let reika = DencoManager.getDenco(context, "5", 80)
    let master1 = initUser(context, "master1", [reika])

    let luna = DencoManager.getDenco(context, "3", 80, 3)
    let master2 = initUser(context, "master2", [luna])

    let config = {
      offense: { state: master1, carIndex: 0 },
      defense: { state: master2, carIndex: 0 },
      station: luna.link[0]
    }
    const result = startAccess(context, config)
    await compareAccessOutput(context, result, "05")
  })
  test("06時刻経過-スキル発動", async () => {
    const context = initContext("this is test", "random seed", false)

    // 時刻を指定
    context.clock = moment('2022-01-01T12:30:00+0900').valueOf()

    let reika = DencoManager.getDenco(context, "5", 80)
    // レイカのHPを最大HP未満に設定
    reika.currentHp = 10
    let moe = DencoManager.getDenco(context, "9", 50)
    let master = initUser(context, "master1", [reika, moe])

    // 発動時刻を指定
    context.clock = moment('2022-01-01T13:00:00+0900').valueOf()
    master = refreshState(context, master)
    await compareStateOutput(context, master, "06")
  })
  test("07時刻経過-スキル発動", async () => {
    const context = initContext("this is test", "random seed", false)

    // 時刻を指定
    context.clock = moment('2022-01-01T12:00:00+0900').valueOf()
    context.setClock('2022-01-01T12:00:00+0900')

    let charlotte = DencoManager.getDenco(context, "6", 80)
    let master = initUser(context, "master1", [charlotte])

    // スキルを有効化
    master = activateSkill(context, master, 0)

    // 90分後
    context.clock = moment('2022-01-01T13:30:00+0900').valueOf()
    master = refreshState(context, master)
    await compareStateOutput(context, master, "07")
  })
  test("08追加アクセス", async () => {
    const context = initContext("this is test", "random seed", false)

    // みろくの確率依存のスキルを強制的に発動させる
    context.random.mode = "force"

    let miroku = DencoManager.getDenco(context, "4", 50)
    let reika = DencoManager.getDenco(context, "5", 50)
    let master1 = initUser(context, "master1", [miroku, reika])
    master1 = activateSkill(context, master1, 1)

    let izuna = DencoManager.getDenco(context, "13", 80, 3)
    let master2 = initUser(context, "master2", [izuna])

    let config = {
      offense: { state: master1, carIndex: 0 },
      defense: { state: master2, carIndex: 0 },
      station: izuna.link[0]
    }
    const result = startAccess(context, config)
    await compareAccessOutput(context, result, "08")
  })
  test("09カウンター", async () => {
    const context = initContext("this is test", "random seed", false)

    // シーナの確率依存のスキルを強制的に発動させる
    context.random.mode = "force"

    let charlotte = DencoManager.getDenco(context, "6", 50)
    let master1 = initUser(context, "master1", [charlotte])

    let sheena = DencoManager.getDenco(context, "7", 80, 3)
    let reika = DencoManager.getDenco(context, "5", 50)
    let master2 = initUser(context, "master2", [sheena, reika])
    master2 = activateSkill(context, master2, 1)

    let config = {
      offense: { state: master1, carIndex: 0 },
      defense: { state: master2, carIndex: 0 },
      station: sheena.link[0]
    }
    const result = startAccess(context, config)
    await compareAccessOutput(context, result, "09")
  })
})
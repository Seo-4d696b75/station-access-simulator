import { readFile } from "fs/promises";
import { activateSkill, DencoManager, formatEvents, init, initContext, initUser, startAccess } from "../..";

describe("format", () => {
  beforeAll(init)

  describe.each([true, false])("detail: %s", (detail) => {
    test("01基本的なアクセス", async () => {
      const context = initContext("this is test", "random seed", false)

      let reika = DencoManager.getDenco(context, "5", 80);
      let master1 = initUser(context, "master1", [reika]);
      master1 = activateSkill(context, master1, 0);

      let charlotte = DencoManager.getDenco(context, "6", 50, 3);
      let master2 = initUser(context, "master2", [charlotte]);

      let config = {
        offense: { state: master1, carIndex: 0 },
        defense: { state: master2, carIndex: 0 },
        station: charlotte.link[0]
      };
      const result = startAccess(context, config);
      const stdout = formatEvents(context, result.offense, detail, false)
        + "\n" + formatEvents(context, result.defense, detail, false)

      const txt = await readFile(`src/test/format/01${detail ? ".detail" : ""}.txt`)
      expect(stdout).toBe(txt.toString())
    })
  })
})
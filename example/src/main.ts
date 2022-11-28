import { AccessConfig, activateSkill, changeFormation, DencoManager, init, initContext, initUser, printEvents, startAccess } from "ekimemo-access-simulator"

init().then(() => {
  const context = initContext("this is test", "random-seed", true)
  let reika = DencoManager.getDenco(context, "5", 80)
  let charlotte = DencoManager.getDenco(context, "6", 50, 3)
  let offense = initUser(context, "master1", [reika])
  let seria = DencoManager.getDenco(context, "1", 50)
  offense = changeFormation(context, offense, [reika, seria])
  let defense = initUser(context, "user2", [charlotte])
  offense = activateSkill(context, offense, 0)
  let config: AccessConfig = {
    offense: {
      carIndex: 0,
      state: offense
    },
    defense: {
      carIndex: 0,
      state: defense
    },
    station: charlotte.link[0]
  }
  const result = startAccess(context, config)

  printEvents(context, result.offense, true)
  printEvents(context, result.defense, true)
})
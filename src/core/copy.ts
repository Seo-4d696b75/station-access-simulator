import { AccessDencoResult, AccessDencoState, AccessResult, AccessSideState, AccessState, AccessTriggeredSkill, AccessUserResult, DamageCalcState, DamageState, ScoreExpState } from "./access"
import { assert, SimulatorError } from "./context"
import { Denco, DencoState } from "./denco"
import { AccessEventData, AccessEventUser, Event, EventSkillTrigger, EventTriggeredSkill, LevelupDenco, SkillActivatedEventData, SkillEventReservation } from "./event"
import { FilmHolder } from "./film"
import { MutableProperty, ReadableProperty, TypedMap } from "./property"
import { SkillActiveTimeout, SkillCooldownTimeout, SkillHolder, SkillTransition, SkillTransitionType } from "./skill"
import { SkillPropertyReader } from "./skill/property"
import { ReadonlyState } from "./state"
import { Line, LinkResult, LinksResult, Station, StationLink } from "./station"
import { arraySchema, createCopyFunc, createMergeFunc, customSchema, defineCopyFunc, extendSchema, functionSchema, objectSchema, primitiveSchema } from "./typedCopy"
import { DailyStatistics, EventQueueEntry, StationStatistics, UserProperty, UserPropertyReader, UserState } from "./user"

// line & station

const lineSchema = objectSchema<Line>({
  name: primitiveSchema
})

const stationSchema = objectSchema<Station>({
  name: primitiveSchema,
  nameKana: primitiveSchema,
  attr: primitiveSchema,
  lines: arraySchema(lineSchema),
})

const stationLinkSchema = extendSchema<Station, StationLink>(stationSchema, {
  start: primitiveSchema,
})

export const {
  copy: copyStation,
  merge: mergeStation
} = defineCopyFunc(stationSchema)

export const {
  copy: copyStationLink,
  merge: mergeStationLink,
} = defineCopyFunc(stationLinkSchema)

// film

const filmSchema = objectSchema<FilmHolder>({
  type: primitiveSchema,
  theme: primitiveSchema,
  attackPercent: primitiveSchema,
  defendPercent: primitiveSchema,
  expPercent: primitiveSchema,
  skillActiveDuration: primitiveSchema,
  skillCooldownDuration: primitiveSchema,
  skill: customSchema(
    (v: any) => Object.assign({}, v),
    (dst: any, src: any) => Object.assign(dst, src),
  )
})

export const {
  copy: copyFilm,
  merge: mergeFilm,
} = defineCopyFunc(filmSchema)

// property

export function copyProperty<T extends ReadableProperty | MutableProperty>(src: ReadonlyState<T>): T {
  if (src?.constructor?.name === "SkillPropertyReader") {
    const reader = src as SkillPropertyReader
    return new SkillPropertyReader(
      copyProperty(reader.base),
      copyFilm(reader.film),
    ) as any
  }
  if (src?.constructor?.name === "TypedMap") {
    const map = src as TypedMap
    return map.clone() as any
  }
  throw new SimulatorError("can not copy unknown implementation")
}

export function mergeProperty<T extends ReadableProperty | MutableProperty>(dst: T, src: ReadonlyState<T>) {
  if (src?.constructor?.name === "SkillPropertyReader"
    && dst?.constructor?.name === "SkillPropertyReader") {
    const srcReader = src as SkillPropertyReader
    const dstReader = dst as SkillPropertyReader
    mergeProperty(dstReader.base, srcReader.base)
    mergeFilm(dstReader.film, srcReader.film)
    return
  }
  if (src?.constructor?.name === "TypedMap"
    && dst?.constructor?.name === "TypedMap") {
    const srcMap = src as TypedMap
    const dstMap = dst as TypedMap
    dstMap.merge(srcMap)
    return
  }
  throw new SimulatorError(
    "can not merge unknown implementation\n" +
    `dst class: ${dst?.constructor?.name}, ` +
    `src class: ${src?.constructor?.name}`
  )
}

// skill

const skillTransitionSchema = objectSchema<SkillTransition<SkillTransitionType>>({
  state: primitiveSchema,
  data: objectSchema<SkillActiveTimeout | SkillCooldownTimeout>({
    activatedAt: primitiveSchema,
    activeTimeout: primitiveSchema,
    cooldownTimeout: primitiveSchema,
  }),
})

const skillSchema = objectSchema<SkillHolder>({
  transitionType: primitiveSchema,
  deactivate: primitiveSchema,
  type: primitiveSchema,
  level: primitiveSchema,
  name: primitiveSchema,
  transition: skillTransitionSchema,
  property: customSchema(copyProperty, mergeProperty),
  data: customSchema(copyProperty, mergeProperty),
  canEnabled: functionSchema,
  canActivated: functionSchema,
  onActivated: functionSchema,
  triggerOnAccess: functionSchema,
  triggerOnEvent: functionSchema,
  onAccessComplete: functionSchema,
  onDencoReboot: functionSchema,
  onLinkDisconnected: functionSchema,
  onLinkStarted: functionSchema,
  onHourCycle: functionSchema,
})

export const {
  copy: copySkill,
  merge: mergeSkill,
} = defineCopyFunc(skillSchema) as {
  copy: (src: ReadonlyState<SkillHolder>) => SkillHolder
  merge: (dst: SkillHolder, src: ReadonlyState<SkillHolder>) => void
}

// denco

const dencoSchema = objectSchema<Denco>({
  numbering: primitiveSchema,
  name: primitiveSchema,
  type: primitiveSchema,
  attr: primitiveSchema,
})

export const {
  copy: copyDenco,
  merge: mergeDenco,
} = defineCopyFunc(dencoSchema)

const dencoStateSchema = extendSchema<Denco, DencoState>(dencoSchema, {
  level: primitiveSchema,
  nextExp: primitiveSchema,
  currentExp: primitiveSchema,
  maxHp: primitiveSchema,
  currentHp: primitiveSchema,
  ap: primitiveSchema,
  skill: skillSchema,
  film: filmSchema,
  link: arraySchema(stationLinkSchema),
})

export const copyDencoState: (src: ReadonlyState<DencoState>) => DencoState = createCopyFunc(dencoStateSchema)
export const mergeDencoState: (dst: DencoState, src: ReadonlyState<DencoState>) => void = createMergeFunc(dencoStateSchema)


// user property

const userPropertyReaderSchema = objectSchema<UserPropertyReader>({
  name: primitiveSchema,
  daily: objectSchema<UserPropertyReader["daily"]>({
    readDistance: functionSchema,
    readAccessStationCount: functionSchema,
  }),
  history: objectSchema<UserPropertyReader["history"]>({
    isHomeStation: functionSchema,
    getStationAccessCount: functionSchema,
  })
})

const userPropertySchema = objectSchema<UserProperty>({
  name: primitiveSchema,
  daily: objectSchema<DailyStatistics>({
    distance: primitiveSchema,
    accessStationCount: primitiveSchema,
  }),
  history: objectSchema<StationStatistics>({
    isHomeStation: functionSchema,
    getStationAccessCount: functionSchema,
  })
})

// access

const damageStateSchema = objectSchema<DamageState>({
  value: primitiveSchema,
  attr: primitiveSchema,
})

const damageCalcStateSchema = objectSchema<DamageCalcState>({
  variable: primitiveSchema,
  constant: primitiveSchema,
})

const scoreExpStateSchema = objectSchema<ScoreExpState>({
  access: primitiveSchema,
  skill: primitiveSchema,
  link: primitiveSchema,
})

const accessDencoStateSchema = extendSchema<DencoState, AccessDencoState>(dencoStateSchema, {
  which: primitiveSchema,
  who: primitiveSchema,
  carIndex: primitiveSchema,
  levelBefore: primitiveSchema,
  maxHpBefore: primitiveSchema,
  hpBefore: primitiveSchema,
  hpAfter: primitiveSchema,
  skillInvalidated: primitiveSchema,
  reboot: primitiveSchema,
  damage: damageStateSchema,
  exp: scoreExpStateSchema,
})


export const copyAccessDencoState: (src: ReadonlyState<AccessDencoState>) => AccessDencoState = createCopyFunc(accessDencoStateSchema)
export const mergeAccessDencoState: (dst: AccessDencoState, src: ReadonlyState<AccessDencoState>) => void = createMergeFunc(accessDencoStateSchema)


const accessTriggerSkillSchema = extendSchema<Denco, AccessTriggeredSkill>(dencoSchema, {
  step: primitiveSchema
})

const accessSideStateSchema = objectSchema<AccessSideState>({
  user: userPropertyReaderSchema,
  formation: arraySchema(accessDencoStateSchema),
  carIndex: primitiveSchema,
  triggeredSkills: arraySchema(accessTriggerSkillSchema),
  probabilityBoosted: primitiveSchema,
  probabilityBoostPercent: primitiveSchema,
  score: scoreExpStateSchema,
  displayedScore: primitiveSchema,
  displayedExp: primitiveSchema,
})

const accessStateSchema = objectSchema<AccessState>({
  time: primitiveSchema,
  station: stationSchema,
  offense: accessSideStateSchema,
  defense: accessSideStateSchema,
  depth: primitiveSchema,
  damageBase: damageCalcStateSchema,
  damageFixed: primitiveSchema,
  attackPercent: primitiveSchema,
  defendPercent: primitiveSchema,
  damageRatio: primitiveSchema,
  linkSuccess: primitiveSchema,
  linkDisconnected: primitiveSchema,
  pinkMode: primitiveSchema,
  pinkItemSet: primitiveSchema,
  pinkItemUsed: primitiveSchema,
})

export const {
  copy: copyAccessState,
  merge: mergeAccessState,
} = defineCopyFunc(accessStateSchema) as {
  copy: (src: ReadonlyState<AccessState>) => AccessState
  merge: (dst: AccessState, src: ReadonlyState<AccessState>) => void
}

// station link result

const linkResultSchema = extendSchema<StationLink, LinkResult>(stationLinkSchema, {
  end: primitiveSchema,
  duration: primitiveSchema,
  linkScore: primitiveSchema,
  comboBonus: primitiveSchema,
  matchAttr: primitiveSchema,
  matchBonus: primitiveSchema,
  totalScore: primitiveSchema,
})

const linksResultSchema = objectSchema<LinksResult>({
  time: primitiveSchema,
  denco: dencoStateSchema,
  link: arraySchema(linkResultSchema),
  totalScore: primitiveSchema,
  linkScore: primitiveSchema,
  comboBonus: primitiveSchema,
  matchBonus: primitiveSchema,
  matchCnt: primitiveSchema,
  exp: primitiveSchema,
})

const copyLinksResult = createCopyFunc(linksResultSchema)
const mergeLinksResult = createMergeFunc(linksResultSchema)

// event

const accessDencoResultSchema = extendSchema<AccessDencoState, AccessDencoResult>(accessDencoStateSchema, {
  disconnectedLink: linksResultSchema,
})

const accessEventUserSchema = objectSchema<AccessEventUser>({
  user: userPropertySchema,
  formation: arraySchema(accessDencoResultSchema),
  carIndex: primitiveSchema,
  triggeredSkills: arraySchema(accessTriggerSkillSchema),
  probabilityBoosted: primitiveSchema,
  probabilityBoostPercent: primitiveSchema,
  score: scoreExpStateSchema,
  displayedScore: primitiveSchema,
  displayedExp: primitiveSchema,
})

const accessEventDataSchema = objectSchema<AccessEventData>({
  which: primitiveSchema,
  time: primitiveSchema,
  station: stationSchema,
  offense: accessEventUserSchema,
  defense: accessEventUserSchema,
  depth: primitiveSchema,
  damageBase: damageCalcStateSchema,
  damageFixed: primitiveSchema,
  attackPercent: primitiveSchema,
  defendPercent: primitiveSchema,
  damageRatio: primitiveSchema,
  linkSuccess: primitiveSchema,
  linkDisconnected: primitiveSchema,
  pinkMode: primitiveSchema,
  pinkItemSet: primitiveSchema,
  pinkItemUsed: primitiveSchema,
})

const copyAccessEventData = createCopyFunc(accessEventDataSchema)
const mergeAccessEventData = createMergeFunc(accessEventDataSchema)

const skillActivatedEventDataSchema = objectSchema<SkillActivatedEventData>({
  time: primitiveSchema,
  carIndex: primitiveSchema,
  denco: dencoStateSchema,
  skillName: primitiveSchema,
})

const copySkillActivatedData = createCopyFunc(skillActivatedEventDataSchema)
const mergeSkillActivatedData = createMergeFunc(skillActivatedEventDataSchema)

const eventTriggeredSkillSchema = objectSchema<EventTriggeredSkill>({
  time: primitiveSchema,
  carIndex: primitiveSchema,
  denco: dencoStateSchema,
  skillName: primitiveSchema,
  step: primitiveSchema,
})

const copyEventTriggerSkill = createCopyFunc(eventTriggeredSkillSchema)
const mergeEventTriggerSkill = createMergeFunc(eventTriggeredSkillSchema)

const levelupDencoSchema = objectSchema<LevelupDenco>({
  time: primitiveSchema,
  after: dencoStateSchema,
  before: dencoStateSchema,
})

const copyLevelupDenco = createCopyFunc(levelupDencoSchema)
const mergeLevelupDenco = createMergeFunc(levelupDencoSchema)

export function copyEvent(e: ReadonlyState<Event>): Event {
  switch (e.type) {
    case "access":
      return {
        type: "access",
        data: copyAccessEventData(e.data)
      }
    case "reboot":
      return {
        type: "reboot",
        data: copyLinksResult(e.data)
      }
    case "skill_activated":
      return {
        type: "skill_activated",
        data: copySkillActivatedData(e.data)
      }
    case "skill_trigger":
      return {
        type: "skill_trigger",
        data: copyEventTriggerSkill(e.data)
      }
    case "levelup":
      return {
        type: "levelup",
        data: copyLevelupDenco(e.data)
      }
  }
}

export function mergeEvent(dst: Event, src: ReadonlyState<Event>) {
  assert(dst.type === src.type)
  switch (dst.type) {
    case "access":
      assert(src.type === "access")
      mergeAccessEventData(dst.data, src.data)
      break
    case "reboot":
      assert(src.type === "reboot")
      mergeLinksResult(dst.data, src.data)
      break
    case "skill_activated":
      assert(src.type === "skill_activated")
      mergeSkillActivatedData(dst.data, src.data)
      break
    case "skill_trigger":
      assert(src.type === "skill_trigger")
      mergeEventTriggerSkill(dst.data, src.data)
      break
    case "levelup":
      assert(src.type === "levelup")
      mergeLevelupDenco(dst.data, src.data)
      break
  }
}

// event queue

const eventSkillTriggerSchema = objectSchema<EventSkillTrigger>({
  probabilityKey: primitiveSchema,
  recipe: functionSchema,
})

const skillEventReservationSchema = objectSchema<SkillEventReservation>({
  denco: dencoSchema,
  trigger: eventSkillTriggerSchema,
})

const copySkillEventReservation = createCopyFunc(skillEventReservationSchema)
const mergeSkillEventReservation = createMergeFunc(skillEventReservationSchema)

export function copyEventQueueEntry(e: ReadonlyState<EventQueueEntry>): EventQueueEntry {
  switch (e.type) {
    case "skill":
      return {
        type: "skill",
        time: e.time,
        data: copySkillEventReservation(e.data),
      }
    case "hour_cycle":
      return {
        type: "hour_cycle",
        time: e.time,
        data: undefined,
      }
  }
}

export function mergeEventQueueEntry(dst: EventQueueEntry, src: ReadonlyState<EventQueueEntry>) {
  assert(dst.type === src.type)
  dst.time = src.time
  switch (dst.type) {
    case "skill":
      assert(src.type === "skill")
      mergeSkillEventReservation(dst.data, src.data)
      break
    case "hour_cycle":
      break
  }
}

// user state

const userStateSchema = objectSchema<UserState>({
  user: userPropertySchema,
  formation: arraySchema(dencoStateSchema),
  event: arraySchema(customSchema(copyEvent, mergeEvent)), 
  queue: arraySchema(customSchema(copyEventQueueEntry, mergeEventQueueEntry)),
})

export const copyUserState = createCopyFunc(userStateSchema)
export const mergeUserState = createMergeFunc(userStateSchema)

// access result

const accessUserResultSchema = objectSchema<AccessUserResult>({
  user: userPropertySchema,
  formation: arraySchema(accessDencoResultSchema),
  carIndex: primitiveSchema,
  triggeredSkills: arraySchema(accessTriggerSkillSchema),
  probabilityBoosted: primitiveSchema,
  probabilityBoostPercent: primitiveSchema,
  score: scoreExpStateSchema,
  displayedScore: primitiveSchema,
  displayedExp: primitiveSchema,
  event: arraySchema(customSchema(copyEvent, mergeEvent)), 
  queue: arraySchema(customSchema(copyEventQueueEntry, mergeEventQueueEntry)),
})

const accessResultSchema = objectSchema<AccessResult>({
  time: primitiveSchema,
  station: stationSchema,
  offense: accessUserResultSchema,
  defense: accessUserResultSchema,
  depth: primitiveSchema,
  damageBase: damageCalcStateSchema,
  damageFixed: primitiveSchema,
  attackPercent: primitiveSchema,
  defendPercent: primitiveSchema,
  damageRatio: primitiveSchema,
  linkSuccess: primitiveSchema,
  linkDisconnected: primitiveSchema,
  pinkMode: primitiveSchema,
  pinkItemSet: primitiveSchema,
  pinkItemUsed: primitiveSchema,
})

export const copyAccessResult = createCopyFunc(accessResultSchema)
export const mergeAccessResult = createMergeFunc(accessResultSchema)
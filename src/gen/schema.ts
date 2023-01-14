import { AccessDencoResult, AccessDencoState, AccessResult, AccessSideState, AccessState, AccessTriggeredSkill, AccessUserResult, DamageCalcState, DamageState, ScoreExpState } from "../core/access"
import { AccessScoreExpResult, AccessScoreExpState, ScoreExpCalcState, ScoreExpResult } from "../core/access/score"
import { assert, SimulatorError } from "../core/context"
import { Denco, DencoState } from "../core/denco"
import { AccessEventData, AccessEventUser, Event, EventSkillTrigger, EventTriggeredSkill, LevelupDenco, SkillEventDencoState, SkillEventReservation, SkillEventState } from "../core/event"
import { FilmHolder } from "../core/film"
import { MutableProperty, ReadableProperty, TypedMap } from "../core/property"
import { SkillActiveTimeout, SkillCooldownTimeout, SkillHolder, SkillTransition, SkillTransitionType } from "../core/skill"
import { SkillPropertyReader } from "../core/skill/property"
import { ReadonlyState } from "../core/state"
import { Line, LinkResult, LinksResult, Station, StationLink } from "../core/station"
import { DailyStatistics, EventQueueEntry, StationStatistics, UserProperty, UserPropertyReader, UserState } from "../core/user"
import { arraySchema, createCopyFunc, createMergeFunc, customSchema, functionSchema, objectSchema, primitiveSchema } from "./helper"

// line & station

export const lineSchema = objectSchema<Line>({
  name: primitiveSchema
})

export const stationSchema = objectSchema<Station>({
  name: primitiveSchema,
  nameKana: primitiveSchema,
  attr: primitiveSchema,
  lines: arraySchema(lineSchema),
})

export const stationLinkSchema = objectSchema<StationLink>({
  ...stationSchema.fields,
  start: primitiveSchema,
})

// film

export const filmHolderSchema = objectSchema<FilmHolder>({
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

// property

const copyFilm = createCopyFunc(filmHolderSchema)
const mergeFilm = createMergeFunc(filmHolderSchema)

function copyProperty<T extends ReadableProperty>(src: ReadonlyState<T>): T {
  if (src instanceof SkillPropertyReader) {
    return new SkillPropertyReader(
      copyProperty(src.base),
      copyFilm(src.film),
    ) as any
  }
  if (src instanceof TypedMap) {
    return src.clone() as any
  }
  throw new SimulatorError(`can not copy unknown implementation: ${src}`)
}

function normalizeProperty<T extends ReadableProperty>(src: ReadonlyState<T>): T {
  if (src instanceof SkillPropertyReader) {
    return copyProperty(src.base) as any
  }
  if (src instanceof TypedMap) {
    return src.clone() as any
  }
  throw new SimulatorError(`can not normalize unknown implementation: ${src}`)
}

function mergeProperty<T extends ReadableProperty>(dst: T, src: ReadonlyState<T>) {
  if (src instanceof SkillPropertyReader
    && dst instanceof SkillPropertyReader) {
    mergeProperty(dst.base, src.base)
    mergeFilm(dst.film, src.film)
    return
  }
  if (src instanceof TypedMap
    && dst instanceof TypedMap) {
    dst.merge(src)
    return
  }
  throw new SimulatorError(
    "can not merge unknown implementation\n" +
    `dst class: ${dst}, ` +
    `src class: ${src}`
  )
}

export const mutablePropertySchema = customSchema<MutableProperty>(copyProperty, mergeProperty, normalizeProperty)

// skill

const skillTransitionSchema = objectSchema<SkillTransition<SkillTransitionType>>({
  state: primitiveSchema,
  data: objectSchema<SkillActiveTimeout | SkillCooldownTimeout>({
    activatedAt: primitiveSchema,
    activeTimeout: primitiveSchema,
    cooldownTimeout: primitiveSchema,
    activeDuration: primitiveSchema,
    cooldownDuration: primitiveSchema,
  }),
})

export const skillHolderSchema = objectSchema<SkillHolder>({
  transitionType: primitiveSchema,
  deactivate: primitiveSchema,
  type: primitiveSchema,
  level: primitiveSchema,
  name: primitiveSchema,
  transition: skillTransitionSchema,
  property: mutablePropertySchema,
  data: mutablePropertySchema,
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
  onUnable: functionSchema,
  onCooldown: functionSchema,
})

// denco

export const dencoSchema = objectSchema<Denco>({
  numbering: primitiveSchema,
  name: primitiveSchema,
  fullName: primitiveSchema,
  firstName: primitiveSchema,
  type: primitiveSchema,
  attr: primitiveSchema,
})

export const dencoStateSchema = objectSchema<DencoState>({
  ...dencoSchema.fields,
  level: primitiveSchema,
  nextExp: primitiveSchema,
  currentExp: primitiveSchema,
  maxHp: primitiveSchema,
  currentHp: primitiveSchema,
  ap: primitiveSchema,
  skill: skillHolderSchema,
  film: filmHolderSchema,
  link: arraySchema(stationLinkSchema),
})

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
    isNewStation: functionSchema,
  })
})

export const userPropertySchema = objectSchema<UserProperty>({
  name: primitiveSchema,
  daily: objectSchema<DailyStatistics>({
    distance: primitiveSchema,
    accessStationCount: primitiveSchema,
  }),
  history: objectSchema<StationStatistics>({
    isHomeStation: functionSchema,
    getStationAccessCount: functionSchema,
    isNewStation: functionSchema,
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

const accessScoreExpStateSchema = objectSchema<AccessScoreExpState>({
  accessBonus: primitiveSchema,
  damageBonus: primitiveSchema,
  linkBonus: primitiveSchema,
})

const accessScoreExpResultSchema = objectSchema<AccessScoreExpResult>({
  ...accessScoreExpStateSchema.fields,
  total: primitiveSchema
})

const scoreExpStateSchema = objectSchema<ScoreExpState>({
  access: accessScoreExpStateSchema,
  skill: primitiveSchema,
  link: primitiveSchema,
})

const scoreExpResultSchema = objectSchema<ScoreExpResult>({
  access: accessScoreExpResultSchema,
  skill: primitiveSchema,
  link: primitiveSchema,
  total: primitiveSchema
})

const scoreExpCalcStateSchema = objectSchema<ScoreExpCalcState>({
  access: primitiveSchema,
  accessBonus: primitiveSchema,
  damageBonus: primitiveSchema,
  linkBonus: primitiveSchema,
  link: primitiveSchema
})

export const accessDencoStateSchema = objectSchema<AccessDencoState>({
  ...dencoStateSchema.fields,
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
  expPercent: scoreExpCalcStateSchema,
})

const accessTriggerSkillSchema = objectSchema<AccessTriggeredSkill>({
  ...dencoSchema.fields,
  step: primitiveSchema
})

export const accessSideStateSchema = objectSchema<AccessSideState>({
  user: userPropertyReaderSchema,
  formation: arraySchema(accessDencoStateSchema),
  carIndex: primitiveSchema,
  triggeredSkills: arraySchema(accessTriggerSkillSchema),
  probabilityBoosted: primitiveSchema,
  probabilityBoostPercent: primitiveSchema,
  score: scoreExpStateSchema,
  scorePercent: scoreExpCalcStateSchema,
})


export const accessStateSchema = objectSchema<AccessState>({
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

// station link result

export const linkResultSchema = objectSchema<LinkResult>({
  ...stationLinkSchema.fields,
  end: primitiveSchema,
  duration: primitiveSchema,
  linkScore: primitiveSchema,
  comboBonus: primitiveSchema,
  matchAttr: primitiveSchema,
  matchBonus: primitiveSchema,
  totalScore: primitiveSchema,
  exp: primitiveSchema,
})

export const linksResultSchema = objectSchema<LinksResult>({
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
accessDencoStateSchema.fields.damage
export const accessDencoResultSchema = objectSchema<AccessDencoResult>({
  ...accessDencoStateSchema.fields,
  disconnectedLink: linksResultSchema,
  exp: scoreExpResultSchema,
})

const accessEventUserSchema = objectSchema<AccessEventUser>({
  user: userPropertySchema,
  formation: arraySchema(accessDencoResultSchema),
  carIndex: primitiveSchema,
  triggeredSkills: arraySchema(accessTriggerSkillSchema),
  probabilityBoosted: primitiveSchema,
  probabilityBoostPercent: primitiveSchema,
  score: scoreExpResultSchema,
  scorePercent: scoreExpCalcStateSchema,
  displayedScore: primitiveSchema,
  displayedExp: primitiveSchema,
})

export const accessEventDataSchema = objectSchema<AccessEventData>({
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

function copyEvent(e: ReadonlyState<Event>): Event {
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

function mergeEvent(dst: Event, src: ReadonlyState<Event>) {
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

export const eventSchema = customSchema(copyEvent, mergeEvent)

// event queue

const eventSkillTriggerSchema = objectSchema<EventSkillTrigger>({
  probability: primitiveSchema,
  recipe: functionSchema,
  fallbackRecipe: functionSchema,
})

const skillEventReservationSchema = objectSchema<SkillEventReservation>({
  denco: dencoSchema,
  trigger: eventSkillTriggerSchema,
})

const copySkillEventReservation = createCopyFunc(skillEventReservationSchema)
const mergeSkillEventReservation = createMergeFunc(skillEventReservationSchema)

function copyEventQueueEntry(e: ReadonlyState<EventQueueEntry>): EventQueueEntry {
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

function mergeEventQueueEntry(dst: EventQueueEntry, src: ReadonlyState<EventQueueEntry>) {
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

export const eventQueueEntrySchema = customSchema(copyEventQueueEntry, mergeEventQueueEntry)

// user state

export const userStateSchema = objectSchema<UserState>({
  user: userPropertySchema,
  formation: arraySchema(dencoStateSchema),
  event: arraySchema(eventSchema),
  queue: customSchema<EventQueueEntry[]>(
    (src) => src.map(e => copyEventQueueEntry(e)),
    (dst, src) => {
      // timeに基づきsortするためリスト内の相対的位置が変化する
      // リスト要素どうしの対応が曖昧になりデフォルト実装ではmergeできない
      // entryの各要素は変更されないと仮定して丸ごとコピーする
      dst.splice(0, dst.length)
      src.forEach(e => dst.push(copyEventQueueEntry(e)))
    }
  )
})

// access result

export const accessUserResultSchema = objectSchema<AccessUserResult>({
  user: userPropertySchema,
  formation: arraySchema(accessDencoResultSchema),
  carIndex: primitiveSchema,
  triggeredSkills: arraySchema(accessTriggerSkillSchema),
  probabilityBoosted: primitiveSchema,
  probabilityBoostPercent: primitiveSchema,
  score: scoreExpResultSchema,
  scorePercent: scoreExpCalcStateSchema,
  displayedScore: primitiveSchema,
  displayedExp: primitiveSchema,
  event: arraySchema(customSchema(copyEvent, mergeEvent)),
  queue: arraySchema(customSchema(copyEventQueueEntry, mergeEventQueueEntry)),
})

export const accessResultSchema = objectSchema<AccessResult>({
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

// skill event

export const skillEventDencoStateSchema = objectSchema<SkillEventDencoState>({
  ...dencoStateSchema.fields,
  who: primitiveSchema,
  carIndex: primitiveSchema,
  skillInvalidated: primitiveSchema,
})

export const skillEventStateSchema = objectSchema<SkillEventState>({
  ...userStateSchema.fields,
  time: primitiveSchema,
  formation: arraySchema(skillEventDencoStateSchema),
  probabilityBoostPercent: primitiveSchema,
  probabilityBoosted: primitiveSchema,
  carIndex: primitiveSchema,
})
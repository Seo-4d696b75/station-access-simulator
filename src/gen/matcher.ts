import * as types from '../';
import { createMatcher } from './helper';
import * as schema from './schema';
/*
 * This file is auto-generated by ./generate.ts
 * Reading schemes and custom functions exported in ./schema.ts,
 * the generator defines custom jest matcher for each type.
 * Unlink toMatchObject provided by default,
 * these custom matchers ONLY compare properties defined in each type declaration.
 * 
 * The generator searches ./schema.ts for
 * variable named '${name}Schema', where its type must be ObjectSchema<$name>,
 * then generates custom matchers
 */

// auto generated matchers
export const toMatchLine = createMatcher<types.Line>(schema.lineSchema)
export const toMatchStation = createMatcher<types.Station>(schema.stationSchema)
export const toMatchStationLink = createMatcher<types.StationLink>(schema.stationLinkSchema)
export const toMatchFilmHolder = createMatcher<types.FilmHolder>(schema.filmHolderSchema)
export const toMatchSkillHolder = createMatcher<types.SkillHolder>(schema.skillHolderSchema)
export const toMatchDenco = createMatcher<types.Denco>(schema.dencoSchema)
export const toMatchDencoState = createMatcher<types.DencoState>(schema.dencoStateSchema)
export const toMatchUserProperty = createMatcher<types.UserProperty>(schema.userPropertySchema)
export const toMatchAccessDencoState = createMatcher<types.AccessDencoState>(schema.accessDencoStateSchema)
export const toMatchAccessSideState = createMatcher<types.AccessSideState>(schema.accessSideStateSchema)
export const toMatchAccessState = createMatcher<types.AccessState>(schema.accessStateSchema)
export const toMatchLinkResult = createMatcher<types.LinkResult>(schema.linkResultSchema)
export const toMatchLinksResult = createMatcher<types.LinksResult>(schema.linksResultSchema)
export const toMatchAccessDencoResult = createMatcher<types.AccessDencoResult>(schema.accessDencoResultSchema)
export const toMatchAccessEventData = createMatcher<types.AccessEventData>(schema.accessEventDataSchema)
export const toMatchEvent = createMatcher<types.Event>(schema.eventSchema)
export const toMatchEventQueueEntry = createMatcher<types.EventQueueEntry>(schema.eventQueueEntrySchema)
export const toMatchUserState = createMatcher<types.UserState>(schema.userStateSchema)
export const toMatchAccessUserResult = createMatcher<types.AccessUserResult>(schema.accessUserResultSchema)
export const toMatchAccessResult = createMatcher<types.AccessResult>(schema.accessResultSchema)
export const toMatchSkillEventDencoState = createMatcher<types.SkillEventDencoState>(schema.skillEventDencoStateSchema)
export const toMatchSkillEventState = createMatcher<types.SkillEventState>(schema.skillEventStateSchema)

// declare types for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toMatchLine(expected: types.Line, ...mergeWithExpected: any[]): R;
      toMatchStation(expected: types.Station, ...mergeWithExpected: any[]): R;
      toMatchStationLink(expected: types.StationLink, ...mergeWithExpected: any[]): R;
      toMatchFilmHolder(expected: types.FilmHolder, ...mergeWithExpected: any[]): R;
      toMatchSkillHolder(expected: types.SkillHolder, ...mergeWithExpected: any[]): R;
      toMatchDenco(expected: types.Denco, ...mergeWithExpected: any[]): R;
      toMatchDencoState(expected: types.DencoState, ...mergeWithExpected: any[]): R;
      toMatchUserProperty(expected: types.UserProperty, ...mergeWithExpected: any[]): R;
      toMatchAccessDencoState(expected: types.AccessDencoState, ...mergeWithExpected: any[]): R;
      toMatchAccessSideState(expected: types.AccessSideState, ...mergeWithExpected: any[]): R;
      toMatchAccessState(expected: types.AccessState, ...mergeWithExpected: any[]): R;
      toMatchLinkResult(expected: types.LinkResult, ...mergeWithExpected: any[]): R;
      toMatchLinksResult(expected: types.LinksResult, ...mergeWithExpected: any[]): R;
      toMatchAccessDencoResult(expected: types.AccessDencoResult, ...mergeWithExpected: any[]): R;
      toMatchAccessEventData(expected: types.AccessEventData, ...mergeWithExpected: any[]): R;
      toMatchEvent(expected: types.Event, ...mergeWithExpected: any[]): R;
      toMatchEventQueueEntry(expected: types.EventQueueEntry, ...mergeWithExpected: any[]): R;
      toMatchUserState(expected: types.UserState, ...mergeWithExpected: any[]): R;
      toMatchAccessUserResult(expected: types.AccessUserResult, ...mergeWithExpected: any[]): R;
      toMatchAccessResult(expected: types.AccessResult, ...mergeWithExpected: any[]): R;
      toMatchSkillEventDencoState(expected: types.SkillEventDencoState, ...mergeWithExpected: any[]): R;
      toMatchSkillEventState(expected: types.SkillEventState, ...mergeWithExpected: any[]): R;
    }

    interface Expect {
      toMatchLine: (expected: types.Line, ...mergeWithExpected: any[]) => any;
      toMatchStation: (expected: types.Station, ...mergeWithExpected: any[]) => any;
      toMatchStationLink: (expected: types.StationLink, ...mergeWithExpected: any[]) => any;
      toMatchFilmHolder: (expected: types.FilmHolder, ...mergeWithExpected: any[]) => any;
      toMatchSkillHolder: (expected: types.SkillHolder, ...mergeWithExpected: any[]) => any;
      toMatchDenco: (expected: types.Denco, ...mergeWithExpected: any[]) => any;
      toMatchDencoState: (expected: types.DencoState, ...mergeWithExpected: any[]) => any;
      toMatchUserProperty: (expected: types.UserProperty, ...mergeWithExpected: any[]) => any;
      toMatchAccessDencoState: (expected: types.AccessDencoState, ...mergeWithExpected: any[]) => any;
      toMatchAccessSideState: (expected: types.AccessSideState, ...mergeWithExpected: any[]) => any;
      toMatchAccessState: (expected: types.AccessState, ...mergeWithExpected: any[]) => any;
      toMatchLinkResult: (expected: types.LinkResult, ...mergeWithExpected: any[]) => any;
      toMatchLinksResult: (expected: types.LinksResult, ...mergeWithExpected: any[]) => any;
      toMatchAccessDencoResult: (expected: types.AccessDencoResult, ...mergeWithExpected: any[]) => any;
      toMatchAccessEventData: (expected: types.AccessEventData, ...mergeWithExpected: any[]) => any;
      toMatchEvent: (expected: types.Event, ...mergeWithExpected: any[]) => any;
      toMatchEventQueueEntry: (expected: types.EventQueueEntry, ...mergeWithExpected: any[]) => any;
      toMatchUserState: (expected: types.UserState, ...mergeWithExpected: any[]) => any;
      toMatchAccessUserResult: (expected: types.AccessUserResult, ...mergeWithExpected: any[]) => any;
      toMatchAccessResult: (expected: types.AccessResult, ...mergeWithExpected: any[]) => any;
      toMatchSkillEventDencoState: (expected: types.SkillEventDencoState, ...mergeWithExpected: any[]) => any;
      toMatchSkillEventState: (expected: types.SkillEventState, ...mergeWithExpected: any[]) => any;
    }

    interface InverseAsymmetricMatchers {
      toMatchLine: (expected: types.Line, ...mergeWithExpected: any[]) => any;
      toMatchStation: (expected: types.Station, ...mergeWithExpected: any[]) => any;
      toMatchStationLink: (expected: types.StationLink, ...mergeWithExpected: any[]) => any;
      toMatchFilmHolder: (expected: types.FilmHolder, ...mergeWithExpected: any[]) => any;
      toMatchSkillHolder: (expected: types.SkillHolder, ...mergeWithExpected: any[]) => any;
      toMatchDenco: (expected: types.Denco, ...mergeWithExpected: any[]) => any;
      toMatchDencoState: (expected: types.DencoState, ...mergeWithExpected: any[]) => any;
      toMatchUserProperty: (expected: types.UserProperty, ...mergeWithExpected: any[]) => any;
      toMatchAccessDencoState: (expected: types.AccessDencoState, ...mergeWithExpected: any[]) => any;
      toMatchAccessSideState: (expected: types.AccessSideState, ...mergeWithExpected: any[]) => any;
      toMatchAccessState: (expected: types.AccessState, ...mergeWithExpected: any[]) => any;
      toMatchLinkResult: (expected: types.LinkResult, ...mergeWithExpected: any[]) => any;
      toMatchLinksResult: (expected: types.LinksResult, ...mergeWithExpected: any[]) => any;
      toMatchAccessDencoResult: (expected: types.AccessDencoResult, ...mergeWithExpected: any[]) => any;
      toMatchAccessEventData: (expected: types.AccessEventData, ...mergeWithExpected: any[]) => any;
      toMatchEvent: (expected: types.Event, ...mergeWithExpected: any[]) => any;
      toMatchEventQueueEntry: (expected: types.EventQueueEntry, ...mergeWithExpected: any[]) => any;
      toMatchUserState: (expected: types.UserState, ...mergeWithExpected: any[]) => any;
      toMatchAccessUserResult: (expected: types.AccessUserResult, ...mergeWithExpected: any[]) => any;
      toMatchAccessResult: (expected: types.AccessResult, ...mergeWithExpected: any[]) => any;
      toMatchSkillEventDencoState: (expected: types.SkillEventDencoState, ...mergeWithExpected: any[]) => any;
      toMatchSkillEventState: (expected: types.SkillEventState, ...mergeWithExpected: any[]) => any;
    }
  }
}

// register custom matchers
expect.extend({
  toMatchLine,
  toMatchStation,
  toMatchStationLink,
  toMatchFilmHolder,
  toMatchSkillHolder,
  toMatchDenco,
  toMatchDencoState,
  toMatchUserProperty,
  toMatchAccessDencoState,
  toMatchAccessSideState,
  toMatchAccessState,
  toMatchLinkResult,
  toMatchLinksResult,
  toMatchAccessDencoResult,
  toMatchAccessEventData,
  toMatchEvent,
  toMatchEventQueueEntry,
  toMatchUserState,
  toMatchAccessUserResult,
  toMatchAccessResult,
  toMatchSkillEventDencoState,
  toMatchSkillEventState
})

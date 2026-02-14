import {
  createEvent as createEventImpl,
  deleteEvent as deleteEventImpl,
  exchangeCode as exchangeCodeImpl,
  getAuthorizationHeader as getAuthorizationHeaderImpl,
  getAuthUrl as getAuthUrlImpl,
  getCalendars as getCalendarsImpl,
  listEvents as listEventsImpl,
  performCronSync as performCronSyncImpl,
  syncEventsAction as syncEventsActionImpl,
  updateEvent as updateEventImpl,
} from "./_google_calendar/google_calendar_actions";
import {
  deleteLocalEvent as deleteLocalEventImpl,
  saveSyncedEvents as saveSyncedEventsImpl,
  saveSyncedEventsForUser as saveSyncedEventsForUserImpl,
  saveTokens as saveTokensImpl,
  saveTokensForUserInternal as saveTokensForUserInternalImpl,
} from "./_google_calendar/google_calendar_mutations";
import {
  getAllUsersWithTokens as getAllUsersWithTokensImpl,
  getRecentlySentReminders as getRecentlySentRemindersImpl,
  getTokensInternal as getTokensInternalImpl,
  getEventById as getEventByIdImpl,
  getEventByGoogleId as getEventByGoogleIdImpl,
  getEventByGoogleIdInternal as getEventByGoogleIdInternalImpl,
} from "./_google_calendar/google_calendar_queries";

export const createEvent = createEventImpl;
export const deleteEvent = deleteEventImpl;
export const exchangeCode = exchangeCodeImpl;
export const getAuthorizationHeader = getAuthorizationHeaderImpl;
export const getAuthUrl = getAuthUrlImpl;
export const getCalendars = getCalendarsImpl;
export const listEvents = listEventsImpl;
export const performCronSync = performCronSyncImpl;
export const syncEventsAction = syncEventsActionImpl;
export const updateEvent = updateEventImpl;

export const deleteLocalEvent = deleteLocalEventImpl;
export const saveSyncedEvents = saveSyncedEventsImpl;
export const saveSyncedEventsForUser = saveSyncedEventsForUserImpl;
export const saveTokens = saveTokensImpl;
export const saveTokensForUserInternal = saveTokensForUserInternalImpl;

export const getAllUsersWithTokens = getAllUsersWithTokensImpl;
export const getRecentlySentReminders = getRecentlySentRemindersImpl;
export const getTokensInternal = getTokensInternalImpl;
export const getEventById = getEventByIdImpl;
export const getEventByGoogleId = getEventByGoogleIdImpl;
export const getEventByGoogleIdInternal = getEventByGoogleIdInternalImpl;

/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as _google_calendar_google_calendar_actions from "../_google_calendar/google_calendar_actions.js";
import type * as _google_calendar_google_calendar_helpers from "../_google_calendar/google_calendar_helpers.js";
import type * as _google_calendar_google_calendar_mutations from "../_google_calendar/google_calendar_mutations.js";
import type * as _google_calendar_google_calendar_queries from "../_google_calendar/google_calendar_queries.js";
import type * as _google_calendar_index from "../_google_calendar/index.js";
import type * as chat from "../chat.js";
import type * as chatActions from "../chatActions.js";
import type * as chatConfig from "../chatConfig.js";
import type * as chatInternal from "../chatInternal.js";
import type * as chatUtils from "../chatUtils.js";
import type * as crons from "../crons.js";
import type * as google_calendar from "../google_calendar.js";
import type * as http from "../http.js";
import type * as myFunctions from "../myFunctions.js";
import type * as notifications from "../notifications.js";
import type * as patients from "../patients.js";
import type * as templates from "../templates.js";
import type * as twilio from "../twilio.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "_google_calendar/google_calendar_actions": typeof _google_calendar_google_calendar_actions;
  "_google_calendar/google_calendar_helpers": typeof _google_calendar_google_calendar_helpers;
  "_google_calendar/google_calendar_mutations": typeof _google_calendar_google_calendar_mutations;
  "_google_calendar/google_calendar_queries": typeof _google_calendar_google_calendar_queries;
  "_google_calendar/index": typeof _google_calendar_index;
  chat: typeof chat;
  chatActions: typeof chatActions;
  chatConfig: typeof chatConfig;
  chatInternal: typeof chatInternal;
  chatUtils: typeof chatUtils;
  crons: typeof crons;
  google_calendar: typeof google_calendar;
  http: typeof http;
  myFunctions: typeof myFunctions;
  notifications: typeof notifications;
  patients: typeof patients;
  templates: typeof templates;
  twilio: typeof twilio;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};

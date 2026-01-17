/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as chat from "../chat.js";
import type * as chatActions from "../chatActions.js";
import type * as chatConfig from "../chatConfig.js";
import type * as chatInternal from "../chatInternal.js";
import type * as chatUtils from "../chatUtils.js";
import type * as http from "../http.js";
import type * as myFunctions from "../myFunctions.js";
import type * as twilio from "../twilio.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  chat: typeof chat;
  chatActions: typeof chatActions;
  chatConfig: typeof chatConfig;
  chatInternal: typeof chatInternal;
  chatUtils: typeof chatUtils;
  http: typeof http;
  myFunctions: typeof myFunctions;
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

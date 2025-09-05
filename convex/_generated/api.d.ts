/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as carbon from "../carbon.js";
import type * as community from "../community.js";
import type * as crops from "../crops.js";
import type * as farmers from "../farmers.js";
import type * as http from "../http.js";
import type * as reports from "../reports.js";
import type * as router from "../router.js";
import type * as sensors from "../sensors.js";
import type * as verification from "../verification.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  carbon: typeof carbon;
  community: typeof community;
  crops: typeof crops;
  farmers: typeof farmers;
  http: typeof http;
  reports: typeof reports;
  router: typeof router;
  sensors: typeof sensors;
  verification: typeof verification;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

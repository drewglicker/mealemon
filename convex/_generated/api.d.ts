/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as groceries from "../groceries.js";
import type * as ingredients from "../ingredients.js";
import type * as mealPlans from "../mealPlans.js";
import type * as recipes from "../recipes.js";
import type * as seed from "../seed.js";
import type * as substitutes from "../substitutes.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  groceries: typeof groceries;
  ingredients: typeof ingredients;
  mealPlans: typeof mealPlans;
  recipes: typeof recipes;
  seed: typeof seed;
  substitutes: typeof substitutes;
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

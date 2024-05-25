import {
  EVENT_TYPES,
  VALID_ANALYTICS_ENDPOINTS,
  intervals,
} from "@/lib/analytics/constants";
import z from "@/lib/zod";
import { COUNTRY_CODES } from "@dub/utils";
import { booleanQuerySchema } from "./misc";
import { parseDateSchema } from "./utils";

const analyticsEventParam = z
  .enum(EVENT_TYPES, {
    errorMap: (_issue, _ctx) => {
      return {
        message:
          "Invalid event type. Valid event types are: clicks, leads, sales",
      };
    },
  })
  .default("clicks")
  .describe(
    "The type of event to retrieve analytics for. Defaults to 'clicks'.",
  );

const analyticsTypeParam = z
  .enum(VALID_ANALYTICS_ENDPOINTS, {
    errorMap: (_issue, _ctx) => {
      return {
        message: `Invalid type value. Valid values are: ${VALID_ANALYTICS_ENDPOINTS.join(", ")}`,
      };
    },
  })
  .default("count")
  .describe(
    "The type of analytics to retrieve. Valid values include: count, timeseries, top_links, etc.",
  );

export const analyticsPathParamsSchema = z.object({
  eventType: analyticsEventParam.removeDefault().optional(),
  endpoint: analyticsTypeParam.removeDefault().optional(),
});

// Query schema for /api/analytics endpoint
export const analyticsQuerySchema = z.object({
  event: analyticsEventParam,
  type: analyticsTypeParam,
  domain: z.string().optional().describe("The domain to filter analytics for."),
  key: z.string().optional().describe("The short link slug."),
  linkId: z
    .string()
    .optional()
    .describe("The unique ID of the short link on Dub."),
  externalId: z
    .string()
    .optional()
    .describe(
      "This is the ID of the link in the your database. Must be prefixed with 'ext_' when passed as a query parameter.",
    ),
  interval: z
    .enum(intervals)
    .optional()
    .describe(
      "The interval to retrieve analytics for. Takes precedence over start and end. If undefined, defaults to 24h.",
    ),
  start: parseDateSchema
    .refine(
      (value: Date) => {
        const foundingDate = new Date("2022-09-22T00:00:00.000Z"); // Dub.co founding date
        return value >= foundingDate;
      },
      {
        message: "The start date cannot be earlier than September 22, 2022.",
      },
    )
    .optional()
    .describe("The start date and time when to retrieve analytics from."),
  end: parseDateSchema
    .refine(
      (value: Date) => {
        const todaysDate = new Date();
        return value <= todaysDate;
      },
      {
        message: "The end date cannot be in future.",
      },
    )
    .optional()
    .describe(
      "The end date and time when to retrieve analytics from. If not provided, defaults to the current date.",
    ),
  timezone: z
    .string()
    .optional()
    .describe(
      "The IANA time zone code for aligning timeseries granularity (e.g. America/New_York). Defaults to UTC.",
    )
    .openapi({ example: "America/New_York", default: "UTC" }),
  country: z
    .enum(COUNTRY_CODES)
    .optional()
    .describe("The country to retrieve analytics for.")
    .openapi({ ref: "countryCode" }),
  city: z.string().optional().describe("The city to retrieve analytics for."),
  device: z
    .string()
    .optional()
    .describe("The device to retrieve analytics for."),
  browser: z
    .string()
    .optional()
    .describe("The browser to retrieve analytics for."),
  os: z.string().optional().describe("The OS to retrieve analytics for."),
  referer: z
    .string()
    .optional()
    .describe("The referer to retrieve analytics for."),
  url: z.string().optional().describe("The URL to retrieve analytics for."),
  tagId: z
    .string()
    .optional()
    .describe("The tag ID to retrieve analytics for."),
  qr: booleanQuerySchema
    .optional()
    .describe(
      "Filter for QR code scans. If true, filter for QR codes only. If false, filter for links only. If undefined, return both.",
    ),
  root: booleanQuerySchema
    .optional()
    .describe(
      "Filter for root domains. If true, filter for domains only. If false, filter for links only. If undefined, return both.",
    ),
});

// Analytics filter params for Tinybird endpoints
export const analyticsFilterTB = z
  .object({
    eventType: analyticsEventParam,
    workspaceId: z
      .string()
      .optional()
      .transform((v) => {
        if (v && !v.startsWith("ws_")) {
          return `ws_${v}`;
        } else {
          return v;
        }
      }),
    root: z.boolean().optional(),
    qr: z.boolean().optional(),
    start: z.string(),
    end: z.string(),
    granularity: z.enum(["minute", "hour", "day", "month"]).optional(),
    timezone: z.string().optional(),
  })
  .merge(
    analyticsQuerySchema.pick({
      browser: true,
      city: true,
      country: true,
      device: true,
      domain: true,
      linkId: true,
      os: true,
      referer: true,
      tagId: true,
      url: true,
    }),
  );

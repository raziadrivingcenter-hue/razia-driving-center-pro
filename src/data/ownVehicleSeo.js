// =============================================================================
//  Own-Vehicle page — SEO + social preview meta
// =============================================================================
//  Single source of truth for the /learn-on-your-own-vehicle/ route's title,
//  description, canonical URL and Open Graph image.
//
//  Imported by BOTH:
//    - src/components/OwnVehicle/OwnVehiclePage.jsx  (runtime meta tags)
//    - scripts/build-own-vehicle-page.js             (static HTML at build time)
//  so the client-rendered tags and the pre-rendered HTML can never disagree.
//
//  The "From Rs. 5,600" figure is DERIVED from the pricing module — never
//  typed by hand — so the static description cannot drift from the calculator.
// =============================================================================
import {
  MIN_DAYS,
  MAX_DAYS,
  MIN_MINUTES,
  MAX_MINUTES,
  courseFee,
  formatRs,
} from "../lib/ownVehiclePricing.js";

const TITLE = "Learn On Your Own Vehicle | Razia Driving Center";

// Cheapest course the builder can produce: the minimum number of days at the
// minimum daily lesson length (7 days x 30 minutes).
const MINIMUM_COURSE_FEE = formatRs(courseFee(MIN_DAYS, MIN_MINUTES));

export const OWN_VEHICLE_META = {
  title: TITLE,
  description:
    `Learn on your own car with Madam Razia. Pick ${MIN_DAYS} to ${MAX_DAYS} ` +
    `days and ${MIN_MINUTES} to ${MAX_MINUTES} minute lessons, see the price ` +
    `live and book a slot. From ${MINIMUM_COURSE_FEE}.`,
  canonical: "https://raziadrivingcenter.com/learn-on-your-own-vehicle/",
  image: {
    url: "https://raziadrivingcenter.com/learnownvehicle-og-v1.png",
    type: "image/png",
    width: "1200",
    height: "630",
    alt: "Learn driving on your own vehicle with Razia Driving Center",
    card: "summary_large_image",
  },
};

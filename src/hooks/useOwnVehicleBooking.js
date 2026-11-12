import { useCallback, useMemo, useState } from "react";

import {
  clampDays,
  clampDistanceKm,
  clampMinutes,
  courseFee,
  perDayPrice,
  pickDropCharge,
  total,
  totalHours,
  validate,
} from "../lib/ownVehiclePricing";

// Default course shown on first load — a 10-day, 30-minute-a-day course.
const DEFAULT_DAYS = 10;
const DEFAULT_MINUTES = 30;
const DEFAULT_DISTANCE_KM = 0;

// Single source of booking state for the "Learn On Your Own Vehicle" page.
// Step 1 (course calculator) writes it; Steps 2 (slots) and 3 (booking
// details) read the same object. Every value is clamped/snapped by the
// pricing module so no invalid state can reach the UI or, later, the server.
export function useOwnVehicleBooking(initial = {}) {
  const [days, setDaysState] = useState(() =>
    clampDays(initial.days ?? DEFAULT_DAYS)
  );
  const [minutes, setMinutesState] = useState(() =>
    clampMinutes(initial.minutes ?? DEFAULT_MINUTES)
  );
  const [homeService, setHomeService] = useState(
    Boolean(initial.homeService)
  );
  const [distanceKm, setDistanceKmState] = useState(() =>
    clampDistanceKm(initial.distanceKm ?? DEFAULT_DISTANCE_KM)
  );
  // Pickup address — written in Card 1 (Build Your Course) and read by Card 3
  // when the booking is submitted.
  const [address, setAddressState] = useState(initial.address ?? "");

  const setDays = useCallback((value) => setDaysState(clampDays(value)), []);
  const setMinutes = useCallback(
    (value) => setMinutesState(clampMinutes(value)),
    []
  );
  const setDistanceKm = useCallback(
    (value) => setDistanceKmState(clampDistanceKm(value)),
    []
  );
  const setAddress = useCallback((value) => setAddressState(value), []);

  const pricing = useMemo(() => {
    const perDay = perDayPrice(minutes);
    const fee = courseFee(days, minutes);
    const pickDrop = homeService ? pickDropCharge(days, distanceKm) : 0;

    return {
      days,
      minutes,
      homeService,
      distanceKm,
      perDayPrice: perDay,
      courseFee: fee,
      pickDropCharge: pickDrop,
      total: total(days, minutes, distanceKm, homeService),
      totalHours: totalHours(days, minutes),
    };
  }, [days, minutes, homeService, distanceKm]);

  const errors = useMemo(
    () => validate({ days, minutes, distanceKm, homeService }),
    [days, minutes, distanceKm, homeService]
  );

  return {
    days,
    minutes,
    homeService,
    distanceKm,
    address,
    setDays,
    setMinutes,
    setHomeService,
    setDistanceKm,
    setAddress,
    pricing,
    errors,
  };
}

export default useOwnVehicleBooking;

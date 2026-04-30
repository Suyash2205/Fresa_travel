import { MatchMethod, Traveller } from "@prisma/client";

import { db } from "@/lib/db";

export function normalizeEmail(email?: string | null) {
  return email?.trim().toLowerCase() || null;
}

export function normalizePhone(phone?: string | null) {
  if (!phone) return null;
  return phone.replace(/\D/g, "").replace(/^91/, "");
}

export function pickFirstSeenTraveller<T extends { firstSeenAt: Date }>(a: T, b: T) {
  return a.firstSeenAt <= b.firstSeenAt ? a : b;
}

export async function matchTravellerForOrder(input: {
  email?: string | null;
  phone?: string | null;
}): Promise<{ traveller: Traveller; matchMethod: MatchMethod } | null> {
  const normalizedEmail = normalizeEmail(input.email);
  const normalizedPhone = normalizePhone(input.phone);

  if (!normalizedEmail && !normalizedPhone) {
    return null;
  }

  const [emailMatch, phoneMatch] = await Promise.all([
    normalizedEmail
      ? db.traveller.findFirst({
          where: { normalizedEmail },
          orderBy: { firstSeenAt: "asc" },
        })
      : null,
    normalizedPhone
      ? db.traveller.findFirst({
          where: { normalizedPhone },
          orderBy: { firstSeenAt: "asc" },
        })
      : null,
  ]);

  if (emailMatch && phoneMatch) {
    if (emailMatch.id === phoneMatch.id) {
      return { traveller: emailMatch, matchMethod: MatchMethod.BOTH };
    }
    const firstSeen = pickFirstSeenTraveller(emailMatch, phoneMatch);
    return firstSeen.id === emailMatch.id
      ? { traveller: emailMatch, matchMethod: MatchMethod.EMAIL }
      : { traveller: phoneMatch, matchMethod: MatchMethod.PHONE };
  }

  if (emailMatch) return { traveller: emailMatch, matchMethod: MatchMethod.EMAIL };
  if (phoneMatch) return { traveller: phoneMatch, matchMethod: MatchMethod.PHONE };
  return null;
}

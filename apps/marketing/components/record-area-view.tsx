"use client";

import { useEffect } from "react";
import { writeRecentView } from "@/lib/recently-viewed";

export function RecordAreaView({
  slug,
  district,
  city,
  outcode,
  realvianScore,
}: {
  slug: string;
  district: string;
  city: string;
  outcode: string;
  realvianScore: number;
}) {
  useEffect(() => {
    writeRecentView({ slug, district, city, outcode, realvianScore });
  }, [slug, district, city, outcode, realvianScore]);

  return null;
}

"use client";

import { useEffect, useState } from "react";

interface Me {
  sub: string;
  email: string;
  activeOrgId: string;
  permissions: string[];
}

export function useMe() {
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/me")
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: Me) => setMe(data))
      .catch(() => setMe(null))
      .finally(() => setLoading(false));
  }, []);

  return { me, loading };
}

import { Redirect } from "expo-router";
import React from "react";

import { useApp } from "@/context/AppContext";

export default function Index() {
  const { hasOnboarded } = useApp();

  if (!hasOnboarded) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)/" />;
}

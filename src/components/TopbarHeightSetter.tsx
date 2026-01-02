"use client";

import { useEffect } from "react";

export default function TopbarHeightSetter() {
  useEffect(() => {
    const update = () => {
      const nav = document.querySelector("[data-primary-nav]") as HTMLElement | null;
      const h = nav ? nav.getBoundingClientRect().height : 0;
      document.documentElement.style.setProperty("--topbar-h", `${Math.round(h)}px`);
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return null;
}


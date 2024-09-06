import { useEffect, useState } from "react";

export default function useDevice() {
  const [width, setWidth] = useState(window.innerWidth);

  useEffect(() => {
    window.addEventListener("resize", handleWindowResize);
    return () => window.removeEventListener("resize", handleWindowResize);
  }, []);

  function handleWindowResize() {
    setWidth(window.innerWidth);
  }

  return {
    isMobile: width < 750,
    isAnalyticsSmall: width < 500,
  };
}

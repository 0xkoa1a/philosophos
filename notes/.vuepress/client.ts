import { defineMermaidConfig } from "@vuepress/plugin-markdown-chart/client"
import { defineClientConfig } from "vuepress/client"

import "katex/dist/katex.min.css"

defineMermaidConfig({
  flowchart: {
    curve: "linear",
    htmlLabels: true,
    useMaxWidth: true,
  },
  themeVariables: (isDarkMode) =>
    isDarkMode
      ? {
          background: "#1b1b1f",
          fontFamily: "inherit",
          lineColor: "#a8a8ad",
          primaryBorderColor: "#68686d",
          primaryColor: "#252529",
          primaryTextColor: "#dfdfe4",
          secondaryBorderColor: "#68686d",
          secondaryColor: "#303035",
          secondaryTextColor: "#dfdfe4",
          tertiaryBorderColor: "#68686d",
          tertiaryColor: "#252529",
          tertiaryTextColor: "#dfdfe4",
        }
      : {
          background: "#ffffff",
          fontFamily: "inherit",
          lineColor: "#60646c",
          primaryBorderColor: "#c2c2c4",
          primaryColor: "#ffffff",
          primaryTextColor: "#2c2c30",
          secondaryBorderColor: "#c2c2c4",
          secondaryColor: "#f6f6f7",
          secondaryTextColor: "#2c2c30",
          tertiaryBorderColor: "#c2c2c4",
          tertiaryColor: "#ffffff",
          tertiaryTextColor: "#2c2c30",
        },
})

export default defineClientConfig({
  enhance({router}) {
    const scrollBehavior = router.options.scrollBehavior
    router.options.scrollBehavior = async (...args) => {
      const position = await scrollBehavior?.(...args)
      if (!args[2] && args[0].hash && position && "el" in position) {
        const target = document.getElementById(decodeURIComponent(args[0].hash.slice(1)))
        if (target) return {
          ...position,
          top: parseFloat(getComputedStyle(target).scrollMarginTop) || 0,
          behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
        }
      }
      return position
    }
  },
})

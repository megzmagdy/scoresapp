import type { HTMLAttributes } from "react"
import { useEffect, useState } from "react"
import type { MarqueeProps as FastMarqueeProps } from "react-fast-marquee"
import { cn } from "@/lib/utils"

export type MarqueeProps = HTMLAttributes<HTMLDivElement>

export const Marquee = ({ className, ...props }: MarqueeProps) => (
  <div className={cn("relative w-full overflow-hidden", className)} {...props} />
)

export type MarqueeContentProps = FastMarqueeProps

// react-fast-marquee ships CJS-only and breaks under SSR module loaders, and the
// scrolling content itself has no SEO value, so it's rendered client-only.
export const MarqueeContent = ({
  loop = 0,
  autoFill = true,
  pauseOnHover = true,
  children,
  ...props
}: MarqueeContentProps) => {
  const [FastMarquee, setFastMarquee] = useState<typeof import("react-fast-marquee").default | null>(null)

  useEffect(() => {
    import("react-fast-marquee").then((mod) => setFastMarquee(() => mod.default))
  }, [])

  if (!FastMarquee) return null

  return (
    <FastMarquee autoFill={autoFill} loop={loop} pauseOnHover={pauseOnHover} {...props}>
      {children}
    </FastMarquee>
  )
}

export type MarqueeFadeProps = HTMLAttributes<HTMLDivElement> & {
  side: "left" | "right"
}

export const MarqueeFade = ({ className, side, ...props }: MarqueeFadeProps) => (
  <div
    className={cn(
      "absolute top-0 bottom-0 z-10 h-full w-24 to-transparent",
      side === "left" ? "left-0 bg-gradient-to-r" : "right-0 bg-gradient-to-l",
      className,
    )}
    {...props}
  />
)

export type MarqueeItemProps = HTMLAttributes<HTMLDivElement>

export const MarqueeItem = ({ className, ...props }: MarqueeItemProps) => (
  <div className={cn("mx-2 flex-shrink-0", className)} {...props} />
)

import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Must start undefined (matching the server, which has no `window`) and only
  // resolve the real value once mounted - an initial-value lazy initializer
  // would read window.innerWidth during the client's first render too,
  // mismatching the server-rendered HTML and triggering a hydration error.
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional: resolves the SSR-unsafe `undefined` to a real value on mount
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}

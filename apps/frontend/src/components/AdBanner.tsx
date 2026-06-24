import { useEffect, useRef } from 'react'
import { ADSENSE_CLIENT, AD_SLOTS, type AdVariant } from '../config/ads'

interface AdBannerProps {
  variant: AdVariant
  className?: string
}

declare global {
  interface Window {
    adsbygoogle: unknown[]
  }
}

export default function AdBanner({ variant, className = '' }: AdBannerProps) {
  const ref = useRef<HTMLModElement>(null)
  const pushed = useRef(false)

  useEffect(() => {
    if (pushed.current) return
    try {
      window.adsbygoogle = window.adsbygoogle || []
      window.adsbygoogle.push({})
      pushed.current = true
    } catch {
      // AdSense não carregado (bloqueador de anúncios ou ambiente dev)
    }
  }, [])

  return (
    <div className={`flex flex-col items-center gap-1 ${className}`}>
      <span className="text-[10px] font-mono text-noir-600 uppercase tracking-widest">
        Publicidade
      </span>
      <ins
        ref={ref}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={AD_SLOTS[variant]}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  )
}

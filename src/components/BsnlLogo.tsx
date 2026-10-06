import React from 'react';
import { DEFAULT_LOGO_URL } from '../constants';

interface BsnlLogoProps {
  logoUrl?: string;
}

export function BsnlLogo({ logoUrl = DEFAULT_LOGO_URL }: BsnlLogoProps) {
  const [loadError, setLoadError] = React.useState(false);
  const effectiveUrl = logoUrl || DEFAULT_LOGO_URL;

  React.useEffect(() => {
    setLoadError(false);
  }, [logoUrl]);

  return (
    <div className="flex items-center gap-2.5">
      {!loadError ? (
        <img
          src={effectiveUrl}
          alt="BSNL Logo"
          className="h-8.5 max-w-[120px] object-contain"
          onError={() => setLoadError(true)}
        />
      ) : (
        <div className="w-8 h-8 rounded-full bg-[#003087] flex items-center justify-center text-white font-bold text-xs tracking-wider shadow-sm shrink-0">
          BSNL
        </div>
      )}
      <div>
        <div
          className="text-[#003087] font-extrabold text-xs sm:text-sm leading-tight tracking-wide"
          style={{ fontFamily: "'Work Sans', sans-serif" }}
        >
          BHARAT SANCHAR NIGAM LIMITED
        </div>
        <div
          className="text-[#5A6A82] text-[10px] sm:text-[11px] leading-tight font-medium"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          Vehicle Digital Logbook
        </div>
      </div>
    </div>
  );
}

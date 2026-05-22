import type { SVGProps } from "react";

interface MicrosoftIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
}

export function MicrosoftIcon({ size = 16, ...rest }: MicrosoftIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 21 21"
      aria-hidden="true"
      {...rest}
    >
      <rect x="1" y="1" width="9" height="9" fill="#F25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7FBA00" />
      <rect x="1" y="11" width="9" height="9" fill="#00A4EF" />
      <rect x="11" y="11" width="9" height="9" fill="#FFB900" />
    </svg>
  );
}

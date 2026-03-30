import type { SVGProps } from "react";

interface AcroshubLogoProps extends SVGProps<SVGSVGElement> {
  title?: string;
}

export function AcroshubLogo({ title = "Acroshub", className, ...props }: AcroshubLogoProps) {
  return (
    <svg
      viewBox="86 90 340 300"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label={title}
      focusable="false"
      className={className}
      {...props}
    >
      {title && <title>{title}</title>}

      {/* Portal interior */}
      <path
        d="M196 340 L196 270 Q196 206 256 206 Q316 206 316 270 L316 340"
        stroke="currentColor"
        strokeWidth="28"
        strokeLinecap="round"
        fill="none"
      />

      {/* Portal medio */}
      <path
        d="M148 340 L148 240 Q148 156 256 156 Q364 156 364 240 L364 340"
        stroke="currentColor"
        strokeWidth="28"
        strokeLinecap="round"
        fill="none"
      />

      {/* Portal exterior */}
      <path
        d="M100 340 L100 210 Q100 106 256 106 Q412 106 412 210 L412 340"
        stroke="currentColor"
        strokeWidth="28"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

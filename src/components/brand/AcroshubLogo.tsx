import type { SVGProps } from "react";

interface AcroshubLogoProps extends SVGProps<SVGSVGElement> {
  title?: string;
}

export function AcroshubLogo({ title = "Acroshub", ...props }: AcroshubLogoProps) {
  return (
    <svg
      viewBox="0 0 256 256"
      fill="none"
      role="img"
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <g
        stroke="currentColor"
        strokeWidth="16"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M128 28 165 92" />
        <path d="M91 92 128 28" />
        <path d="M58 86 90 142" />
        <path d="M198 86 166 142" />
        <path d="M74 170h108" />
        <path d="M60 170 88 218" />
        <path d="M196 170 168 218" />
        <path d="M95 74c-22-16-48-12-60 8-14 24 2 53 34 61 29 7 48-8 58-28" />
        <path d="M161 74c22-16 48-12 60 8 14 24-2 53-34 61-29 7-48-8-58-28" />
        <path d="M128 120c-20 0-36 14-36 34v31c0 19 15 35 34 35s34-16 34-35v-54" />
      </g>
    </svg>
  );
}

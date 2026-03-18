import { BookOpen } from "lucide-react";
import type { SVGProps } from "react";

interface AcroshubLogoProps extends SVGProps<SVGSVGElement> {
  title?: string;
}

export function AcroshubLogo({ title = "Acroshub", ...props }: AcroshubLogoProps) {
  return <BookOpen role="img" aria-label={title} focusable="false" {...props} />;
}

import logoFull from "../assets/images/logo-hnz-web.png";

interface LogoProps {
  /** Height in pixels for horizontal/emblem layouts; ignored for full vertical lockup height control via className */
  size?: number;
  layout?: "horizontal" | "vertical" | "emblem" | "full";
  theme?: "default" | "light-text";
  className?: string;
}

export function Logo({ size = 44, layout = "horizontal", className = "" }: LogoProps) {
  if (layout === "vertical" || layout === "full") {
    return (
      <img
        src={logoFull}
        alt="Haru No Kaze — 春の風"
        className={`w-auto object-contain ${className}`}
        style={{ height: size > 80 ? size : 120 }}
        decoding="async"
      />
    );
  }

  // Navbar / compact: full official lockup, height-driven
  if (layout === "horizontal") {
    return (
      <img
        src={logoFull}
        alt="Haru No Kaze"
        className={`w-auto object-contain shrink-0 ${className}`}
        style={{ height: size }}
        decoding="async"
      />
    );
  }

  // Emblem-ish compact mark (still official asset, taller crop via height)
  return (
    <img
      src={logoFull}
      alt="Haru No Kaze"
      className={`w-auto object-contain object-top shrink-0 ${className}`}
      style={{ height: size, width: size }}
      decoding="async"
    />
  );
}

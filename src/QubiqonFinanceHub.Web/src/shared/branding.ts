import qLogo from "../assets/q_logo.png";
import qubiqonLogo from "../assets/qubiqon.png";
import akumenFavicon from "../assets/akumen_fav.png";
import akumenLogo from "../assets/akumen-logo.png";

const isAkumen = import.meta.env.MODE === "akumen";

export const branding = {
  isAkumen,
  appTitle: isAkumen ? "Akumen Finance" : "Qubiqon Finance Hub",
  loginLogo: isAkumen ? akumenLogo : qubiqonLogo,
  loginLogoAlt: isAkumen ? "Akumen" : "Qubiqon",
  favicon: isAkumen ? akumenFavicon : qLogo,
  headerFallbackIcon: isAkumen ? akumenFavicon : null,
  orgNameFallback: isAkumen ? "Akumen" : "Qubiqon",
  subNameFallback: "Finance Hub",
  copyright: isAkumen
    ? "© 2026 Akumen Finance. All rights reserved."
    : "© 2026 Qubiqon Finance. All rights reserved.",
};

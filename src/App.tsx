import { useEffect, useState } from "react";
import { Navbar } from "./components/Navbar";
import { Footer } from "./components/Footer";
import { SakuraField } from "./components/SakuraField";
import { WhatsAppFab } from "./components/WhatsAppFab";
import { Logo } from "./components/Logo";
import { ScrollProgress } from "./components/ScrollProgress";
import { TrustBadges } from "./components/TrustBadges";
import { MobileCtaBar } from "./components/MobileCtaBar";
import { Hero } from "./sections/Hero";
import { Ecosystem } from "./sections/Ecosystem";
import { Journey } from "./sections/Journey";
import { SoloKfi } from "./sections/SoloKfi";
import { Programs } from "./sections/Programs";
import { Mapping } from "./sections/Mapping";
import { WhyUs } from "./sections/WhyUs";
import { Partners } from "./sections/Partners";
import { Alumni } from "./sections/Alumni";
import { Faq } from "./sections/Faq";
import { Location } from "./sections/Location";
import { CtaSection } from "./sections/CtaSection";

export default function App() {
  const [showLoading, setShowLoading] = useState(true);
  const [fade, setFade] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFade(true), 900);
    const removeTimer = setTimeout(() => setShowLoading(false), 1300);
    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-brand-bg text-brand-navy font-sans overflow-x-hidden selection:bg-brand-red/20 pb-20 lg:pb-0">
      {showLoading && (
        <div
          className={`fixed inset-0 z-[100] bg-white flex flex-col items-center justify-center transition-all duration-500 ${
            fade ? "opacity-0 scale-105 pointer-events-none" : "opacity-100"
          }`}
        >
          <Logo layout="full" size={140} className="drop-shadow-sm" />
        </div>
      )}

      <ScrollProgress />

      <div className="relative">
        <SakuraField className="fixed inset-0 z-0" />

        <Navbar />

        <main className="relative z-10">
          <Hero />
          <TrustBadges />
          <Ecosystem />
          <Journey />
          <SoloKfi />
          <Programs />
          <Mapping />
          <WhyUs />
          <Partners />
          <Alumni />
          <Faq />
          <Location />
          <CtaSection />
        </main>

        <Footer />
        <WhatsAppFab />
        <MobileCtaBar />
      </div>
    </div>
  );
}

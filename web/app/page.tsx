import { Header } from "@/components/Header";
import { HoneycombBackgroundLoader } from "@/components/HoneycombBackgroundLoader";
import { Hero } from "@/sections/Hero";
import { AppShowcase } from "@/sections/AppShowcase";
import { Privacy } from "@/sections/Privacy";
import { HowItWorks } from "@/sections/HowItWorks";
import { Ubuntu } from "@/sections/Ubuntu";
import { Footer } from "@/sections/Footer";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "mukoko",
  url: "https://mukoko.com",
  description:
    "A digital twin social ecosystem for Africa. Six apps, one identity, your sovereignty.",
  founder: { "@type": "Organization", name: "Nyuchi Africa" },
  sameAs: ["https://github.com/nyuchitech"],
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HoneycombBackgroundLoader />
      <Header />
      <main id="main-content">
        <Hero />
        <AppShowcase />
        <Privacy />
        <HowItWorks />
        <Ubuntu />
      </main>
      <Footer />
    </>
  );
}

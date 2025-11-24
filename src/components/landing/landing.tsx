import { TestimonialsSection } from "./components/Testimonials";
import Footer from "../footer/Footer";
import { HeroSection } from "./components/Hero_Section";
import { FeaturesSection } from "./components/Features_Section";
import { CallAction } from "./components/Call_Action";
import { HowWordsSection } from "./components/How_Works_Section";
import { Header } from "./components/header";
import { Dashboard } from "./components/Dashboard";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-purple-100 text-gray-900 overflow-x-hidden">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <HowWordsSection />
      <TestimonialsSection />
      <Dashboard />
      <CallAction />
      <Footer isLanding />
    </div>
  );
}

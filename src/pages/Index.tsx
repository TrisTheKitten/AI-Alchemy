
import React from "react";
import Hero from "@/components/Hero";
import FeatureSection from "@/components/FeatureSection";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

const Index: React.FC = () => {
  return (
    <>
      <Header isLoggedIn={false} />
      <main className="pt-16">
        <Hero />
        <FeatureSection />
      </main>
      <Footer />
    </>
  );
};

export default Index;

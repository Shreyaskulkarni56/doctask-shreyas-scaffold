import React, { useState } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Dashboard from "./components/Dashboard";
import BlogPage from "./components/BlogPage";
import JourneyPage from "./components/JourneyPage";
import Footer from "./components/Footer";

export default function App() {
  const [activeTab, setActiveTab] = useState("hero"); // "hero" | "dashboard" | "blog" | "journey"

  return (
    <div style={{
      maxWidth: "1080px",
      margin: "0 auto",
      padding: "0 24px",
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between"
    }}>
      <div>
        {/* Navigation Bar Header */}
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Dynamic Main Page Content */}
        <main>
          {activeTab === "hero" && (
            <Hero
              onStartPipeline={() => setActiveTab("dashboard")}
              onExploreArchitecture={() => setActiveTab("blog")}
            />
          )}

          {activeTab === "dashboard" && <Dashboard />}

          {activeTab === "blog" && <BlogPage />}

          {activeTab === "journey" && <JourneyPage />}
        </main>
      </div>

      {/* Candidate Disclosure Footer */}
      <Footer />
    </div>
  );
}

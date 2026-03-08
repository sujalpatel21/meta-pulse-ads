import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import Overview from "./pages/Overview";
import DailyDigest from "./pages/DailyDigest";
import Funnel from "./pages/Funnel";
import Campaigns from "./pages/Campaigns";
import AdSets from "./pages/AdSets";
import Ads from "./pages/Ads";
import Alerts from "./pages/Alerts";
import Budget from "./pages/Budget";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import AIIntelligence from "./pages/AIIntelligence";
import ABTesting from "./pages/ABTesting";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/daily-digest" element={<DailyDigest />} />
            <Route path="/funnel" element={<Funnel />} />
            <Route path="/ai-intelligence" element={<AIIntelligence />} />
            <Route path="/campaigns" element={<Campaigns />} />
            <Route path="/adsets" element={<AdSets />} />
            <Route path="/ads" element={<Ads />} />
            <Route path="/ab-testing" element={<ABTesting />} />
            <Route path="/alerts" element={<Alerts />} />
            <Route path="/budget" element={<Budget />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

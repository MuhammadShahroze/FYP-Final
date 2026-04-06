import { useState } from "react";
import { Search, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { subjects, countries, degreeLevels } from "@/data/mockData";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();
  const [subject, setSubject] = useState("");
  const [country, setCountry] = useState("");
  const [degree, setDegree] = useState("");

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (subject && subject !== "All Subjects") params.set("subject", subject);
    if (country && country !== "All Countries") params.set("country", country);
    if (degree && degree !== "All Levels") params.set("degree", degree);
    navigate(`/programs?${params.toString()}`);
  };

  return (
    <section className="relative overflow-hidden bg-primary pt-20 pb-32">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 h-64 w-64 rounded-full bg-accent blur-3xl" />
        <div className="absolute bottom-10 right-20 h-96 w-96 rounded-full bg-primary-foreground blur-3xl" />
      </div>

      <div className="container relative z-10 mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="mx-auto max-w-4xl text-center"
        >
          <h1 className="font-display text-4xl font-bold leading-tight text-primary-foreground sm:text-5xl lg:text-6xl">
            Unlock Your Global{" "}
            <span className="text-accent">Education Future</span>
          </h1>
          <p className="mt-6 text-lg text-primary-foreground/80 sm:text-xl">
            Discover programs, scholarships, and opportunities at top universities worldwide.
            Your journey to international education starts here.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mx-auto mt-12 max-w-4xl"
        >
          <div className="rounded-2xl bg-card p-4 shadow-2xl sm:p-6">
            <div className="grid gap-4 sm:grid-cols-4">
              <div className="relative">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {subjects.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Country</label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {countries.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div className="relative">
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">Degree Level</label>
                <select
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  {degreeLevels.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  onClick={handleSearch}
                  className="h-11 w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold"
                  size="lg"
                >
                  <Search className="mr-2 h-4 w-4" />
                  Search
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-6 text-primary-foreground/70"
        >
          <span className="text-sm">Trusted by students from 120+ countries</span>
          <span className="hidden sm:inline">•</span>
          <span className="text-sm">500+ partner universities</span>
          <span className="hidden sm:inline">•</span>
          <span className="text-sm">1,000+ scholarships listed</span>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;

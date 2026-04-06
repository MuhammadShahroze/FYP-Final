import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, type CarouselApi } from "@/components/ui/carousel";
import { MapPin, Clock, GraduationCap } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";

type FeaturedItem = {
  id: string;
  name: string;
  institution: string;
  degreeLevel: string;
  country: string;
  duration: string;
  eligibility: string;
  kind: "program" | "scholarship";
  detailPath: string;
};

const shuffle = <T,>(items: T[]) => {
  const list = [...items];
  for (let i = list.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [list[i], list[j]] = [list[j], list[i]];
  }
  return list;
};

const FeaturedPrograms = () => {
  const [featured, setFeatured] = useState<FeaturedItem[]>([]);
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const [programResponse, scholarshipResponse] = await Promise.all([
          api.get("/programs"),
          api.get("/scholarships"),
        ]);

        const programs = (programResponse.data.data || []).map((p: any) => ({
          id: p._id || p.id,
          name: p.title || "Untitled Program",
          institution: p.university || p.owner?.name || p.ownerName || "—",
          degreeLevel: p.degreeLevel || p.courseType || "—",
          country: p.country || "—",
          duration: p.courseDuration || "—",
          eligibility: p.requirements || "—",
          kind: "program" as const,
          detailPath: `/programs/${p._id || p.id}`,
        }));

        const scholarships = (scholarshipResponse.data.data || []).map((s: any) => ({
          id: s._id || s.id,
          name: s.title || "Untitled Scholarship",
          institution: s.organization || s.owner?.name || s.ownerName || "—",
          degreeLevel: s.degreeLevel || "—",
          country: s.country || "—",
          duration: s.deadline ? `Deadline: ${new Date(s.deadline).toLocaleDateString()}` : "Rolling deadline",
          eligibility: s.eligibility || s.requirements || "—",
          kind: "scholarship" as const,
          detailPath: `/scholarships/${s._id || s.id}`,
        }));

        const mixed = shuffle([...programs, ...scholarships]);
        setFeatured(mixed);
      } catch (err) {
        console.error("Failed to load featured items", err);
      }
    };
    fetchFeatured();
  }, []);

  useEffect(() => {
    if (!carouselApi || featured.length <= 1) return;

    const timer = window.setInterval(() => {
      carouselApi.scrollNext();
    }, 3500);

    return () => window.clearInterval(timer);
  }, [carouselApi, featured.length]);

  return (
    <section className="bg-secondary py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
            Featured Programs & Scholarships
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Discover randomly highlighted opportunities from universities and organizations
          </p>
        </motion.div>

        <div className="mt-12 px-10">
          <Carousel
            setApi={setCarouselApi}
            opts={{ align: "start", loop: true }}
            className="w-full"
          >
            <CarouselContent>
              {featured.map((program, index) => (
                <CarouselItem key={program.id} className="basis-full sm:basis-1/2 lg:basis-1/3 xl:basis-1/4">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.05 }}
                    className="h-full"
                  >
                    <Card className="flex h-full flex-col overflow-hidden transition-shadow hover:shadow-lg">
                      <div className="bg-primary/5 p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-xl">
                            {program.kind === "program" ? "🎓" : "💰"}
                          </div>
                          <Badge variant="secondary" className="font-medium">
                            {program.kind === "program" ? "Program" : "Scholarship"}
                          </Badge>
                        </div>
                        <h3 className="mt-4 font-display text-lg font-semibold text-foreground">
                          {program.name}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground">{program.institution}</p>
                      </div>
                      <CardContent className="flex-1 pt-4">
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            {program.country}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {program.duration}
                          </div>
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4" />
                            {program.degreeLevel}
                          </div>
                        </div>
                      </CardContent>
                      <CardFooter>
                        <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90 font-semibold" asChild>
                          <Link to={program.detailPath}>View Details</Link>
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-4" />
            <CarouselNext className="-right-4" />
          </Carousel>
        </div>

        <div className="mt-10 text-center">
          <Button asChild size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
            <Link to="/programs">Browse All Programs →</Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedPrograms;

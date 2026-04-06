import { GraduationCap, Search, FileCheck } from "lucide-react";
import { motion } from "framer-motion";

const steps = [
  {
    icon: GraduationCap,
    title: "Create Your Profile",
    description: "Tell us about your academic background, preferences, and goals.",
  },
  {
    icon: Search,
    title: "Get Matched",
    description: "Our smart algorithm finds programs and scholarships that fit your profile.",
  },
  {
    icon: FileCheck,
    title: "Apply with Confidence",
    description: "Use our tools and guides to submit polished, complete applications.",
  },
];

const HowItWorks = () => {
  return (
    <section className="bg-background py-20">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <h2 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
            How It Works
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Three simple steps to your international education journey
          </p>
        </motion.div>

        <div className="mt-16 grid gap-8 sm:grid-cols-3">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.15 }}
              className="relative text-center"
            >
              {index < steps.length - 1 && (
                <div className="absolute right-0 top-12 hidden h-0.5 w-full translate-x-1/2 bg-border sm:block" />
              )}
              <div className="relative mx-auto flex h-24 w-24 items-center justify-center rounded-2xl bg-primary/10">
                <step.icon className="h-10 w-10 text-primary" />
                <span className="absolute -right-2 -top-2 flex h-8 w-8 items-center justify-center rounded-full bg-accent font-display text-sm font-bold text-accent-foreground">
                  {index + 1}
                </span>
              </div>
              <h3 className="mt-6 font-display text-xl font-semibold text-foreground">
                {step.title}
              </h3>
              <p className="mt-3 text-muted-foreground">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;

import Navbar from "@/components/landing/Navbar";
import Footer from "@/components/landing/Footer";

const CompanyInfo = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 pt-24 pb-16 space-y-10">
        <section id="about" className="scroll-mt-24 space-y-3">
          <h1 className="font-display text-3xl font-bold">About Us</h1>
          <p className="text-muted-foreground leading-relaxed">
            EduDuctor helps students discover programs and scholarships, compare options, and apply with confidence.
            We connect students with universities and scholarship organizations through a simple, transparent platform.
          </p>
        </section>

        <section id="contact" className="scroll-mt-24 space-y-3">
          <h2 className="font-display text-2xl font-bold">Contact Us</h2>
          <p className="text-muted-foreground">Email: support@eduductor.com</p>
          <p className="text-muted-foreground">Phone: +1 (000) 000-0000</p>
          <p className="text-muted-foreground">Address: 123 Global Education Street</p>
        </section>

        <section id="privacy" className="scroll-mt-24 space-y-3">
          <h2 className="font-display text-2xl font-bold">Privacy Policy</h2>
          <p className="text-muted-foreground leading-relaxed">
            We collect only the information required to provide admissions and scholarship services. Your data is used
            to personalize recommendations, process applications, and improve platform performance. We do not sell
            personal data to third parties.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            By using this platform, you consent to secure data processing for profile management, application delivery,
            and communication with institutions you apply to.
          </p>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default CompanyInfo;

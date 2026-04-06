import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";

const Footer = () => {
  return (
    <footer className="border-t bg-card py-12">
      <div className="container mx-auto px-4">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <GraduationCap className="h-7 w-7 text-primary" />
              <span className="font-display text-xl font-bold text-foreground">EduDuctor</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              Connecting ambitious students with world-class education opportunities worldwide.
            </p>
          </div>
          <div>
            <h4 className="font-display font-semibold text-foreground">Explore</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/programs" className="hover:text-primary transition-colors">Programs</Link></li>
              <li><Link to="/programs?tab=scholarships" className="hover:text-primary transition-colors">Scholarships</Link></li>
              {/* <li><Link to="/" className="hover:text-primary transition-colors">Universities</Link></li> */}
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold text-foreground">Resources</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/dashboard/visa-hub?tab=guides" className="hover:text-primary transition-colors">Visa Guides</Link></li>
              <li><Link to="/dashboard/visa-hub?tab=templates" className="hover:text-primary transition-colors">Docs Guides</Link></li>
              {/* <li><Link to="/" className="hover:text-primary transition-colors">Blog</Link></li> */}
            </ul>
          </div>
          <div>
            <h4 className="font-display font-semibold text-foreground">Company</h4>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li><Link to="/company#about" className="hover:text-primary transition-colors">About Us</Link></li>
              <li><Link to="/company#contact" className="hover:text-primary transition-colors">Contact</Link></li>
              <li><Link to="/company#privacy" className="hover:text-primary transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t pt-6 text-center text-sm text-muted-foreground">
          © 2026 EduDuctor. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;

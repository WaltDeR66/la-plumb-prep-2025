import { Building2, Twitter, Linkedin, Facebook } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  const courseLinks = [
    { name: "Journeyman Plumber", href: "/courses" },
    { name: "Backflow Prevention", href: "/courses" },
    { name: "Natural Gas", href: "/courses" },
    { name: "Medical Gas", href: "/courses" },
    { name: "Master Plumber", href: "/courses" },
  ];

  const supportLinks = [
    { name: "Help Center", href: "#" },
    { name: "Contact Us", href: "mailto:support@laplumbprep.com" },
    { name: "Louisiana State Board", href: "#" },
    { name: "Technical Support", href: "#" },
    { name: "System Status", href: "#" },
  ];

  const legalLinks = [
    { name: "Privacy Policy", href: "#" },
    { name: "Terms of Service", href: "#" },
    { name: "Accessibility", href: "#" },
  ];

  return (
    <footer className="bg-foreground text-background py-16" data-testid="footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <div className="flex items-center space-x-2 mb-4" data-testid="footer-logo">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-bold" data-testid="footer-brand-name">LA Plumb Prep</h3>
                <p className="text-sm text-background/70" data-testid="footer-brand-tagline">Official State Prep Course</p>
              </div>
            </div>
            <p className="text-background/70 mb-6 max-w-md" data-testid="footer-description">
              Empowering Louisiana plumbers with comprehensive certification preparation, professional tools, and career advancement opportunities.
            </p>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-background/70">Follow us:</span>
              <a href="#" className="text-background/70 hover:text-background transition-colors" data-testid="social-link-twitter">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-background/70 hover:text-background transition-colors" data-testid="social-link-facebook">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="#" className="text-background/70 hover:text-background transition-colors" data-testid="social-link-linkedin">
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4" data-testid="footer-courses-title">Courses</h4>
            <ul className="space-y-2 text-background/70">
              {courseLinks.map((link, index) => (
                <li key={index}>
                  <Link href={link.href} className="hover:text-background transition-colors" data-testid={`footer-course-link-${index}`}>
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4" data-testid="footer-support-title">Support</h4>
            <ul className="space-y-2 text-background/70">
              {supportLinks.map((link, index) => (
                <li key={index}>
                  <a href={link.href} className="hover:text-background transition-colors" data-testid={`footer-support-link-${index}`}>
                    {link.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>
        
        <div className="border-t border-background/20 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-background/70 text-sm" data-testid="footer-copyright">
              © 2024 LA Plumb Prep. All rights reserved.
            </p>
            <div className="flex items-center space-x-6 mt-4 md:mt-0">
              {legalLinks.map((link, index) => (
                <a 
                  key={index}
                  href={link.href} 
                  className="text-background/70 hover:text-background text-sm transition-colors"
                  data-testid={`footer-legal-link-${index}`}
                >
                  {link.name}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}

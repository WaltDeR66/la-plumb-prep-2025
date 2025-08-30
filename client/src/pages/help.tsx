import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Link } from "wouter";
import { ArrowLeft, Search, MessageCircle, BookOpen, Users, Mail, FileText, CreditCard } from "lucide-react";
import { useState } from "react";

export default function Help() {
  const [searchQuery, setSearchQuery] = useState("");

  const helpCategories = [
    {
      icon: BookOpen,
      title: "Getting Started",
      description: "Learn the basics of LA Plumb Prep",
      articles: [
        "How to create your account",
        "Choosing the right certification track",
        "Navigating your dashboard",
        "Understanding course structure",
        "Setting up your study schedule"
      ]
    },
    {
      icon: CreditCard,
      title: "Billing & Subscriptions",
      description: "Manage your subscription and payments",
      articles: [
        "Subscription plans and pricing",
        "How to cancel your subscription",
        "Pro-rated billing explained",
        "Payment methods and security",
        "Refund policy"
      ]
    },
    {
      icon: Users,
      title: "Job Board",
      description: "Find jobs and manage applications",
      articles: [
        "How to search for jobs",
        "Creating an effective profile",
        "Applying for positions",
        "Employer portal guide",
        "Application tracking"
      ]
    },
    {
      icon: MessageCircle,
      title: "AI Tools & Features",
      description: "Get help with our professional tools",
      articles: [
        "Using the AI mentor",
        "Photo code analysis tool",
        "Plan review features",
        "Calculator tools guide",
        "Pipe sizing recommendations"
      ]
    }
  ];

  const popularQuestions = [
    {
      question: "How do I cancel my subscription?",
      answer: "You can cancel anytime from your account settings. You'll only be charged for the days you actually used the service."
    },
    {
      question: "Are the courses Louisiana state approved?",
      answer: "Currently, only our Journeyman Plumber certification prep is active. Other tracks are coming soon and will meet all state requirements."
    },
    {
      question: "How does the AI mentor work?",
      answer: "Our AI mentor uses advanced technology to answer your plumbing questions, review photos for code compliance, and provide personalized guidance."
    },
    {
      question: "Can I access courses on mobile?",
      answer: "Yes! Our platform is fully responsive and works on all devices including phones, tablets, and computers."
    },
    {
      question: "What if I need additional help?",
      answer: "Contact our support team at support@laplumbprep.com. We typically respond within 2 business days."
    }
  ];

  const filteredQuestions = popularQuestions.filter(
    q => q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
         q.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background py-12" data-testid="help-page">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link href="/">
            <Button variant="ghost" className="mb-4" data-testid="back-button">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-foreground mb-4" data-testid="help-title">
            Help Center
          </h1>
          <p className="text-muted-foreground text-lg mb-8" data-testid="help-subtitle">
            Get answers to your questions and learn how to make the most of LA Plumb Prep
          </p>

          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search help articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="help-search"
            />
          </div>
        </div>

        {/* Popular Questions */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Popular Questions</h2>
          <div className="space-y-4">
            {filteredQuestions.map((item, index) => (
              <Card key={index}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">{item.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{item.answer}</p>
                </CardContent>
              </Card>
            ))}
            {filteredQuestions.length === 0 && searchQuery && (
              <p className="text-muted-foreground text-center py-8">
                No results found for "{searchQuery}". Try a different search term.
              </p>
            )}
          </div>
        </div>

        {/* Help Categories */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6">Browse by Category</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {helpCategories.map((category, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <category.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">{category.title}</CardTitle>
                      <p className="text-muted-foreground text-sm">{category.description}</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {category.articles.map((article, articleIndex) => (
                      <li key={articleIndex}>
                        <button className="text-primary hover:underline text-left">
                          {article}
                        </button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Contact Support */}
        <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-primary" />
            </div>
            <CardTitle className="text-2xl">Still Need Help?</CardTitle>
            <p className="text-muted-foreground">
              Can't find what you're looking for? Our support team is here to help.
            </p>
          </CardHeader>
          <CardContent className="text-center">
            <div className="space-y-4">
              <div>
                <p className="font-medium text-foreground mb-2">Email Support</p>
                <p className="text-muted-foreground mb-4">
                  Get detailed help from our support team. We typically respond within 2 business days.
                </p>
                <a href="mailto:support@laplumbprep.com">
                  <Button size="lg" data-testid="contact-support-button">
                    <Mail className="w-4 h-4 mr-2" />
                    Contact Support
                  </Button>
                </a>
              </div>
              
              <div className="border-t pt-4">
                <p className="text-sm text-muted-foreground">
                  <strong>Response Time:</strong> 2 business days<br />
                  <strong>Support Hours:</strong> Monday - Friday, 9 AM - 5 PM CST
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="text-center">
            <CardContent className="pt-6">
              <FileText className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Documentation</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Detailed guides and tutorials
              </p>
              <Link href="/courses">
                <Button variant="outline" size="sm">
                  View Courses
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <Users className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Job Board</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Find plumbing opportunities
              </p>
              <Link href="/jobs">
                <Button variant="outline" size="sm">
                  Browse Jobs
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardContent className="pt-6">
              <MessageCircle className="w-8 h-8 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">AI Tools</h3>
              <p className="text-muted-foreground text-sm mb-4">
                Professional plumbing tools
              </p>
              <Link href="/tools">
                <Button variant="outline" size="sm">
                  Try Tools
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, MapPin, Clock, DollarSign, Briefcase, Filter } from "lucide-react";
import JobCard from "@/components/job-card";

export default function Jobs() {
  const [searchTerm, setSearchTerm] = useState("");
  const [locationFilter, setLocationFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);

  const { data: jobsData, isLoading } = useQuery({
    queryKey: ["/api/jobs", { page, search: searchTerm, location: locationFilter, type: typeFilter }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(searchTerm && { search: searchTerm }),
        ...(locationFilter !== "all" && { location: locationFilter }),
        ...(typeFilter !== "all" && { type: typeFilter }),
      });
      const response = await fetch(`/api/jobs?${params}`);
      return response.json();
    },
  });

  const locations = [
    { value: "all", label: "All Locations" },
    { value: "baton-rouge", label: "Baton Rouge" },
    { value: "new-orleans", label: "New Orleans" },
    { value: "lafayette", label: "Lafayette" },
    { value: "shreveport", label: "Shreveport" },
    { value: "lake-charles", label: "Lake Charles" },
  ];

  const jobTypes = [
    { value: "all", label: "All Types" },
    { value: "full_time", label: "Full-time" },
    { value: "part_time", label: "Part-time" },
    { value: "contract", label: "Contract" },
    { value: "temporary", label: "Temporary" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="gradient-hero text-white py-16" data-testid="jobs-hero">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl lg:text-5xl font-bold mb-6" data-testid="jobs-title">
              Louisiana Plumbing Jobs
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8" data-testid="jobs-description">
              Connect with top employers across Louisiana. Find your next opportunity in residential, commercial, 
              or specialized plumbing work.
            </p>
            <div className="flex items-center justify-center space-x-8 text-blue-100">
              <div className="flex items-center space-x-2">
                <Briefcase className="w-5 h-5" />
                <span>47 Active Jobs</span>
              </div>
              <div className="flex items-center space-x-2">
                <MapPin className="w-5 h-5" />
                <span>Statewide Opportunities</span>
              </div>
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5" />
                <span>Competitive Salaries</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filter Section */}
      <section className="py-8 bg-white border-b" data-testid="jobs-filters">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-4 items-center">
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search jobs, companies, or keywords..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="search-jobs"
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger className="w-48" data-testid="filter-location">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  {locations.map((location) => (
                    <SelectItem key={location.value} value={location.value}>
                      {location.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-36" data-testid="filter-type">
                  <SelectValue placeholder="Job Type" />
                </SelectTrigger>
                <SelectContent>
                  {jobTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button variant="outline" size="icon" data-testid="advanced-filters">
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Job Listings */}
      <section className="py-16" data-testid="jobs-listings">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Main Content */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground" data-testid="results-count">
                    {jobsData?.total || 0} Jobs Found
                  </h2>
                  <p className="text-muted-foreground">
                    Showing page {page} of {Math.ceil((jobsData?.total || 0) / 10)}
                  </p>
                </div>
                
                <Select defaultValue="newest">
                  <SelectTrigger className="w-48" data-testid="sort-jobs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="salary-high">Highest Salary</SelectItem>
                    <SelectItem value="salary-low">Lowest Salary</SelectItem>
                    <SelectItem value="relevance">Most Relevant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isLoading ? (
                <div className="space-y-6">
                  {[...Array(5)].map((_, i) => (
                    <Card key={i} className="p-6">
                      <div className="animate-pulse space-y-4">
                        <div className="flex items-start space-x-4">
                          <div className="w-12 h-12 bg-muted rounded-lg"></div>
                          <div className="flex-1 space-y-2">
                            <div className="h-6 bg-muted rounded w-1/3"></div>
                            <div className="h-4 bg-muted rounded w-1/4"></div>
                            <div className="h-4 bg-muted rounded w-1/2"></div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : jobsData?.jobs?.length > 0 ? (
                <div className="space-y-6">
                  {jobsData.jobs.map((job: any) => (
                    <JobCard key={job.id} job={job} data-testid={`job-card-${job.id}`} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-16" data-testid="no-jobs">
                  <Briefcase className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">No jobs found</h3>
                  <p className="text-muted-foreground">Try adjusting your search criteria or check back later for new opportunities.</p>
                </div>
              )}

              {/* Pagination */}
              {jobsData?.total > 10 && (
                <div className="flex items-center justify-center space-x-2 mt-8" data-testid="pagination">
                  <Button
                    variant="outline"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    data-testid="prev-page"
                  >
                    Previous
                  </Button>
                  <span className="px-4 py-2">
                    Page {page} of {Math.ceil(jobsData.total / 10)}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(page + 1)}
                    disabled={page >= Math.ceil(jobsData.total / 10)}
                    data-testid="next-page"
                  >
                    Next
                  </Button>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:w-80">
              <div className="space-y-6">
                {/* Featured Employers */}
                <Card data-testid="featured-employers">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Featured Employers</h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                          <span className="text-primary-foreground font-bold text-sm">RC</span>
                        </div>
                        <div>
                          <p className="font-medium">Reliable Contracting</p>
                          <p className="text-sm text-muted-foreground">3 open positions</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                          <span className="text-accent-foreground font-bold text-sm">GS</span>
                        </div>
                        <div>
                          <p className="font-medium">Gulf South Plumbing</p>
                          <p className="text-sm text-muted-foreground">2 open positions</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Job Alerts */}
                <Card data-testid="job-alerts">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Job Alerts</h3>
                    <p className="text-muted-foreground text-sm mb-4">
                      Get notified when new jobs matching your criteria are posted.
                    </p>
                    <Button className="w-full" data-testid="create-alert">
                      Create Job Alert
                    </Button>
                  </CardContent>
                </Card>

                {/* Salary Guide */}
                <Card data-testid="salary-guide">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Salary Guide</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm">Apprentice</span>
                        <span className="text-sm font-medium">$16-22/hr</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Journeyman</span>
                        <span className="text-sm font-medium">$25-35/hr</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Master Plumber</span>
                        <span className="text-sm font-medium">$40-60/hr</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

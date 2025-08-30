import { useState, useEffect } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Plus, Trash2, Calculator, Users, DollarSign, Percent } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const studentSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().optional(),
});

const bulkEnrollmentSchema = z.object({
  employerId: z.string().min(1, "Employer ID is required"),
  contactEmail: z.string().email("Please enter a valid email address"),
  contactPhone: z.string().optional(),
  notes: z.string().optional(),
  requestedStartDate: z.string().optional(),
  students: z.array(studentSchema).min(5, "Minimum 5 students required for bulk enrollment"),
});

type BulkEnrollmentForm = z.infer<typeof bulkEnrollmentSchema>;

interface BulkPricingTier {
  id: string;
  tierName: string;
  minStudents: number;
  maxStudents: number | null;
  discountPercent: string;
  basePrice: string;
}

interface PricingCalculation {
  studentCount: number;
  basePricePerStudent: number;
  totalBasePrice: number;
  appliedTier: BulkPricingTier | null;
  discountPercent: number;
  discountAmount: number;
  finalPrice: number;
  pricePerStudent: number;
}

export default function BulkEnrollment() {
  const { toast } = useToast();
  const [pricingTiers, setPricingTiers] = useState<BulkPricingTier[]>([]);
  const [pricingCalculation, setPricingCalculation] = useState<PricingCalculation | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<BulkEnrollmentForm>({
    resolver: zodResolver(bulkEnrollmentSchema),
    defaultValues: {
      employerId: "",
      contactEmail: "",
      contactPhone: "",
      notes: "",
      requestedStartDate: "",
      students: [
        { email: "", firstName: "", lastName: "" },
        { email: "", firstName: "", lastName: "" },
        { email: "", firstName: "", lastName: "" },
        { email: "", firstName: "", lastName: "" },
        { email: "", firstName: "", lastName: "" },
      ],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "students",
  });

  // Load pricing tiers on component mount
  useEffect(() => {
    const fetchPricingTiers = async () => {
      try {
        const response = await apiRequest("GET", "/api/bulk-pricing/tiers");
        const data = await response.json();
        setPricingTiers(data.tiers);
      } catch (error) {
        console.error("Error fetching pricing tiers:", error);
      }
    };

    fetchPricingTiers();
  }, []);

  // Calculate pricing when student count changes
  useEffect(() => {
    const subscription = form.watch((value) => {
      const studentCount = value.students?.filter(s => s.email && s.firstName).length || 0;
      if (studentCount >= 5) {
        calculatePricing(studentCount);
      } else {
        setPricingCalculation(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [form.watch]);

  const calculatePricing = async (studentCount: number) => {
    setIsCalculating(true);
    try {
      const response = await apiRequest("POST", "/api/bulk-pricing/calculate", {
        studentCount,
        courseIds: ["journeyman"]
      });
      const data = await response.json();
      setPricingCalculation(data.pricing);
    } catch (error) {
      console.error("Error calculating pricing:", error);
    } finally {
      setIsCalculating(false);
    }
  };

  const onSubmit = async (data: BulkEnrollmentForm) => {
    setIsSubmitting(true);
    try {
      const validStudents = data.students.filter(s => s.email && s.firstName);
      
      const response = await apiRequest("POST", "/api/bulk-enrollment/request", {
        ...data,
        studentEmails: validStudents,
        courseIds: ["journeyman"]
      });

      if (response.ok) {
        toast({
          title: "Request Submitted Successfully!",
          description: "We'll review your bulk enrollment request and get back to you within 24 hours.",
        });
        
        // Reset form
        form.reset();
        setPricingCalculation(null);
      } else {
        throw new Error("Failed to submit request");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit bulk enrollment request.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addStudent = () => {
    append({ email: "", firstName: "", lastName: "" });
  };

  const removeStudent = (index: number) => {
    if (fields.length > 5) {
      remove(index);
    }
  };

  const validStudentCount = form.watch("students")?.filter(s => s.email && s.firstName).length || 0;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-foreground" data-testid="page-title">
          Bulk Student Enrollment
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Enroll multiple apprentices or students at discounted rates. Perfect for construction companies, 
          plumbing contractors, and training programs.
        </p>
      </div>

      {/* Pricing Tiers Overview */}
      <div className="grid md:grid-cols-3 gap-4">
        {pricingTiers.map((tier) => (
          <Card key={tier.id} className="relative">
            <CardHeader className="text-center">
              <CardTitle className="text-lg">{tier.tierName}</CardTitle>
              <CardDescription>
                {tier.minStudents}
                {tier.maxStudents ? `-${tier.maxStudents}` : "+"} students
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-2">
              <div className="text-2xl font-bold text-green-600">
                {tier.discountPercent}% OFF
              </div>
              <div className="text-sm text-muted-foreground">
                ${(49 * (1 - parseFloat(tier.discountPercent) / 100)).toFixed(0)}/student
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pricing Calculator */}
      {pricingCalculation && (
        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="w-5 h-5" />
              Your Bulk Pricing Quote
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Students</span>
                </div>
                <div className="text-2xl font-bold">{pricingCalculation.studentCount}</div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 mb-2">
                  <Percent className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Discount</span>
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {pricingCalculation.discountPercent}%
                </div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 mb-2">
                  <DollarSign className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium">You Save</span>
                </div>
                <div className="text-2xl font-bold text-orange-600">
                  ${pricingCalculation.discountAmount.toFixed(0)}
                </div>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 mb-2">
                  <DollarSign className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">Total</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  ${pricingCalculation.finalPrice.toFixed(0)}
                </div>
              </div>
            </div>
            
            {pricingCalculation.appliedTier && (
              <div className="text-center">
                <Badge className="bg-green-100 text-green-800">
                  {pricingCalculation.appliedTier.tierName} - 
                  ${pricingCalculation.pricePerStudent.toFixed(0)} per student
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Enrollment Form */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Enrollment Request</CardTitle>
          <CardDescription>
            Complete the form below to request bulk enrollment for your students.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Company Information */}
              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="employerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Company/Employer ID</FormLabel>
                      <FormControl>
                        <Input placeholder="Your company ID" {...field} data-testid="input-employer-id" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="contactEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="company@example.com" {...field} data-testid="input-contact-email" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="contactPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Contact Phone (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="(555) 123-4567" {...field} data-testid="input-contact-phone" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="requestedStartDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Requested Start Date (Optional)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} data-testid="input-start-date" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Student List */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Student Information</h3>
                  <div className="text-sm text-muted-foreground">
                    {validStudentCount} valid students ({validStudentCount >= 5 ? "✓" : "⚠️"} Min: 5)
                  </div>
                </div>

                {fields.map((field, index) => (
                  <div key={field.id} className="grid md:grid-cols-4 gap-2 items-end">
                    <FormField
                      control={form.control}
                      name={`students.${index}.email`}
                      render={({ field }) => (
                        <FormItem>
                          {index === 0 && <FormLabel>Email</FormLabel>}
                          <FormControl>
                            <Input placeholder="student@email.com" {...field} data-testid={`input-student-email-${index}`} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`students.${index}.firstName`}
                      render={({ field }) => (
                        <FormItem>
                          {index === 0 && <FormLabel>First Name</FormLabel>}
                          <FormControl>
                            <Input placeholder="John" {...field} data-testid={`input-student-firstname-${index}`} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name={`students.${index}.lastName`}
                      render={({ field }) => (
                        <FormItem>
                          {index === 0 && <FormLabel>Last Name (Optional)</FormLabel>}
                          <FormControl>
                            <Input placeholder="Doe" {...field} data-testid={`input-student-lastname-${index}`} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div>
                      {fields.length > 5 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeStudent(index)}
                          data-testid={`button-remove-student-${index}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}

                <Button
                  type="button"
                  variant="outline"
                  onClick={addStudent}
                  className="w-full"
                  data-testid="button-add-student"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Another Student
                </Button>
              </div>

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Additional Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Any special requirements or notes about your enrollment request..."
                        rows={3}
                        {...field}
                        data-testid="textarea-notes"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Submit Button */}
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={isSubmitting || validStudentCount < 5}
                data-testid="button-submit-request"
              >
                {isSubmitting ? "Submitting Request..." : "Submit Bulk Enrollment Request"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="text-center space-y-2">
            <h3 className="font-semibold">Need Help?</h3>
            <p className="text-sm text-muted-foreground">
              Contact our team at <a href="mailto:bulk@laplumbprep.com" className="text-blue-600 hover:underline">bulk@laplumbprep.com</a> or 
              call <a href="tel:+15551234567" className="text-blue-600 hover:underline">(555) 123-4567</a> for assistance with bulk enrollments.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
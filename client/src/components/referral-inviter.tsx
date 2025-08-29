import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { Mail, Send, Users, Gift } from 'lucide-react';

export function ReferralInviter() {
  const [email, setEmail] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const sendInvitationMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await apiRequest('POST', '/api/referrals/send-invitation', { email });
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: 'Referral Sent!',
        description: `Invitation sent successfully to ${email}. Your referral code: ${data.referralCode}`,
      });
      setEmail('');
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to Send',
        description: error.message || 'Could not send referral invitation. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSendInvitation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({
        title: 'Email Required',
        description: 'Please enter an email address to send the invitation.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!email.includes('@')) {
      toast({
        title: 'Invalid Email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      });
      return;
    }

    sendInvitationMutation.mutate(email.trim());
  };

  if (!isOpen) {
    return (
      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
              <Gift className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Refer Friends & Earn</h3>
              <p className="text-sm text-muted-foreground">
                Help others advance their plumbing careers and earn rewards
              </p>
            </div>
            <Button onClick={() => setIsOpen(true)} data-testid="open-referral-inviter">
              <Users className="w-4 h-4 mr-2" />
              Invite Friends
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Mail className="w-5 h-5" />
          <span>Send Referral Invitation</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSendInvitation} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="referral-email">Email Address</Label>
            <Input
              id="referral-email"
              type="email"
              placeholder="friend@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-testid="referral-email-input"
            />
          </div>
          
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">What they'll receive:</h4>
            <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
              <li>• Professional invitation email with your referral code</li>
              <li>• Access to Louisiana Plumbing Code certification course</li>
              <li>• Professional tools and AI-powered assistance</li>
              <li>• Special benefits for being referred by you</li>
            </ul>
          </div>

          <div className="flex space-x-2">
            <Button
              type="submit"
              disabled={sendInvitationMutation.isPending}
              className="flex-1"
              data-testid="send-referral-button"
            >
              <Send className="w-4 h-4 mr-2" />
              {sendInvitationMutation.isPending ? 'Sending...' : 'Send Invitation'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                setEmail('');
              }}
              data-testid="cancel-referral-button"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function ContactSupport() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isOpen, setIsOpen] = useState(false);
  const { toast } = useToast();

  const contactSupportMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await apiRequest('POST', '/api/support/contact', data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Message Sent!',
        description: 'Your support request has been sent. We\'ll get back to you soon.',
      });
      setFormData({ name: '', email: '', subject: '', message: '' });
      setIsOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to Send',
        description: error.message || 'Could not send support request. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast({
        title: 'All Fields Required',
        description: 'Please fill in all fields before sending.',
        variant: 'destructive',
      });
      return;
    }

    contactSupportMutation.mutate(formData);
  };

  if (!isOpen) {
    return (
      <Card className="border-orange-200 dark:border-orange-800">
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/20 rounded-full flex items-center justify-center">
              <Mail className="w-6 h-6 text-orange-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">Need Help?</h3>
              <p className="text-sm text-muted-foreground">
                Contact our support team for assistance
              </p>
            </div>
            <Button variant="outline" onClick={() => setIsOpen(true)} data-testid="open-contact-support">
              <Mail className="w-4 h-4 mr-2" />
              Contact Support
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-orange-200 dark:border-orange-800">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Mail className="w-5 h-5" />
          <span>Contact Support</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="support-name">Name</Label>
              <Input
                id="support-name"
                placeholder="Your name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="support-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="support-email">Email</Label>
              <Input
                id="support-email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                data-testid="support-email-input"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="support-subject">Subject</Label>
            <Input
              id="support-subject"
              placeholder="What do you need help with?"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              data-testid="support-subject-input"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="support-message">Message</Label>
            <Textarea
              id="support-message"
              placeholder="Please describe your issue or question..."
              className="min-h-[120px]"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              data-testid="support-message-input"
            />
          </div>

          <div className="flex space-x-2">
            <Button
              type="submit"
              disabled={contactSupportMutation.isPending}
              className="flex-1"
              data-testid="send-support-button"
            >
              <Send className="w-4 h-4 mr-2" />
              {contactSupportMutation.isPending ? 'Sending...' : 'Send Message'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                setFormData({ name: '', email: '', subject: '', message: '' });
              }}
              data-testid="cancel-support-button"
            >
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
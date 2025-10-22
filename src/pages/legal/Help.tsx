import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, HelpCircle, MessageCircle, Phone, Mail } from "lucide-react";
import { Link } from "react-router-dom";

const Help = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Link to="/">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-foreground">Help Center</h1>
          <p className="text-muted-foreground mt-2">Find answers to your questions</p>
        </div>

        {/* Search */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search for help articles, FAQs, or topics..."
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Quick Help Categories */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <HelpCircle className="h-5 w-5 mr-2 text-primary" />
                Getting Started
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Learn how to create an account, make your first purchase, or set up your business profile.
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <MessageCircle className="h-5 w-5 mr-2 text-primary" />
                Account & Profile
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Manage your account settings, update profile information, and manage preferences.
              </p>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Phone className="h-5 w-5 mr-2 text-primary" />
                Orders & Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Track orders, manage payments, handle refunds, and understand our billing process.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Frequently Asked Questions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div>
                <h4 className="font-semibold mb-2">How do I create an account?</h4>
                <p className="text-muted-foreground">
                  Click the "Sign Up" button on our homepage, fill in your details, verify your email, 
                  and you're ready to start shopping or selling on Wyshkit.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">How do I track my order?</h4>
                <p className="text-muted-foreground">
                  Go to "My Orders" in your account dashboard, select the order you want to track, 
                  and you'll see real-time updates on your order status and delivery progress.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">What payment methods do you accept?</h4>
                <p className="text-muted-foreground">
                  We accept all major credit cards, debit cards, UPI, net banking, and digital wallets 
                  including Paytm, PhonePe, Google Pay, and more.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">How do I become a seller on Wyshkit?</h4>
                <p className="text-muted-foreground">
                  Visit our partner portal, complete the registration process, verify your business details, 
                  and start listing your products. Our team will guide you through the onboarding process.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">What is your return policy?</h4>
                <p className="text-muted-foreground">
                  We offer a 7-day return policy for most items. Products must be in original condition 
                  with tags and packaging intact. Some items like custom products may not be eligible for returns.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-2">How do I contact customer support?</h4>
                <p className="text-muted-foreground">
                  You can reach us via email at support@wyshkit.com, call us at +91-9876543210, 
                  or use the live chat feature on our website during business hours.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Support */}
        <Card>
          <CardHeader>
            <CardTitle>Still Need Help?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-6">
              Can't find what you're looking for? Our support team is here to help you with any questions or issues.
            </p>
            <div className="grid md:grid-cols-3 gap-4">
              <div className="text-center">
                <Mail className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h4 className="font-semibold mb-1">Email Support</h4>
                <p className="text-muted-foreground text-sm mb-3">
                  Get help via email within 24 hours
                </p>
                <Button variant="outline" size="sm">
                  Send Email
                </Button>
              </div>
              
              <div className="text-center">
                <Phone className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h4 className="font-semibold mb-1">Phone Support</h4>
                <p className="text-muted-foreground text-sm mb-3">
                  Call us for immediate assistance
                </p>
                <Button variant="outline" size="sm">
                  Call Now
                </Button>
              </div>
              
              <div className="text-center">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 text-primary" />
                <h4 className="font-semibold mb-1">Live Chat</h4>
                <p className="text-muted-foreground text-sm mb-3">
                  Chat with us in real-time
                </p>
                <Button variant="outline" size="sm">
                  Start Chat
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Help;

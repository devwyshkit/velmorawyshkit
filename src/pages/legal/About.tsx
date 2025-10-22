import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, Target, Award, Heart } from "lucide-react";
import { Link } from "react-router-dom";

const About = () => {
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
          <h1 className="text-4xl font-bold text-foreground">About Wyshkit</h1>
          <p className="text-muted-foreground mt-2">Connecting local businesses with customers</p>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Our Story</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Wyshkit was born from a simple idea: to bridge the gap between local businesses and their communities. 
              We believe that every neighborhood deserves access to quality products and services, and every business 
              deserves a platform to reach their customers effectively.
            </p>
            <p className="text-muted-foreground">
              Founded in 2024, Wyshkit has grown from a small startup to a comprehensive platform that serves 
              thousands of businesses and customers across India. Our mission is to empower local commerce and 
              create meaningful connections within communities.
            </p>
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="h-5 w-5 mr-2 text-primary" />
                Our Mission
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                To democratize local commerce by providing businesses with the tools they need to succeed 
                and customers with easy access to quality local products and services.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Heart className="h-5 w-5 mr-2 text-primary" />
                Our Vision
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                To create a world where local businesses thrive and communities are strengthened through 
                meaningful commerce and genuine human connections.
              </p>
            </CardContent>
          </Card>
        </div>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>What We Do</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <Users className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">For Businesses</h3>
                <p className="text-muted-foreground text-sm">
                  We provide businesses with a comprehensive platform to manage their products, 
                  orders, and customer relationships.
                </p>
              </div>
              <div className="text-center">
                <Target className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">For Customers</h3>
                <p className="text-muted-foreground text-sm">
                  We offer customers an easy way to discover and purchase from local businesses 
                  with confidence and convenience.
                </p>
              </div>
              <div className="text-center">
                <Award className="h-12 w-12 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold mb-2">For Communities</h3>
                <p className="text-muted-foreground text-sm">
                  We strengthen local economies by keeping commerce within communities 
                  and supporting local entrepreneurs.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Our Values</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-2">Transparency</h4>
                <p className="text-muted-foreground text-sm mb-4">
                  We believe in open communication and honest business practices with all our partners and customers.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Innovation</h4>
                <p className="text-muted-foreground text-sm mb-4">
                  We continuously improve our platform with cutting-edge technology to serve our community better.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Community</h4>
                <p className="text-muted-foreground text-sm mb-4">
                  We prioritize the well-being and success of the communities we serve.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Quality</h4>
                <p className="text-muted-foreground text-sm mb-4">
                  We maintain high standards in everything we do, from our technology to our customer service.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Our Team</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Wyshkit is built by a passionate team of entrepreneurs, developers, designers, and business experts 
              who believe in the power of local commerce. Our diverse team brings together decades of experience 
              in technology, business, and community development.
            </p>
            <p className="text-muted-foreground">
              We're always looking for talented individuals who share our vision. If you're interested in joining 
              our team, please visit our careers page or contact us at careers@wyshkit.com.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Get Involved</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Whether you're a business owner looking to expand your reach, a customer wanting to support local 
              businesses, or someone who shares our vision for stronger communities, there are many ways to get involved:
            </p>
            <ul className="list-disc list-inside text-muted-foreground space-y-2">
              <li>Join our platform as a business partner</li>
              <li>Shop local and support community businesses</li>
              <li>Refer friends and family to our platform</li>
              <li>Share feedback to help us improve</li>
              <li>Follow us on social media for updates</li>
            </ul>
            <div className="mt-6">
              <Link to="/contact">
                <Button>Contact Us</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default About;

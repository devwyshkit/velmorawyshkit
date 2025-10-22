import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Refund = () => {
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
          <h1 className="text-4xl font-bold text-foreground">Refund Policy</h1>
          <p className="text-muted-foreground mt-2">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>1. Refund Eligibility</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              We offer refunds for orders that meet the following criteria:
            </p>
            <ul className="list-disc list-inside text-muted-foreground">
              <li>Request made within 7 days of order delivery</li>
              <li>Product is in original, unused condition</li>
              <li>Original packaging and tags are intact</li>
              <li>Product is not a custom-made or personalized item</li>
              <li>Product is not perishable or consumable</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>2. Non-Refundable Items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">The following items are not eligible for refunds:</p>
            <ul className="list-disc list-inside text-muted-foreground">
              <li>Custom-made or personalized products</li>
              <li>Perishable goods (food items, flowers, etc.)</li>
              <li>Digital products or services</li>
              <li>Items damaged by misuse or normal wear and tear</li>
              <li>Items returned after 7 days</li>
              <li>Items without original packaging or tags</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>3. How to Request a Refund</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">To request a refund:</p>
            <ol className="list-decimal list-inside text-muted-foreground">
              <li>Log into your Wyshkit account</li>
              <li>Go to "My Orders" and select the order you want to return</li>
              <li>Click "Request Refund" and provide a reason</li>
              <li>Upload photos of the product if required</li>
              <li>Submit your request</li>
            </ol>
            <p className="text-muted-foreground mt-4">
              You can also contact our customer support team at support@wyshkit.com or call +91-9876543210.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>4. Refund Processing Time</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Once we receive your returned item and approve the refund:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-4">
              <li>Credit card refunds: 5-10 business days</li>
              <li>Bank transfer refunds: 3-7 business days</li>
              <li>Digital wallet refunds: 1-3 business days</li>
              <li>Store credit: Immediate</li>
            </ul>
            <p className="text-muted-foreground mt-4">
              Refund processing time may vary depending on your bank or payment provider.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>5. Return Shipping</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              For eligible returns, we will provide a prepaid return shipping label. 
              If the return is due to our error (wrong item, damaged item, etc.), we cover all return costs.
            </p>
            <p className="text-muted-foreground">
              If you change your mind about a purchase, you may be responsible for return shipping costs, 
              which will be deducted from your refund amount.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>6. Partial Refunds</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              In some cases, we may offer partial refunds for:
            </p>
            <ul className="list-disc list-inside text-muted-foreground mt-4">
              <li>Items that show signs of use or wear</li>
              <li>Items missing original packaging or accessories</li>
              <li>Items returned after the 7-day window</li>
              <li>Items that don't meet our return condition standards</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>7. Exchange Policy</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              We offer exchanges for items in the same price range within 7 days of delivery. 
              Exchanges are subject to product availability. If the desired item is not available, 
              we will process a refund instead.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>8. Damaged or Defective Items</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              If you receive a damaged or defective item, please contact us immediately with photos. 
              We will arrange for a replacement or full refund at no cost to you. 
              This policy applies regardless of the 7-day return window.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>9. Refund Method</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Refunds will be processed using the same payment method used for the original purchase. 
              If that's not possible, we will issue store credit or arrange an alternative refund method.
            </p>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>10. Contact Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              For questions about refunds or returns, please contact us:
            </p>
            <div className="mt-4">
              <p className="text-muted-foreground">Email: support@wyshkit.com</p>
              <p className="text-muted-foreground">Phone: +91-9876543210</p>
              <p className="text-muted-foreground">Address: Wyshkit Technologies, Bangalore, India</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Refund;

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Search, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";

const FAQ = () => {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  const faqData = [
    {
      category: "General",
      questions: [
        {
          q: "What is Wyshkit?",
          a: "Wyshkit is a platform that connects local businesses with customers in their community. We help businesses reach more customers and help customers discover great local products and services."
        },
        {
          q: "How is Wyshkit different from other e-commerce platforms?",
          a: "Wyshkit focuses specifically on local businesses and community commerce. We provide tools for local businesses to manage their online presence while keeping commerce within the community."
        },
        {
          q: "Is Wyshkit available in my city?",
          a: "Wyshkit is currently available in major cities across India. We're constantly expanding to new areas. Check our website or contact us to see if we're available in your city."
        }
      ]
    },
    {
      category: "For Customers",
      questions: [
        {
          q: "How do I place an order?",
          a: "Browse products from local businesses, add items to your cart, proceed to checkout, enter your delivery details, choose payment method, and confirm your order. You'll receive order confirmation via email and SMS."
        },
        {
          q: "What are the delivery charges?",
          a: "Delivery charges vary by location and order value. Many businesses offer free delivery for orders above a certain amount. Delivery charges are clearly displayed during checkout."
        },
        {
          q: "How long does delivery take?",
          a: "Delivery times vary by business and location. Most local deliveries are completed within 1-3 days. You can track your order in real-time through your account dashboard."
        },
        {
          q: "Can I cancel my order?",
          a: "You can cancel your order if it hasn't been processed by the business. Once an order is confirmed by the business, cancellation may not be possible. Check your order status for cancellation options."
        }
      ]
    },
    {
      category: "For Businesses",
      questions: [
        {
          q: "How do I join Wyshkit as a business?",
          a: "Visit our partner portal, complete the registration form, verify your business details, upload required documents, and our team will review your application. Once approved, you can start listing your products."
        },
        {
          q: "What are the fees for businesses?",
          a: "Wyshkit charges a small commission on successful sales. There are no upfront fees or monthly subscriptions. Our fee structure is transparent and competitive with industry standards."
        },
        {
          q: "How do I manage my products and orders?",
          a: "Use our partner dashboard to add products, manage inventory, process orders, track sales, and communicate with customers. The dashboard is designed to be user-friendly and comprehensive."
        },
        {
          q: "What support do you provide to businesses?",
          a: "We provide comprehensive support including onboarding assistance, marketing tools, customer service support, and regular training sessions to help your business succeed on our platform."
        }
      ]
    },
    {
      category: "Payments & Billing",
      questions: [
        {
          q: "What payment methods do you accept?",
          a: "We accept all major credit cards, debit cards, UPI, net banking, and digital wallets including Paytm, PhonePe, Google Pay, and more. All payments are processed securely."
        },
        {
          q: "When do businesses receive payments?",
          a: "Businesses receive payments on a weekly basis, typically within 3-5 business days after order completion. We handle all payment processing and provide detailed payment reports."
        },
        {
          q: "Are my payment details secure?",
          a: "Yes, we use industry-standard encryption and security measures to protect your payment information. We never store your complete payment details on our servers."
        }
      ]
    },
    {
      category: "Returns & Refunds",
      questions: [
        {
          q: "What is your return policy?",
          a: "We offer a 7-day return policy for most items. Products must be in original condition with tags and packaging intact. Some items like custom products may not be eligible for returns."
        },
        {
          q: "How do I return an item?",
          a: "Log into your account, go to 'My Orders', select the order you want to return, click 'Request Return', and follow the instructions. We'll arrange for pickup if needed."
        },
        {
          q: "How long do refunds take?",
          a: "Refunds are typically processed within 5-10 business days after we receive the returned item. The exact time depends on your payment method and bank processing times."
        }
      ]
    }
  ];

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
          <h1 className="text-4xl font-bold text-foreground">Frequently Asked Questions</h1>
          <p className="text-muted-foreground mt-2">Find answers to common questions</p>
        </div>

        {/* Search */}
        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search FAQs..."
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* FAQ Categories */}
        {faqData.map((category, categoryIndex) => (
          <Card key={categoryIndex} className="mb-6">
            <CardHeader>
              <CardTitle>{category.category}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {category.questions.map((item, itemIndex) => {
                  const globalIndex = categoryIndex * 100 + itemIndex;
                  const isOpen = openItems.includes(globalIndex);
                  
                  return (
                    <div key={itemIndex} className="border-b border-border last:border-b-0 pb-4 last:pb-0">
                      <button
                        onClick={() => toggleItem(globalIndex)}
                        className="w-full text-left flex items-center justify-between py-2 hover:text-primary transition-colors"
                      >
                        <h4 className="font-semibold">{item.q}</h4>
                        {isOpen ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                      {isOpen && (
                        <p className="text-muted-foreground mt-2 pl-4">
                          {item.a}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Contact Support */}
        <Card>
          <CardHeader>
            <CardTitle>Still Have Questions?</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Can't find the answer you're looking for? Our support team is here to help.
            </p>
            <div className="flex gap-4">
              <Link to="/contact">
                <Button>Contact Support</Button>
              </Link>
              <Link to="/help">
                <Button variant="outline">Visit Help Center</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FAQ;

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CreditCard, 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Info,
  FileText,
  Clock
} from 'lucide-react';

interface PaymentRefundPolicyProps {
  orderType: 'individual' | 'bulk';
  hasCustomization: boolean;
  className?: string;
}

export const PaymentRefundPolicy: React.FC<PaymentRefundPolicyProps> = ({
  orderType,
  hasCustomization,
  className
}) => {
  const [showFullPolicy, setShowFullPolicy] = useState(false);

  const getPaymentPolicy = () => {
    return {
      title: "Payment Terms",
      description: "100% advance payment required for all orders",
      details: [
        "Full payment must be completed before order processing begins",
        "Payment confirmation required before vendor starts production",
        "Orders are not processed until payment is verified",
        "Payment gateway charges (2%) are included in the total amount"
      ],
      icon: CreditCard,
      color: "bg-blue-50 text-blue-800 border-blue-200"
    };
  };

  const getRefundPolicy = () => {
    if (hasCustomization) {
      return {
        title: "Refund Policy - Customized Orders",
        description: "Customized orders cannot be cancelled or refunded once approved",
        details: [
          "NO REFUND for customized orders after preview approval",
          "NO REFUND for orders with branding, engraving, or personalization",
          "NO REFUND for add-ons like custom wrapping or branded cards",
          "NO REFUND for bulk orders after vendor starts production",
          "Preview approval confirms your acceptance of the final product"
        ],
        eligible: false,
        icon: XCircle,
        color: "bg-red-50 text-red-800 border-red-200"
      };
    } else {
      return {
        title: "Refund Policy - Standard Orders",
        description: "Standard orders can be returned within 7 days",
        details: [
          "7-day return window for non-customized products",
          "Items must be unopened and in original condition",
          "Delivery charges (₹80-150) will be deducted from refund",
          "Refund processed within 5-7 business days",
          "Full refund available for damaged products during delivery"
        ],
        eligible: true,
        icon: CheckCircle,
        color: "bg-green-50 text-green-800 border-green-200"
      };
    }
  };

  const getOrderTypePolicy = () => {
    if (orderType === 'bulk') {
      return {
        title: "Bulk Order Policy",
        description: "Special terms apply to bulk orders (50+ items)",
        details: [
          "Preview approval required before production",
          "Once preview is approved, order cannot be cancelled",
          "Production timeline: 7-15 days depending on quantity",
          "Quality assurance provided for bulk orders",
          "Custom branding available with MOQ requirements"
        ],
        icon: FileText,
        color: "bg-purple-50 text-purple-800 border-purple-200"
      };
    }
    return null;
  };

  const paymentPolicy = getPaymentPolicy();
  const refundPolicy = getRefundPolicy();
  const orderTypePolicy = getOrderTypePolicy();

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Payment Policy */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <paymentPolicy.icon className="w-5 h-5 text-blue-600" />
            {paymentPolicy.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className={paymentPolicy.color}>
            <Shield className="w-4 h-4" />
            <AlertDescription>
              {paymentPolicy.description}
            </AlertDescription>
          </Alert>
          
          {showFullPolicy && (
            <div className="mt-4 space-y-2">
              {paymentPolicy.details.map((detail, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                  <span>{detail}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Refund Policy */}
      <Card className={`border-l-4 ${hasCustomization ? 'border-l-red-500' : 'border-l-green-500'}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <refundPolicy.icon className={`w-5 h-5 ${hasCustomization ? 'text-red-600' : 'text-green-600'}`} />
            {refundPolicy.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className={refundPolicy.color}>
            {hasCustomization ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
            <AlertDescription>
              {refundPolicy.description}
            </AlertDescription>
          </Alert>
          
          {showFullPolicy && (
            <div className="mt-4 space-y-2">
              {refundPolicy.details.map((detail, index) => (
                <div key={index} className="flex items-start gap-2 text-sm">
                  {hasCustomization ? (
                    <XCircle className="w-4 h-4 text-red-600 mt-0.5 flex-shrink-0" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                  )}
                  <span>{detail}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Order Type Policy */}
      {orderTypePolicy && (
        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <orderTypePolicy.icon className="w-5 h-5 text-purple-600" />
              {orderTypePolicy.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className={orderTypePolicy.color}>
              <Info className="w-4 h-4" />
              <AlertDescription>
                {orderTypePolicy.description}
              </AlertDescription>
            </Alert>
            
            {showFullPolicy && (
              <div className="mt-4 space-y-2">
                {orderTypePolicy.details.map((detail, index) => (
                  <div key={index} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                    <span>{detail}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Important Notice */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800 mb-1">Important Notice</p>
              <p className="text-yellow-700">
                By placing this order, you agree to our payment and refund policies. 
                {hasCustomization && " Customized orders cannot be cancelled once approved."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Toggle Button */}
      <div className="text-center">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowFullPolicy(!showFullPolicy)}
        >
          {showFullPolicy ? 'Show Less' : 'View Full Policy'}
        </Button>
      </div>
    </div>
  );
};

// Quick Policy Summary Component
export const PolicySummary: React.FC<{
  hasCustomization: boolean;
  orderType: 'individual' | 'bulk';
}> = ({ hasCustomization, orderType }) => {
  const getSummary = () => {
    if (hasCustomization) {
      return {
        payment: "100% advance payment required",
        refund: "No refund for customized orders",
        color: "text-red-600",
        icon: XCircle
      };
    } else {
      return {
        payment: "100% advance payment required",
        refund: "7-day return policy available",
        color: "text-green-600",
        icon: CheckCircle
      };
    }
  };

  const summary = getSummary();
  const IconComponent = summary.icon;

  return (
    <div className="flex items-center gap-2 text-sm">
      <IconComponent className={`w-4 h-4 ${summary.color}`} />
      <span className="text-gray-600">Payment: {summary.payment} • Refund: {summary.refund}</span>
    </div>
  );
};

// Policy Badge Component
export const PolicyBadge: React.FC<{
  type: 'payment' | 'refund' | 'customization';
  status: 'required' | 'available' | 'not-available';
}> = ({ type, status }) => {
  const getBadgeConfig = () => {
    switch (type) {
      case 'payment':
        return {
          text: '100% Advance Payment',
          color: 'bg-blue-100 text-blue-800 border-blue-200'
        };
      case 'refund':
        if (status === 'available') {
          return {
            text: '7-Day Return Policy',
            color: 'bg-green-100 text-green-800 border-green-200'
          };
        } else {
          return {
            text: 'No Refund Policy',
            color: 'bg-red-100 text-red-800 border-red-200'
          };
        }
      case 'customization':
        return {
          text: 'Customization Available',
          color: 'bg-purple-100 text-purple-800 border-purple-200'
        };
      default:
        return {
          text: 'Standard Policy',
          color: 'bg-gray-100 text-gray-800 border-gray-200'
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <Badge variant="outline" className={config.color}>
      {config.text}
    </Badge>
  );
};

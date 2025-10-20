import { QRCodeSVG } from 'qrcode.react';
import { Card, CardContent } from "@/components/ui/card";

interface QRCodeGeneratorProps {
  value: string;
  size?: number;
  includeMargin?: boolean;
}

/**
 * QR Code Generator Component
 * Generates QR codes for referral links
 * Using qrcode.react library
 */
export const QRCodeGenerator = ({
  value,
  size = 200,
  includeMargin = true,
}: QRCodeGeneratorProps) => {
  return (
    <Card className="inline-block">
      <CardContent className="p-4">
        <div className="bg-white p-4 rounded-lg inline-block">
          <QRCodeSVG
            value={value}
            size={size}
            level="H"
            includeMargin={includeMargin}
            imageSettings={{
              src: "/wyshkit-logo.png",
              height: 30,
              width: 30,
              excavate: true,
            }}
          />
        </div>
        <p className="text-xs text-center text-muted-foreground mt-2">
          Scan to join via referral
        </p>
      </CardContent>
    </Card>
  );
};


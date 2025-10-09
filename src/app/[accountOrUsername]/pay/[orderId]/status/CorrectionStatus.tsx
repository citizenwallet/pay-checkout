import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { AlertTriangle, Phone } from "lucide-react";
import { OrderWithBusiness } from "@/db/orders";
import CurrencyLogo from "@/components/currency-logo";

interface CorrectionStatusProps {
  order: OrderWithBusiness;
  orderId: number;
  accountOrUsername: string;
  logo: string;
}

export default function CorrectionStatus({
  order,
  orderId,
  logo,
}: CorrectionStatusProps) {
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <Card className="mx-auto max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="w-16 h-16 text-orange-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-orange-600">
            Order Correction Required
          </CardTitle>
          <p className="text-gray-600 mt-2">
            This order requires manual correction. Please contact the vendor for
            assistance.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Order ID:</span>
              <span className="font-mono">{orderId}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold">Status:</span>
              <span className="text-orange-600 font-semibold">Correction</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold">Amount:</span>
              <div className="flex items-center gap-1">
                <CurrencyLogo
                  className="animate-fade-in-slow"
                  logo={logo}
                  size={18}
                />
                <span className="font-semibold">
                  {(order.total / 100).toFixed(2)}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold">Place:</span>
              <span>{order.place.slug}</span>
            </div>
            {order.description && (
              <div className="flex justify-between items-center">
                <span className="font-semibold">Description:</span>
                <span className="text-right max-w-xs">{order.description}</span>
              </div>
            )}
            {order.tx_hash && (
              <div className="flex justify-between items-center">
                <span className="font-semibold">Transaction:</span>
                <span className="font-mono text-xs">
                  {order.tx_hash.slice(0, 8)}...
                </span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-2">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-orange-600 mt-0.5" />
              <div>
                <h4 className="font-semibold text-orange-800">
                  Contact Required
                </h4>
                <p className="text-sm text-orange-700 mt-1">
                  Please show this order ID to the vendor for manual processing.
                </p>
              </div>
            </div>
          </div>
          <p className="text-sm text-gray-500 text-center">
            The vendor will help resolve any issues with this order.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

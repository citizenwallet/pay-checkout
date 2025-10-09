import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Clock, AlertCircle } from "lucide-react";
import { OrderWithBusiness } from "@/db/orders";
import CurrencyLogo from "@/components/currency-logo";

interface RefundPendingStatusProps {
  order: OrderWithBusiness;
  orderId: number;
  accountOrUsername: string;
  logo: string;
}

export default function RefundPendingStatus({
  order,
  orderId,
  logo,
}: RefundPendingStatusProps) {
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <Card className="mx-auto max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Clock className="w-16 h-16 text-yellow-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-yellow-600">
            Refund Pending
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Your refund request has been submitted and is being reviewed.
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
              <span className="text-yellow-600 font-semibold">
                Refund Pending
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-semibold">Refund Amount:</span>
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
            {order.tx_hash && (
              <div className="flex justify-between items-center">
                <span className="font-semibold">Original Transaction:</span>
                <span className="font-mono text-xs">
                  {order.tx_hash.slice(0, 8)}...
                </span>
              </div>
            )}
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch gap-2">
          <div className="flex items-center justify-center gap-2 text-yellow-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Refund under review</span>
          </div>
          <p className="text-sm text-gray-500 text-center">
            Please allow 1-3 business days for processing. You will be notified
            once approved.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

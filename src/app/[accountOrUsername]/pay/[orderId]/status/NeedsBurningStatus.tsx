import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Flame, Clock } from "lucide-react";
import { OrderWithBusiness } from "@/db/orders";
import CurrencyLogo from "@/components/currency-logo";

interface NeedsBurningStatusProps {
  order: OrderWithBusiness;
  orderId: number;
  accountOrUsername: string;
  logo: string;
}

export default function NeedsBurningStatus({
  order,
  orderId,
  logo,
}: NeedsBurningStatusProps) {
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <Card className="mx-auto max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Flame className="w-16 h-16 text-orange-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-orange-600">
            Processing Refund
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Your refund is being processed. Tokens will be burned and funds
            returned shortly.
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
              <span className="text-orange-600 font-semibold">
                Needs Burning
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
          <div className="flex items-center justify-center gap-2 text-orange-600">
            <Clock className="h-4 w-4 animate-spin" />
            <span className="text-sm">Processing your refund...</span>
          </div>
          <p className="text-sm text-gray-500 text-center">
            This usually takes a few minutes. You will receive your refund
            shortly.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

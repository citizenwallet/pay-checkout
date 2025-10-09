import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { CheckCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderWithBusiness } from "@/db/orders";
import Link from "next/link";
import CurrencyLogo from "@/components/currency-logo";

interface RefundedStatusProps {
  order: OrderWithBusiness;
  orderId: number;
  accountOrUsername: string;
  logo: string;
}

export default function RefundedStatus({
  order,
  orderId,
  accountOrUsername,
  logo,
}: RefundedStatusProps) {
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <Card className="mx-auto max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-600">
            Refund Completed
          </CardTitle>
          <p className="text-gray-600 mt-2">
            Your refund has been successfully processed and funds have been
            returned.
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
              <span className="text-green-600 font-semibold">Refunded</span>
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
            {order.completed_at && (
              <div className="flex justify-between items-center">
                <span className="font-semibold">Refunded:</span>
                <span>{new Date(order.completed_at).toLocaleString()}</span>
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
          <Link href={`/${accountOrUsername}`}>
            <Button variant="outline" className="w-full">
              <RotateCcw className="h-4 w-4 mr-2" />
              Start New Order
            </Button>
          </Link>

          <p className="text-sm text-gray-500 text-center">
            Thank you for your patience. If you have any questions, please
            contact the vendor.
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

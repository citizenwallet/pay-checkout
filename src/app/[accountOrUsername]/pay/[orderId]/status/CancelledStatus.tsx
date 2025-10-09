import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { XCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OrderWithBusiness } from "@/db/orders";
import Link from "next/link";

interface CancelledStatusProps {
  order: OrderWithBusiness;
  orderId: number;
  accountOrUsername: string;
}

export default function CancelledStatus({
  order,
  orderId,
  accountOrUsername,
}: CancelledStatusProps) {
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <Card className="mx-auto max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <XCircle className="w-16 h-16 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-600">
            Order Cancelled
          </CardTitle>
          <p className="text-gray-600 mt-2">
            This order has been cancelled and no payment is required.
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
              <span className="text-red-600 font-semibold">Cancelled</span>
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
            If you believe this is an error, please contact the vendor
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

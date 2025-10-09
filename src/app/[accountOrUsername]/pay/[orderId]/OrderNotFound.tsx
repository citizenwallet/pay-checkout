import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import Link from "next/link";

interface OrderNotFoundProps {
  orderId: number;
  accountOrUsername: string;
}

export default function OrderNotFound({
  orderId,
  accountOrUsername,
}: OrderNotFoundProps) {
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <Card className="mx-auto max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="w-16 h-16 text-orange-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Order Not Found
          </CardTitle>
          <p className="text-gray-600 mt-2">
            We couldn&apos;t find an order with ID{" "}
            <span className="font-mono font-semibold">{orderId}</span>.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                What could have happened?
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• The order ID might be incorrect</li>
                <li>• The order may have expired</li>
                <li>• The order might have been cancelled</li>
                <li>• You may have already completed this order</li>
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch">
          <Link
            className="flex items-center justify-center w-full h-12 text-lg mb-3 gap-2"
            href={`/${accountOrUsername}`}
          >
            Return to Menu
            <Home className="h-4 w-4 mr-2" />
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

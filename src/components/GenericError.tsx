import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import Link from "next/link";

interface GenericErrorProps {
  accountOrUsername: string;
}

export default function GenericError({ accountOrUsername }: GenericErrorProps) {
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <Card className="mx-auto max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="w-16 h-16 text-orange-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Service Temporarily Unavailable
          </CardTitle>
          <p className="text-gray-600 mt-2">
            We&apos;re experiencing some technical difficulties. Please try
            again in a few moments.
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                What you can do:
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Wait a few minutes and try again</li>
                <li>• Check your internet connection</li>
                <li>• Return to the menu and try a different order</li>
                <li>• Contact support if the issue persists</li>
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch space-y-3">
          <Link
            className="flex items-center justify-center w-full h-12 text-lg gap-2"
            href={`/${accountOrUsername}`}
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Link>
          <Link
            className="flex items-center justify-center w-full h-12 text-lg gap-2"
            href="/"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}

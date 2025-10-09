import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { MapPin, Home, Search } from "lucide-react";
import Link from "next/link";

interface PlaceNotFoundProps {
  accountOrUsername: string;
}

export default function PlaceNotFound({
  accountOrUsername,
}: PlaceNotFoundProps) {
  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4 sm:px-6 lg:px-8">
      <Card className="mx-auto max-w-lg">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <MapPin className="w-16 h-16 text-orange-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Place Not Found
          </CardTitle>
          <p className="text-gray-600 mt-2">
            We couldn&apos;t find a place with the identifier{" "}
            <span className="font-mono font-semibold">{accountOrUsername}</span>
            .
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 mb-2">
                What could have happened?
              </h3>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• The place identifier might be incorrect</li>
                <li>• The place may have been removed or deactivated</li>
                <li>• The place might be temporarily unavailable</li>
                <li>• You may have mistyped the URL</li>
              </ul>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-stretch space-y-3">
          <Link
            className="flex items-center justify-center w-full h-12 text-lg gap-2"
            href="/"
          >
            <Search className="h-4 w-4" />
            Browse Places
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

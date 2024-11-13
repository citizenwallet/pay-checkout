"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight, Loader2, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useDebounce } from "use-debounce";
import { PlaceSearchResult } from "@/db/places";
import { loadProfileForUsernameAction } from "./actions/loadProfileForUsername";
import { ProfileWithTokenId } from "@citizenwallet/sdk";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/components/link";
import { Card, CardContent } from "@/components/ui/card";

interface PlaceSearchProps {
  search?: string;
  places?: PlaceSearchResult[];
}

export default function PlaceSearch({
  search = "",
  places = [],
}: PlaceSearchProps) {
  const router = useRouter();

  const [profiles, setProfiles] = useState<Record<string, ProfileWithTokenId>>(
    {}
  );
  const [profilesLoading, setProfilesLoading] = useState<
    Record<string, boolean>
  >(places.reduce((acc, place) => ({ ...acc, [place.slug]: true }), {}));

  const [query, setQuery] = useState(search);
  const [debouncedQuery] = useDebounce(query, 500);

  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSearch = useCallback(
    async (q: string) => {
      router.push(`?search=${q}`);
    },
    [router]
  );

  useEffect(() => {
    if (debouncedQuery) {
      handleSearch(debouncedQuery);
    }
  }, [debouncedQuery, handleSearch]);

  useEffect(() => {
    setIsLoading(false);
  }, [search]);

  useEffect(() => {
    console.log("loading profiles", isLoading, places.length);
    if (isLoading || places.length === 0) return;

    places.forEach(async (place) => {
      const profile = await loadProfileForUsernameAction(place.slug);
      if (profile) {
        setProfiles((prev) => ({ ...prev, [place.slug]: profile }));
      }
      setProfilesLoading((prev) => ({ ...prev, [place.slug]: false }));
    });
  }, [isLoading, places]);

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);

    if (e.target.value === "") {
      setIsLoading(false);
      router.push("/");
    } else {
      setIsLoading(true);
    }
  };

  return (
    <div className="flex flex-col justify-start items-center min-h-screen bg-gray-100 p-4 md:flex md:justify-start">
      <div className="flex flex-col flex-1 w-full max-w-md">
        <div className="fixed bottom-0 left-0 w-full bg-white p-4 rounded-t-lg shadow-md flex flex-row justify-center items-center">
          <div className="flex space-x-2 max-w-xl w-full">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search for places..."
              defaultValue={search}
              onChange={handleSearchInput}
              autoFocus
              className="flex-grow"
            />
            <Button onClick={() => handleSearch(query)} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
        {places.length > 0 && (
          <div className="flex flex-col gap-2">
            {places.map((place) => {
              const profile: ProfileWithTokenId | undefined =
                profiles[place.slug];
              const isProfileLoading = profilesLoading[place.slug];
              return (
                <Link key={place.id} className="block" href={`/${place.slug}`}>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="flex items-start space-x-4">
                        {!isProfileLoading && (
                          <Image
                            height={30}
                            width={30}
                            src={profile?.image_small ?? "/shop.png"}
                            alt={profile?.name ?? place.name}
                            className="w-16 h-16 object-cover rounded-full"
                          />
                        )}
                        {isProfileLoading && (
                          <Skeleton className="w-16 h-16 rounded-full" />
                        )}
                        <div className="flex-1">
                          <h2 className="text-xl font-semibold mb-2">
                            {profile?.name ?? place.name}
                          </h2>
                          <p className="text-gray-600 mb-2">@{place.slug}</p>
                          <p className="text-gray-600 h-6">
                            {profile?.description ?? " "}
                          </p>
                        </div>
                        <div className="h-full flex flex-col justify-center items-center">
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
        {places.length === 0 && query && !isLoading && (
          <div className="w-full flex-1 flex justify-center items-center">
            <p className="text-center text-gray-600 mt-4">No places found.</p>
          </div>
        )}
        {places.length === 0 && !query && !isLoading && (
          <div className="w-full flex-1 flex justify-center items-center">
            <p className="text-center text-gray-600 mt-4">
              Search for a place.
            </p>
          </div>
        )}
        {places.length === 0 && query && isLoading && (
          <div className="w-full flex-1 flex justify-center items-center">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        )}
      </div>
    </div>
  );
}

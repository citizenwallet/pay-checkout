import PlaceSearch from "./SearchPlaces";
import { getServiceRoleClient } from "@/db";
import { PlaceSearchResult, searchPlaces } from "@/db/places";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>;
}) {
  const client = getServiceRoleClient();

  const { search } = await searchParams;

  let places: PlaceSearchResult[] = [];
  if (search) {
    const { data } = await searchPlaces(client, search);
    places = data ?? [];
  }

  return <PlaceSearch search={search} places={places} />;
}

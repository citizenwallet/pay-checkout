import { getServiceRoleClient } from "@/db";
import { CommunityConfig } from "@citizenwallet/sdk";
import Config from "@/cw/community.json";
import { getPlaceWithProfile } from "@/lib/place";

export default async function TestFaviconPage() {
  const client = getServiceRoleClient();
  const community = new CommunityConfig(Config);

  // Test with a known shop
  const testShop = "stib-mivb";

  const { place, profile } = await getPlaceWithProfile(
    client,
    community,
    testShop
  );

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Favicon Test Page</h1>

      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Shop: {testShop}</h2>
          <p>Place name: {place?.name || "Not found"}</p>
          <p>Place image: {place?.image || "No image"}</p>
          <p>Profile name: {profile?.name || "Not found"}</p>
          <p>Profile image: {profile?.image || "No image"}</p>
        </div>

        <div>
          <h3 className="text-md font-semibold">Test Links:</h3>
          <ul className="list-disc list-inside space-y-2">
            <li>
              <a
                href={`/favicon/${testShop}?test=true`}
                className="text-blue-500 hover:underline"
                target="_blank"
              >
                Test API Route
              </a>
            </li>
            <li>
              <a
                href={`/favicon/${testShop}`}
                className="text-blue-500 hover:underline"
                target="_blank"
              >
                Actual Favicon
              </a>
            </li>
            <li>
              <a
                href={`/${testShop}`}
                className="text-blue-500 hover:underline"
                target="_blank"
              >
                Shop Page (check favicon in browser tab)
              </a>
            </li>
          </ul>
        </div>

        {place?.image && (
          <div>
            <h3 className="text-md font-semibold">Place Image:</h3>
            <img
              src={place.image}
              alt="Place"
              className="w-16 h-16 object-cover rounded"
            />
          </div>
        )}

        {profile?.image && (
          <div>
            <h3 className="text-md font-semibold">Profile Image:</h3>
            <img
              src={profile.image}
              alt="Profile"
              className="w-16 h-16 object-cover rounded"
            />
          </div>
        )}
      </div>
    </div>
  );
}

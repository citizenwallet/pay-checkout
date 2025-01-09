import { CommunityConfig } from "@citizenwallet/sdk";
import CheckoutScreen from "./Methods";
import Config from "@/cw/community.json";

export default function CheckoutPage() {
  const community = new CommunityConfig(Config);

  return (
    <div className="container mx-auto p-4">
      <CheckoutScreen currencyLogo={community.community.logo} amount={99.99} />
    </div>
  );
}

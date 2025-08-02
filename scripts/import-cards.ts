import fs from "fs";
import { SupabaseClient, createClient } from "@supabase/supabase-js";
import { CommunityConfig, getCardAddress } from "@citizenwallet/sdk";
import { id } from "ethers";
import Config from "@/cw/community.json";
import { idToStructuredMessage } from "@/services/ponto/transaction";

interface ImportCardCSVRow {
  uid: string;
  link: string;
  serial: number;
}

interface ExportCardCSVRow {
  id: string;
  treasury: number;
  account: string;
  target: number;
}

const getServiceRoleClient = (): SupabaseClient => {
  return createClient(
    process.env.SUPABASE_URL ?? "",
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};

const main = async () => {
  const csvFilePath = process.argv[2];
  if (!csvFilePath) {
    console.error("No CSV file path provided");
    process.exit(1);
  }

  const cards: ImportCardCSVRow[] = [];

  const csv = fs.readFileSync(csvFilePath, "utf8");
  const rows = csv.split("\n");
  for (const row of rows.slice(1)) {
    const [uid, link, serial] = row.split(",");
    cards.push({ uid, link, serial: parseInt(serial) });
  }

  const client = getServiceRoleClient();

  const community = new CommunityConfig(Config);

  for (const card of cards) {
    const account = await getCardAddress(community, id(card.uid));
    if (!account) {
      console.log(`No account found for ${card.uid}`);
      continue;
    }

    const exportCard: ExportCardCSVRow = {
      id: idToStructuredMessage(card.serial),
      treasury: 4,
      account: account,
      target: 15000,
    };

    const { data: existingCard, error: existingCardError } = await client
      .from("treasury_account")
      .upsert({
        id: exportCard.id,
        treasury_id: exportCard.treasury,
        account: exportCard.account,
        target: exportCard.target,
      })
      .select("*")
      .maybeSingle();

    if (existingCardError) {
      console.error(existingCardError);
      continue;
    }

    if (!existingCard) {
      console.log(`Card ${exportCard.id} something went wrong`);
      continue;
    }

    console.log(`Card ${exportCard.id} imported`);
  }
};

main();

import {
  TreasuryOperation,
  TreasuryOperationStatus,
} from "@/db/treasury_operation";

export interface TransactionAttributes {
  description: string | null;
  currency: string;
  digest: string;
  amount: number;
  fee: object | null;
  additionalInformation: string | null;
  bankTransactionCode: string;
  cardReference: object | null;
  cardReferenceType: object | null;
  counterpartName: object | null;
  counterpartReference: string;
  createdAt: string; // datetime formatted according to ISO8601 spec
  creditorId: string | null;
  endToEndId: string | null;
  executionDate: string; // datetime
  mandateId: string | null;
  proprietaryBankTransactionCode: string;
  purposeCode: string | null;
  remittanceInformation: string;
  remittanceInformationType: "structured" | "unstructured";
  updatedAt: string; // datetime formatted according to ISO8601 spec
  valueDate: string; // datetime
  internalReference: string; // uuid
}

export interface PontoTransaction {
  id: string;
  attributes: TransactionAttributes;
}

export const pontoTransactionToTreasuryOperation = (
  transaction: PontoTransaction,
  treasuryId: number,
  status: TreasuryOperationStatus
): TreasuryOperation => {
  return {
    id: transaction.id,
    treasury_id: treasuryId,
    created_at: transaction.attributes.createdAt,
    updated_at: transaction.attributes.updatedAt,
    direction: transaction.attributes.amount > 0 ? "in" : "out",
    amount: Math.floor(Math.abs(transaction.attributes.amount) * 100),
    status,
    message: cleanMessage(
      transaction.attributes.remittanceInformation ??
        transaction.attributes.description ??
        ""
    ),
    metadata: {},
    tx_hash: null,
    account: null,
  };
};

const cleanMessage = (message: string) => {
  return message.trim().replace(/[/+]/g, "");
};

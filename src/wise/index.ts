export interface WiseTransaction {
  type: string;
  date: string;
  amount: {
    value: number;
    currency: string;
    zero: boolean;
  };
  totalFees: {
    value: number;
    currency: string;
    zero: boolean;
  };
  details: {
    type: string;
    description: string;
    senderName: string;
    senderAccount: string;
    paymentReference: string;
    recipientAccountNumber: string;
    recipientAccountDetailsId: number;
  };
  exchangeDetails: null;
  runningBalance: {
    value: number;
    currency: string;
    zero: boolean;
  };
  referenceNumber: string;
  attachment: null;
  activityAssetAttributions: unknown[];
}

export const VIVA_EVENT_TYPES = {
  TRANSACTION_PAYMENT_CREATED: 1796,
  TRANSACTION_PRICE_CALCULATED: 1799,
} as const;

export interface VivaEvent<T> {
  Url: string;
  Created: string;
  CorrelationId: string;
  EventTypeId: number;
  EventData: T;
  Delay: string | null;
  RetryCount: number;
  RetryDelay: string | null;
  MessageId: string;
  RecipientId: string;
  MessageTypeId: number;
}

export interface VivaTransactionPaymentCreated {
  Moto: boolean;
  BinId: number;
  IsDcc: boolean;
  Ucaf: string | null;
  Email: string | null;
  Phone: string | null;
  BankId: string;
  Systemic: boolean;
  BatchId: string | null;
  Switching: boolean;
  ParentId: string | null;
  Amount: number;
  ChannelId: string;
  TerminalId: number;
  MerchantId: string;
  OrderCode: number;
  ProductId: string | null;
  StatusId: string;
  FullName: string | null;
  ResellerId: string | null;
  DualMessage: boolean;
  InsDate: string;
  TotalFee: number;
  CardToken: string;
  CardNumber: string;
  Descriptor: string | null;
  TipAmount: number;
  SourceCode: string;
  SourceName: string;
  Latitude: string | null;
  Longitude: string | null;
  CompanyName: string;
  TransactionId: string;
  CompanyTitle: string;
  PanEntryMode: string;
  ReferenceNumber: number;
  ResponseCode: string;
  CurrencyCode: string;
  OrderCulture: string;
  MerchantTrns: string | null;
  CustomerTrns: string | null;
  IsManualRefund: boolean;
  TargetPersonId: string | null;
  TargetWalletId: string | null;
  AcquirerApproved: boolean;
  LoyaltyTriggered: boolean;
  TransactionTypeId: number;
  AuthorizationId: string;
  TotalInstallments: number;
  CardCountryCode: string;
  CardIssuingBank: string;
  RedeemedAmount: number;
  ClearanceDate: string | null;
  ConversionRate: number;
  CurrentInstallment: number;
  OriginalAmount: number;
  Tags: unknown[];
  BillId: string | null;
  ConnectedAccountId: string | null;
  ResellerSourceCode: string | null;
  ResellerSourceName: string | null;
  MerchantCategoryCode: number;
  ResellerCompanyName: string | null;
  CardUniqueReference: string;
  OriginalCurrencyCode: string;
  ExternalTransactionId: string | null;
  ResellerSourceAddress: string | null;
  CardExpirationDate: string;
  ServiceId: string | null;
  RetrievalReferenceNumber: string;
  AssignedMerchantUsers: string[];
  AssignedResellerUsers: string[];
  CardTypeId: number;
  ResponseEventId: string | null;
  ElectronicCommerceIndicator: string | null;
  OrderServiceId: number;
  ApplicationIdentifierTerminal: string;
  IntegrationId: string | null;
  DigitalWalletId: string | null;
  CardProductCategoryId: number;
  CardProductAccountTypeId: number;
  DccSessionId: string | null;
  DccMarkup: number | null;
  DccDifferenceOverEcb: number | null;
}

export interface VivaTransactionPriceCalculated {
  OrderCode: number;
  MerchantId: string;
  IsvFee: number;
  ResellerId: string;
  SourceCode: string;
  SourceName: string;
  TransactionId: string;
  CurrencyCode: string;
  Interchange: number;
  TotalCommission: number;
  ResellerSourceCode: string;
  ResellerSourceName: string;
}

export interface VivaTransaction {
  email: string | null;
  bankId: string;
  amount: number;
  switching: boolean;
  orderCode: number;
  statusId: string;
  fullName: string | null;
  insDate: string;
  cardNumber: string;
  sourceCode: string;
  currencyCode: string;
  customerTrns: string | null;
  merchantTrns: string | null;
  transactionTypeId: number;
  recurringSupport: boolean;
  totalInstallments: number;
  cardCountryCode: string;
  cardIssuingBank: string;
  eventId: number | null;
  currentInstallment: number;
  conversionRate: number;
  originalAmount: number;
  cardUniqueReference: string;
  originalCurrencyCode: string;
  cardExpirationDate: string;
  cardTypeId: number;
  digitalWalletId: string | null;
  loyaltyTransactions: unknown[];
}

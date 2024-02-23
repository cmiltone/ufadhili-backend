type ChargeData = {
  id: number;
  domain: string;
  status: string;
  reference: string;
  amount: number;
  message?: null;
  gateway_response: string;
  paid_at: string;
  created_at: string;
  channel: string;
  currency: string;
  ip_address: string;
  metadata: string;
  fees_breakdown?: null;
  log?: null;
  fees: number;
  fees_split?: null;
  authorization: Authorization;
  customer: Customer;
  plan: PlanOrSubaccountOrSplit;
  subaccount: PlanOrSubaccountOrSplit;
  split: PlanOrSubaccountOrSplit;
  order_id?: null;
  paidAt: string;
  requested_amount: number;
  pos_transaction_data?: null;
  source: Source;
}

type Authorization = {
  authorization_code: string;
  bin: string;
  last4: string;
  exp_month: string;
  exp_year: string;
  channel: string;
  card_type: string;
  bank: string;
  country_code: string;
  brand: string;
  reusable: boolean;
  signature?: null;
  account_name?: null;
}

type Customer = {
  id: number;
  first_name?: null;
  last_name?: null;
  email: string;
  customer_code: string;
  phone?: null;
  metadata?: null;
  risk_action: string;
  international_format_phone?: null;
}

type Source = {
  type: string;
  source: string;
  entry_point: string;
  identifier?: null;
}

type RecipientData = {
  active: boolean;
  createdAt: string;
  currency: string;
  description: string;
  domain: string;
  email?: null;
  id: number;
  integration: number;
  metadata: string;
  name: string;
  recipient_code: string;
  type: string;
  updatedAt: string;
  is_deleted: boolean;
  isDeleted: boolean;
  details: {
    authorization_code?: null;
    account_number: string;
    account_name?: null;
    bank_code: string;
    bank_name: string;
  }
}

type Bank = {
  id: number;
  name: string;
  slug: string;
  code: string;
  longcode: string;
  gateway?: null;
  pay_with_bank: boolean;
  active: boolean;
  country: string;
  currency: string;
  type: string;
  is_deleted: boolean;
  createdAt: string;
  updatedAt?: null;
}

type PaystackTransaction ={
  id: number;
  domain: string;
  status: string;
  reference: string;
  receipt_number?: null;
  amount: number;
  message?: null;
  gateway_response: string;
  helpdesk_link?: null;
  paid_at: string;
  created_at: string;
  channel: string;
  currency: string;
  ip_address: string;
  metadata: Metadata;
  log: TransactionLog;
  fees: number;
  fees_split?: null;
  authorization: Authorization;
  customer: Customer;
  plan: PlanOrSubaccountOrSplit;
  subaccount: PlanOrSubaccountOrSplit;
  split: PlanOrSubaccountOrSplit;
  order_id?: null;
  paidAt: string;
  createdAt: string;
  requested_amount: number;
  pos_transaction_data?: null;
  source: Source;
  fees_breakdown?: null;
}

type Metadata = {
  referrer: string;
}

type TransactionLog = {
  start_time: number;
  time_spent: number;
  attempts: number;
  errors: number;
  success: boolean;
  mobile: boolean;
  input?: (null)[] | null;
  history?: (HistoryEntity)[] | null;
}

type HistoryEntity = {
  type: string;
  message: string;
  time: number;
}

type Authorization = {
  authorization_code: string;
  bin: string;
  last4: string;
  exp_month: string;
  exp_year: string;
  channel: string;
  card_type: string;
  bank: string;
  country_code: string;
  brand: string;
  reusable: boolean;
  signature: string;
  account_name?: null;
  receiver_bank_account_number?: null;
  receiver_bank?: null;
}

type Customer = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  customer_code: string;
  phone: string;
  metadata?: null;
  risk_action: string;
  international_format_phone?: null;
}

type Source = {
  type: string;
  source: string;
  identifier?: null;
}

type TransferData = {
  transfersessionid: [];
  domain: string;
  amount: number;
  currency: string;
  reference: string;
  source: string;
  source_details?: null;
  reason: string;
  status: string;
  failures?: null;
  transfer_code: string;
  titan_code?: null;
  transferred_at?: null;
  id: number;
  integration: number;
  request: number;
  recipient: number;
  createdAt: string;
  updatedAt: string;
}

type Transfer = {
  amount: number;
  currency: string;
  domain: string;
  failures?: null;
  id: number;
  integration: {
    id: number;
    is_live: boolean;
    business_name: string;
  };
  reason: string;
  reference: string;
  source: string;
  source_details?: null;
  status: string;
  titan_code?: null;
  transfer_code: string;
  transferred_at?: null;
  recipient: Recipient;
  session: {
    provider?: null;
    id?: null;
  };
  created_at: string;
  updated_at: string;
}

type PaystackTransfer  = {
  amount: number;
  createdAt: string;
  currency: string;
  domain: string;
  failures?: null;
  id: number;
  integration: number;
  reason: string;
  reference: string;
  source: string;
  source_details?: null;
  status: string;
  titan_code?: null;
  transfer_code: string;
  request: number;
  transferred_at?: null;
  updatedAt: string;
  recipient: Recipient;
  session: {
    provider?: null;
    id?: null;
  };
  fee_charged: number;
  fees_breakdown?: null;
}

type Recipient = {
  active: boolean;
  createdAt: string;
  currency: string;
  description?: null;
  domain: string;
  email: string;
  id: number;
  integration: number;
  metadata?: null;
  name: string;
  recipient_code: string;
  type: string;
  updatedAt: string;
  is_deleted: boolean;
  isDeleted: boolean;
  details: {
    authorization_code?: null;
    account_number: string;
    account_name?: null;
    bank_code: string;
    bank_name: string;
  }
}

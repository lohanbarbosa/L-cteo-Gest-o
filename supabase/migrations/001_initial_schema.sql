-- Lácteo Gestão 1.0

-- Esquema extraído da base Floot em 2026-08-28.

BEGIN;

DO $$ BEGIN CREATE TYPE cost_category AS ENUM ('repair', 'part', 'labor', 'shipping', 'cleaning', 'accessory', 'improvement', 'fee', 'commission', 'tax', 'other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE cost_status AS ENUM ('estimated', 'pending', 'paid'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE financial_account_type AS ENUM ('cash', 'bank', 'digital_wallet', 'other'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'refunded'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE product_status AS ENUM ('received', 'evaluation', 'repair', 'preparation', 'ready', 'advertised', 'reserved', 'sold', 'delivered'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE repair_status AS ENUM ('draft', 'quoted', 'approved', 'in_progress', 'waiting_part', 'completed', 'rejected', 'cancelled'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN CREATE TYPE user_role AS ENUM ('user', 'admin'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE SEQUENCE IF NOT EXISTS businesses_id_seq;

CREATE SEQUENCE IF NOT EXISTS company_entries_id_seq;

CREATE SEQUENCE IF NOT EXISTS credit_cards_id_seq;

CREATE SEQUENCE IF NOT EXISTS financial_accounts_id_seq;

CREATE SEQUENCE IF NOT EXISTS investment_assets_id_seq;

CREATE SEQUENCE IF NOT EXISTS investment_valuations_id_seq;

CREATE SEQUENCE IF NOT EXISTS login_attempts_id_seq;

CREATE SEQUENCE IF NOT EXISTS patrimony_snapshots_id_seq;

CREATE SEQUENCE IF NOT EXISTS personal_assets_id_seq;

CREATE SEQUENCE IF NOT EXISTS personal_entries_id_seq;

CREATE SEQUENCE IF NOT EXISTS product_costs_id_seq;

CREATE SEQUENCE IF NOT EXISTS product_groups_id_seq;

CREATE SEQUENCE IF NOT EXISTS product_status_history_id_seq;

CREATE SEQUENCE IF NOT EXISTS products_id_seq;

CREATE SEQUENCE IF NOT EXISTS profit_transfer_rules_id_seq;

CREATE SEQUENCE IF NOT EXISTS profit_transfers_id_seq;

CREATE SEQUENCE IF NOT EXISTS repair_orders_id_seq;

CREATE SEQUENCE IF NOT EXISTS sale_payments_id_seq;

CREATE SEQUENCE IF NOT EXISTS sales_id_seq;

CREATE SEQUENCE IF NOT EXISTS user_passwords_id_seq;

CREATE SEQUENCE IF NOT EXISTS users_id_seq;

CREATE TABLE IF NOT EXISTS businesses (\n  id bigint DEFAULT nextval('businesses_id_seq'::regclass) NOT NULL,\n  owner_user_id integer NOT NULL,\n  name text NOT NULL,\n  logo_url text,\n  active boolean DEFAULT true NOT NULL,\n  created_at timestamp with time zone DEFAULT now() NOT NULL,\n  updated_at timestamp with time zone DEFAULT now() NOT NULL\n);

CREATE TABLE IF NOT EXISTS company_entries (\n  id bigint DEFAULT nextval('company_entries_id_seq'::regclass) NOT NULL,\n  owner_user_id integer NOT NULL,\n  business_id bigint NOT NULL,\n  entry_type text NOT NULL,\n  name text NOT NULL,\n  amount numeric(14,2) NOT NULL,\n  expected_date date NOT NULL,\n  realized boolean DEFAULT false NOT NULL,\n  notes text,\n  active boolean DEFAULT true NOT NULL,\n  created_at timestamp with time zone DEFAULT now() NOT NULL,\n  updated_at timestamp with time zone DEFAULT now() NOT NULL\n);

CREATE TABLE IF NOT EXISTS credit_cards (\n  id bigint DEFAULT nextval('credit_cards_id_seq'::regclass) NOT NULL,\n  owner_user_id integer NOT NULL,\n  name text NOT NULL,\n  institution text,\n  total_limit numeric(14,2) DEFAULT 0 NOT NULL,\n  available_limit numeric(14,2) DEFAULT 0 NOT NULL,\n  include_as_available boolean DEFAULT false NOT NULL,\n  active boolean DEFAULT true NOT NULL,\n  created_at timestamp with time zone DEFAULT now() NOT NULL,\n  updated_at timestamp with time zone DEFAULT now() NOT NULL\n);

CREATE TABLE IF NOT EXISTS financial_accounts (\n  id bigint DEFAULT nextval('financial_accounts_id_seq'::regclass) NOT NULL,\n  owner_user_id integer NOT NULL,\n  name text NOT NULL,\n  account_type financial_account_type NOT NULL,\n  institution text,\n  balance numeric(14,2) DEFAULT 0 NOT NULL,\n  notes text,\n  active boolean DEFAULT true NOT NULL,\n  created_at timestamp with time zone DEFAULT now() NOT NULL,\n  updated_at timestamp with time zone DEFAULT now() NOT NULL,\n  business_id bigint\n);

CREATE TABLE IF NOT EXISTS investment_assets (\n  id bigint DEFAULT nextval('investment_assets_id_seq'::regclass) NOT NULL,\n  owner_user_id integer NOT NULL,\n  name text NOT NULL,\n  asset_type text NOT NULL,\n  quantity numeric(20,8) DEFAULT 1 NOT NULL,\n  average_cost numeric(16,2) DEFAULT 0 NOT NULL,\n  current_unit_price numeric(16,2) DEFAULT 0 NOT NULL,\n  symbol text,\n  notes text,\n  active boolean DEFAULT true NOT NULL,\n  updated_at timestamp with time zone DEFAULT now() NOT NULL,\n  created_at timestamp with time zone DEFAULT now() NOT NULL\n);

CREATE TABLE IF NOT EXISTS investment_valuations (\n  id bigint DEFAULT nextval('investment_valuations_id_seq'::regclass) NOT NULL,\n  asset_id bigint NOT NULL,\n  valuation_month date NOT NULL,\n  unit_price numeric(16,2) NOT NULL,\n  quantity numeric(20,8) NOT NULL,\n  created_at timestamp with time zone DEFAULT now() NOT NULL\n);

CREATE TABLE IF NOT EXISTS login_attempts (\n  id integer DEFAULT nextval('login_attempts_id_seq'::regclass) NOT NULL,\n  email character varying(255) NOT NULL,\n  attempted_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,\n  success boolean DEFAULT false\n);

CREATE TABLE IF NOT EXISTS patrimony_snapshots (\n  id bigint DEFAULT nextval('patrimony_snapshots_id_seq'::regclass) NOT NULL,\n  owner_user_id bigint NOT NULL,\n  snapshot_date date NOT NULL,\n  total_value numeric(16,2) DEFAULT 0 NOT NULL,\n  business_value numeric(16,2) DEFAULT 0 NOT NULL,\n  personal_value numeric(16,2) DEFAULT 0 NOT NULL,\n  investment_value numeric(16,2) DEFAULT 0 NOT NULL,\n  created_at timestamp with time zone DEFAULT now() NOT NULL,\n  updated_at timestamp with time zone DEFAULT now() NOT NULL\n);

CREATE TABLE IF NOT EXISTS personal_assets (\n  id bigint DEFAULT nextval('personal_assets_id_seq'::regclass) NOT NULL,\n  owner_user_id integer NOT NULL,\n  asset_type text NOT NULL,\n  name text NOT NULL,\n  description text,\n  current_value numeric(14,2) DEFAULT 0 NOT NULL,\n  amount_paid numeric(14,2) DEFAULT 0 NOT NULL,\n  outstanding_debt numeric(14,2) DEFAULT 0 NOT NULL,\n  ownership_percentage numeric(7,4),\n  acquisition_date date,\n  notes text,\n  active boolean DEFAULT true NOT NULL,\n  created_at timestamp with time zone DEFAULT now() NOT NULL,\n  updated_at timestamp with time zone DEFAULT now() NOT NULL\n);

CREATE TABLE IF NOT EXISTS personal_entries (\n  id bigint DEFAULT nextval('personal_entries_id_seq'::regclass) NOT NULL,\n  owner_user_id integer NOT NULL,\n  entry_type text NOT NULL,\n  name text NOT NULL,\n  amount numeric(14,2) NOT NULL,\n  competence_month date NOT NULL,\n  recurring boolean DEFAULT false NOT NULL,\n  notes text,\n  active boolean DEFAULT true NOT NULL,\n  created_at timestamp with time zone DEFAULT now() NOT NULL,\n  updated_at timestamp with time zone DEFAULT now() NOT NULL\n);

CREATE TABLE IF NOT EXISTS product_costs (\n  id bigint DEFAULT nextval('product_costs_id_seq'::regclass) NOT NULL,\n  product_id bigint NOT NULL,\n  category cost_category NOT NULL,\n  description text NOT NULL,\n  amount numeric(12,2) NOT NULL,\n  status cost_status DEFAULT 'paid'::cost_status NOT NULL,\n  incurred_on date DEFAULT CURRENT_DATE NOT NULL,\n  provider_name text,\n  notes text,\n  created_at timestamp with time zone DEFAULT now() NOT NULL\n);

CREATE TABLE IF NOT EXISTS product_groups (\n  id bigint DEFAULT nextval('product_groups_id_seq'::regclass) NOT NULL,\n  owner_user_id integer NOT NULL,\n  name text NOT NULL,\n  description text,\n  active boolean DEFAULT true NOT NULL,\n  created_at timestamp with time zone DEFAULT now() NOT NULL,\n  updated_at timestamp with time zone DEFAULT now() NOT NULL,\n  business_id bigint\n);

CREATE TABLE IF NOT EXISTS product_status_history (\n  id bigint DEFAULT nextval('product_status_history_id_seq'::regclass) NOT NULL,\n  product_id bigint NOT NULL,\n  from_status product_status,\n  to_status product_status NOT NULL,\n  note text,\n  changed_by integer NOT NULL,\n  changed_at timestamp with time zone DEFAULT now() NOT NULL\n);

CREATE TABLE IF NOT EXISTS products (\n  id bigint DEFAULT nextval('products_id_seq'::regclass) NOT NULL,\n  owner_user_id integer NOT NULL,\n  internal_code text NOT NULL,\n  name text NOT NULL,\n  segment text NOT NULL,\n  brand text,\n  model text,\n  color text,\n  capacity text,\n  condition_label text DEFAULT 'seminovo'::text NOT NULL,\n  imei_serial text,\n  battery_health integer,\n  status product_status DEFAULT 'received'::product_status NOT NULL,\n  purchase_date date NOT NULL,\n  purchase_price numeric(12,2) NOT NULL,\n  target_price numeric(12,2),\n  supplier_name text,\n  supplier_contact text,\n  notes text,\n  sold_at timestamp with time zone,\n  deleted_at timestamp with time zone,\n  created_at timestamp with time zone DEFAULT now() NOT NULL,\n  updated_at timestamp with time zone DEFAULT now() NOT NULL,\n  aesthetic_condition text,\n  functional_condition text,\n  accessories text,\n  storage_location text,\n  purchase_payment_method text,\n  purchase_origin text,\n  group_id bigint,\n  seller_reference text,\n  seller_profile_url text,\n  source_platform text,\n  source_location text,\n  business_id bigint,\n  subtitle text\n);

CREATE TABLE IF NOT EXISTS profit_transfer_rules (\n  id bigint DEFAULT nextval('profit_transfer_rules_id_seq'::regclass) NOT NULL,\n  owner_user_id integer NOT NULL,\n  source_type text NOT NULL,\n  business_id bigint,\n  percentage numeric(5,2) NOT NULL,\n  active boolean DEFAULT true NOT NULL,\n  created_at timestamp with time zone DEFAULT now() NOT NULL,\n  updated_at timestamp with time zone DEFAULT now() NOT NULL\n);

CREATE TABLE IF NOT EXISTS profit_transfers (\n  id bigint DEFAULT nextval('profit_transfers_id_seq'::regclass) NOT NULL,\n  owner_user_id bigint NOT NULL,\n  rule_id bigint NOT NULL,\n  business_id bigint,\n  transfer_key text NOT NULL,\n  competence_month date NOT NULL,\n  recognition_month date NOT NULL,\n  amount numeric(16,2) NOT NULL,\n  label text NOT NULL,\n  status text DEFAULT 'pending'::text NOT NULL,\n  deposited_at timestamp with time zone,\n  personal_entry_id bigint,\n  created_at timestamp with time zone DEFAULT now() NOT NULL,\n  updated_at timestamp with time zone DEFAULT now() NOT NULL\n);

CREATE TABLE IF NOT EXISTS repair_orders (\n  id bigint DEFAULT nextval('repair_orders_id_seq'::regclass) NOT NULL,\n  product_id bigint NOT NULL,\n  owner_user_id integer NOT NULL,\n  defect_description text NOT NULL,\n  known_at_purchase boolean DEFAULT false NOT NULL,\n  technician_name text,\n  quoted_amount numeric(12,2),\n  final_amount numeric(12,2),\n  status repair_status DEFAULT 'draft'::repair_status NOT NULL,\n  expected_completion date,\n  notes text,\n  completed_at timestamp with time zone,\n  created_at timestamp with time zone DEFAULT now() NOT NULL,\n  updated_at timestamp with time zone DEFAULT now() NOT NULL,\n  business_id bigint\n);

CREATE TABLE IF NOT EXISTS sale_payments (\n  id bigint DEFAULT nextval('sale_payments_id_seq'::regclass) NOT NULL,\n  sale_id bigint NOT NULL,\n  method text NOT NULL,\n  amount numeric(12,2) NOT NULL,\n  due_date date,\n  paid_at timestamp with time zone,\n  status payment_status DEFAULT 'pending'::payment_status NOT NULL,\n  created_at timestamp with time zone DEFAULT now() NOT NULL\n);

CREATE TABLE IF NOT EXISTS sales (\n  id bigint DEFAULT nextval('sales_id_seq'::regclass) NOT NULL,\n  owner_user_id integer NOT NULL,\n  product_id bigint NOT NULL,\n  customer_name text NOT NULL,\n  customer_contact text,\n  sale_price numeric(12,2) NOT NULL,\n  discount numeric(12,2) DEFAULT 0 NOT NULL,\n  fees numeric(12,2) DEFAULT 0 NOT NULL,\n  sold_at timestamp with time zone DEFAULT now() NOT NULL,\n  notes text,\n  created_at timestamp with time zone DEFAULT now() NOT NULL,\n  business_id bigint,\n  cancelled_at timestamp with time zone\n);

CREATE TABLE IF NOT EXISTS sessions (\n  id text NOT NULL,\n  user_id integer NOT NULL,\n  created_at timestamp with time zone DEFAULT now(),\n  last_accessed timestamp with time zone DEFAULT now(),\n  expires_at timestamp with time zone NOT NULL\n);

CREATE TABLE IF NOT EXISTS user_passwords (\n  id integer DEFAULT nextval('user_passwords_id_seq'::regclass) NOT NULL,\n  user_id integer NOT NULL,\n  password_hash text NOT NULL,\n  created_at timestamp with time zone DEFAULT now()\n);

CREATE TABLE IF NOT EXISTS users (\n  id integer DEFAULT nextval('users_id_seq'::regclass) NOT NULL,\n  email text NOT NULL,\n  display_name text NOT NULL,\n  avatar_url text,\n  role user_role DEFAULT 'user'::user_role NOT NULL,\n  created_at timestamp with time zone DEFAULT now(),\n  updated_at timestamp with time zone DEFAULT now(),\n  active_business_id bigint\n);

DO $$ BEGIN ALTER TABLE businesses ADD CONSTRAINT businesses_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES users(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE businesses ADD CONSTRAINT businesses_owner_user_id_name_key UNIQUE (owner_user_id, name); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE businesses ADD CONSTRAINT businesses_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE company_entries ADD CONSTRAINT company_entries_amount_check CHECK (amount >= 0::numeric); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE company_entries ADD CONSTRAINT company_entries_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE company_entries ADD CONSTRAINT company_entries_entry_type_check CHECK (entry_type = ANY (ARRAY['income'::text, 'expense'::text])); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE company_entries ADD CONSTRAINT company_entries_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES users(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE company_entries ADD CONSTRAINT company_entries_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE credit_cards ADD CONSTRAINT credit_cards_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES users(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE credit_cards ADD CONSTRAINT credit_cards_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE financial_accounts ADD CONSTRAINT financial_accounts_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE financial_accounts ADD CONSTRAINT financial_accounts_business_id_name_key UNIQUE (business_id, name); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE financial_accounts ADD CONSTRAINT financial_accounts_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES users(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE financial_accounts ADD CONSTRAINT financial_accounts_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE investment_assets ADD CONSTRAINT investment_assets_asset_type_check CHECK (asset_type = ANY (ARRAY['stock'::text, 'crypto'::text, 'fund'::text, 'property'::text, 'fixed_income'::text, 'other'::text])); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE investment_assets ADD CONSTRAINT investment_assets_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES users(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE investment_assets ADD CONSTRAINT investment_assets_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE investment_valuations ADD CONSTRAINT investment_valuations_asset_id_fkey FOREIGN KEY (asset_id) REFERENCES investment_assets(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE investment_valuations ADD CONSTRAINT investment_valuations_asset_id_valuation_month_key UNIQUE (asset_id, valuation_month); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE investment_valuations ADD CONSTRAINT investment_valuations_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE login_attempts ADD CONSTRAINT login_attempts_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE patrimony_snapshots ADD CONSTRAINT patrimony_snapshots_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE patrimony_snapshots ADD CONSTRAINT patrimony_snapshots_owner_user_id_snapshot_date_key UNIQUE (owner_user_id, snapshot_date); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE patrimony_snapshots ADD CONSTRAINT patrimony_snapshots_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE personal_assets ADD CONSTRAINT personal_assets_amount_paid_check CHECK (amount_paid >= 0::numeric); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE personal_assets ADD CONSTRAINT personal_assets_asset_type_check CHECK (asset_type = ANY (ARRAY['property'::text, 'vehicle'::text, 'equity'::text])); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE personal_assets ADD CONSTRAINT personal_assets_current_value_check CHECK (current_value >= 0::numeric); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE personal_assets ADD CONSTRAINT personal_assets_outstanding_debt_check CHECK (outstanding_debt >= 0::numeric); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE personal_assets ADD CONSTRAINT personal_assets_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES users(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE personal_assets ADD CONSTRAINT personal_assets_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE personal_entries ADD CONSTRAINT personal_entries_amount_check CHECK (amount >= 0::numeric); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE personal_entries ADD CONSTRAINT personal_entries_entry_type_check CHECK (entry_type = ANY (ARRAY['income'::text, 'expense'::text])); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE personal_entries ADD CONSTRAINT personal_entries_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES users(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE personal_entries ADD CONSTRAINT personal_entries_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE product_costs ADD CONSTRAINT product_costs_amount_check CHECK (amount >= 0::numeric); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE product_costs ADD CONSTRAINT product_costs_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE product_costs ADD CONSTRAINT product_costs_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE product_groups ADD CONSTRAINT product_groups_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE product_groups ADD CONSTRAINT product_groups_business_id_name_key UNIQUE (business_id, name); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE product_groups ADD CONSTRAINT product_groups_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES users(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE product_groups ADD CONSTRAINT product_groups_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE product_status_history ADD CONSTRAINT product_status_history_changed_by_fkey FOREIGN KEY (changed_by) REFERENCES users(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE product_status_history ADD CONSTRAINT product_status_history_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE product_status_history ADD CONSTRAINT product_status_history_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE products ADD CONSTRAINT products_battery_health_check CHECK (battery_health IS NULL OR battery_health >= 0 AND battery_health <= 100); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE products ADD CONSTRAINT products_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE products ADD CONSTRAINT products_group_id_fkey FOREIGN KEY (group_id) REFERENCES product_groups(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE products ADD CONSTRAINT products_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES users(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE products ADD CONSTRAINT products_owner_user_id_internal_code_key UNIQUE (owner_user_id, internal_code); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE products ADD CONSTRAINT products_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE products ADD CONSTRAINT products_purchase_price_check CHECK (purchase_price >= 0::numeric); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE products ADD CONSTRAINT products_target_price_check CHECK (target_price IS NULL OR target_price >= 0::numeric); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE profit_transfer_rules ADD CONSTRAINT profit_transfer_rules_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE profit_transfer_rules ADD CONSTRAINT profit_transfer_rules_check CHECK (source_type = 'business'::text AND business_id IS NOT NULL OR source_type = 'investments'::text); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE profit_transfer_rules ADD CONSTRAINT profit_transfer_rules_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES users(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE profit_transfer_rules ADD CONSTRAINT profit_transfer_rules_percentage_check CHECK (percentage >= 0::numeric AND percentage <= 100::numeric); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE profit_transfer_rules ADD CONSTRAINT profit_transfer_rules_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE profit_transfer_rules ADD CONSTRAINT profit_transfer_rules_source_type_check CHECK (source_type = ANY (ARRAY['business'::text, 'investments'::text])); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE profit_transfers ADD CONSTRAINT profit_transfers_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE profit_transfers ADD CONSTRAINT profit_transfers_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES users(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE profit_transfers ADD CONSTRAINT profit_transfers_owner_user_id_transfer_key_key UNIQUE (owner_user_id, transfer_key); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE profit_transfers ADD CONSTRAINT profit_transfers_personal_entry_id_fkey FOREIGN KEY (personal_entry_id) REFERENCES personal_entries(id) ON DELETE SET NULL; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE profit_transfers ADD CONSTRAINT profit_transfers_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE profit_transfers ADD CONSTRAINT profit_transfers_rule_id_fkey FOREIGN KEY (rule_id) REFERENCES profit_transfer_rules(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE profit_transfers ADD CONSTRAINT profit_transfers_status_check CHECK (status = ANY (ARRAY['pending'::text, 'deposited'::text])); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE repair_orders ADD CONSTRAINT repair_orders_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE repair_orders ADD CONSTRAINT repair_orders_final_amount_check CHECK (final_amount IS NULL OR final_amount >= 0::numeric); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE repair_orders ADD CONSTRAINT repair_orders_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES users(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE repair_orders ADD CONSTRAINT repair_orders_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE repair_orders ADD CONSTRAINT repair_orders_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE repair_orders ADD CONSTRAINT repair_orders_quoted_amount_check CHECK (quoted_amount IS NULL OR quoted_amount >= 0::numeric); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE sale_payments ADD CONSTRAINT sale_payments_amount_check CHECK (amount > 0::numeric); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE sale_payments ADD CONSTRAINT sale_payments_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE sale_payments ADD CONSTRAINT sale_payments_sale_id_fkey FOREIGN KEY (sale_id) REFERENCES sales(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE sales ADD CONSTRAINT sales_business_id_fkey FOREIGN KEY (business_id) REFERENCES businesses(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE sales ADD CONSTRAINT sales_discount_check CHECK (discount >= 0::numeric); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE sales ADD CONSTRAINT sales_fees_check CHECK (fees >= 0::numeric); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE sales ADD CONSTRAINT sales_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES users(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE sales ADD CONSTRAINT sales_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE sales ADD CONSTRAINT sales_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE sales ADD CONSTRAINT sales_sale_price_check CHECK (sale_price >= 0::numeric); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE sessions ADD CONSTRAINT sessions_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE sessions ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE user_passwords ADD CONSTRAINT user_passwords_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE user_passwords ADD CONSTRAINT user_passwords_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE; EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE user_passwords ADD CONSTRAINT user_passwords_user_id_key UNIQUE (user_id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE users ADD CONSTRAINT users_active_business_id_fkey FOREIGN KEY (active_business_id) REFERENCES businesses(id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN ALTER TABLE users ADD CONSTRAINT users_pkey PRIMARY KEY (id); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS company_entries_owner_business_date_idx ON public.company_entries USING btree (owner_user_id, business_id, expected_date);

CREATE INDEX IF NOT EXISTS financial_accounts_owner_idx ON public.financial_accounts USING btree (owner_user_id, active);

CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON public.sessions USING btree (expires_at);

CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON public.sessions USING btree (user_id);

CREATE INDEX IF NOT EXISTS idx_users_email ON public.users USING btree (email);

CREATE INDEX IF NOT EXISTS login_attempts_cleanup_idx ON public.login_attempts USING btree (attempted_at) WHERE (attempted_at IS NOT NULL);

CREATE INDEX IF NOT EXISTS login_attempts_email_fail_idx ON public.login_attempts USING btree (lower((email)::text), attempted_at DESC) WHERE (success = false);

CREATE INDEX IF NOT EXISTS personal_assets_owner_type_idx ON public.personal_assets USING btree (owner_user_id, asset_type);

CREATE INDEX IF NOT EXISTS product_costs_product_idx ON public.product_costs USING btree (product_id);

CREATE INDEX IF NOT EXISTS product_groups_owner_idx ON public.product_groups USING btree (owner_user_id, active, name);

CREATE INDEX IF NOT EXISTS product_status_history_product_idx ON public.product_status_history USING btree (product_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS products_group_idx ON public.products USING btree (group_id) WHERE (deleted_at IS NULL);

CREATE UNIQUE INDEX IF NOT EXISTS products_owner_imei_unique ON public.products USING btree (owner_user_id, imei_serial) WHERE ((imei_serial IS NOT NULL) AND (deleted_at IS NULL));

CREATE INDEX IF NOT EXISTS products_owner_status_idx ON public.products USING btree (owner_user_id, status) WHERE (deleted_at IS NULL);

CREATE INDEX IF NOT EXISTS repair_orders_owner_status_idx ON public.repair_orders USING btree (owner_user_id, status);

CREATE INDEX IF NOT EXISTS repair_orders_product_idx ON public.repair_orders USING btree (product_id);

CREATE INDEX IF NOT EXISTS sale_payments_sale_idx ON public.sale_payments USING btree (sale_id);

CREATE UNIQUE INDEX IF NOT EXISTS sales_one_active_product_idx ON public.sales USING btree (product_id) WHERE (cancelled_at IS NULL);

CREATE INDEX IF NOT EXISTS sales_owner_date_idx ON public.sales USING btree (owner_user_id, sold_at DESC);

COMMIT;



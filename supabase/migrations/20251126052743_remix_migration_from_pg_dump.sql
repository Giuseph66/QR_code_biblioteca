CREATE EXTENSION IF NOT EXISTS "pg_graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "plpgsql";
CREATE EXTENSION IF NOT EXISTS "supabase_vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


SET default_table_access_method = heap;

--
-- Name: ad_items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ad_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    ads_config_id uuid NOT NULL,
    url text NOT NULL,
    ad_type text DEFAULT 'image'::text NOT NULL,
    duration integer DEFAULT 10 NOT NULL,
    fit_mode text DEFAULT 'contain'::text NOT NULL,
    sort_order integer DEFAULT 0 NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT ad_items_ad_type_check CHECK ((ad_type = ANY (ARRAY['image'::text, 'video'::text, 'youtube'::text]))),
    CONSTRAINT ad_items_fit_mode_check CHECK ((fit_mode = ANY (ARRAY['cover'::text, 'contain'::text, 'fill'::text])))
);


--
-- Name: ads_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ads_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id text,
    ads jsonb DEFAULT '[]'::jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: pix_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pix_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id text,
    pix_key text NOT NULL,
    recipient_name text NOT NULL,
    recipient_city text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: pix_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pix_transactions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id text NOT NULL,
    amount numeric(10,2) NOT NULL,
    description text,
    pix_code text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    active boolean DEFAULT true NOT NULL,
    rest_mode boolean DEFAULT false
);


--
-- Name: theme_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.theme_config (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    session_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    light_background text DEFAULT '0 0% 100%'::text,
    light_foreground text DEFAULT '240 10% 3.9%'::text,
    light_card text DEFAULT '0 0% 100%'::text,
    light_card_foreground text DEFAULT '240 10% 3.9%'::text,
    light_primary text DEFAULT '240 5.9% 10%'::text,
    light_primary_foreground text DEFAULT '0 0% 98%'::text,
    light_secondary text DEFAULT '240 4.8% 95.9%'::text,
    light_secondary_foreground text DEFAULT '240 5.9% 10%'::text,
    light_muted text DEFAULT '240 4.8% 95.9%'::text,
    light_muted_foreground text DEFAULT '240 3.8% 46.1%'::text,
    light_accent text DEFAULT '240 4.8% 95.9%'::text,
    light_accent_foreground text DEFAULT '240 5.9% 10%'::text,
    light_border text DEFAULT '240 5.9% 90%'::text,
    dark_background text DEFAULT '240 10% 3.9%'::text,
    dark_foreground text DEFAULT '0 0% 98%'::text,
    dark_card text DEFAULT '240 10% 3.9%'::text,
    dark_card_foreground text DEFAULT '0 0% 98%'::text,
    dark_primary text DEFAULT '0 0% 98%'::text,
    dark_primary_foreground text DEFAULT '240 5.9% 10%'::text,
    dark_secondary text DEFAULT '240 3.7% 15.9%'::text,
    dark_secondary_foreground text DEFAULT '0 0% 98%'::text,
    dark_muted text DEFAULT '240 3.7% 15.9%'::text,
    dark_muted_foreground text DEFAULT '240 5% 64.9%'::text,
    dark_accent text DEFAULT '240 3.7% 15.9%'::text,
    dark_accent_foreground text DEFAULT '0 0% 98%'::text,
    dark_border text DEFAULT '240 3.7% 15.9%'::text,
    light_button_primary text DEFAULT '195 85% 45%'::text,
    light_button_primary_foreground text DEFAULT '0 0% 100%'::text,
    light_button_secondary text DEFAULT '145 70% 48%'::text,
    light_button_secondary_foreground text DEFAULT '0 0% 100%'::text,
    dark_button_primary text DEFAULT '195 85% 55%'::text,
    dark_button_primary_foreground text DEFAULT '220 20% 8%'::text,
    dark_button_secondary text DEFAULT '145 70% 55%'::text,
    dark_button_secondary_foreground text DEFAULT '220 20% 8%'::text
);


--
-- Name: ad_items ad_items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_items
    ADD CONSTRAINT ad_items_pkey PRIMARY KEY (id);


--
-- Name: ads_config ads_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ads_config
    ADD CONSTRAINT ads_config_pkey PRIMARY KEY (id);


--
-- Name: ads_config ads_config_session_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ads_config
    ADD CONSTRAINT ads_config_session_id_key UNIQUE (session_id);


--
-- Name: pix_config pix_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pix_config
    ADD CONSTRAINT pix_config_pkey PRIMARY KEY (id);


--
-- Name: pix_config pix_config_session_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pix_config
    ADD CONSTRAINT pix_config_session_id_key UNIQUE (session_id);


--
-- Name: pix_transactions pix_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pix_transactions
    ADD CONSTRAINT pix_transactions_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: theme_config theme_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.theme_config
    ADD CONSTRAINT theme_config_pkey PRIMARY KEY (id);


--
-- Name: idx_ads_config_global; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_ads_config_global ON public.ads_config USING btree (session_id) WHERE (session_id IS NULL);


--
-- Name: idx_pix_config_global; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pix_config_global ON public.pix_config USING btree (session_id) WHERE (session_id IS NULL);


--
-- Name: idx_pix_transactions_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pix_transactions_created_at ON public.pix_transactions USING btree (created_at DESC);


--
-- Name: idx_pix_transactions_session_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pix_transactions_session_id ON public.pix_transactions USING btree (session_id);


--
-- Name: ads_config update_ads_config_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_ads_config_updated_at BEFORE UPDATE ON public.ads_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: pix_config update_pix_config_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_pix_config_updated_at BEFORE UPDATE ON public.pix_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: sessions update_sessions_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON public.sessions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: theme_config update_theme_config_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER update_theme_config_updated_at BEFORE UPDATE ON public.theme_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: ad_items ad_items_ads_config_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ad_items
    ADD CONSTRAINT ad_items_ads_config_id_fkey FOREIGN KEY (ads_config_id) REFERENCES public.ads_config(id) ON DELETE CASCADE;


--
-- Name: ads_config ads_config_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ads_config
    ADD CONSTRAINT ads_config_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id);


--
-- Name: pix_config pix_config_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pix_config
    ADD CONSTRAINT pix_config_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id);


--
-- Name: pix_transactions pix_transactions_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pix_transactions
    ADD CONSTRAINT pix_transactions_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: theme_config theme_config_session_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.theme_config
    ADD CONSTRAINT theme_config_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.sessions(id) ON DELETE CASCADE;


--
-- Name: ad_items Allow public delete from ad_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public delete from ad_items" ON public.ad_items FOR DELETE USING (true);


--
-- Name: ad_items Allow public insert to ad_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public insert to ad_items" ON public.ad_items FOR INSERT WITH CHECK (true);


--
-- Name: ad_items Allow public read access to ad_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public read access to ad_items" ON public.ad_items FOR SELECT USING (true);


--
-- Name: ad_items Allow public update to ad_items; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Allow public update to ad_items" ON public.ad_items FOR UPDATE USING (true);


--
-- Name: pix_config Todos podem atualizar configurações PIX; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Todos podem atualizar configurações PIX" ON public.pix_config FOR UPDATE USING (true);


--
-- Name: ads_config Todos podem atualizar configurações de anúncios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Todos podem atualizar configurações de anúncios" ON public.ads_config FOR UPDATE USING (true);


--
-- Name: theme_config Todos podem atualizar configurações de tema; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Todos podem atualizar configurações de tema" ON public.theme_config FOR UPDATE USING (true);


--
-- Name: sessions Todos podem atualizar sessões; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Todos podem atualizar sessões" ON public.sessions FOR UPDATE USING (true);


--
-- Name: pix_config Todos podem criar configurações PIX; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Todos podem criar configurações PIX" ON public.pix_config FOR INSERT WITH CHECK (true);


--
-- Name: ads_config Todos podem criar configurações de anúncios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Todos podem criar configurações de anúncios" ON public.ads_config FOR INSERT WITH CHECK (true);


--
-- Name: theme_config Todos podem criar configurações de tema; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Todos podem criar configurações de tema" ON public.theme_config FOR INSERT WITH CHECK (true);


--
-- Name: sessions Todos podem criar sessões; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Todos podem criar sessões" ON public.sessions FOR INSERT WITH CHECK (true);


--
-- Name: pix_transactions Todos podem criar transações PIX; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Todos podem criar transações PIX" ON public.pix_transactions FOR INSERT WITH CHECK (true);


--
-- Name: sessions Todos podem deletar sessões; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Todos podem deletar sessões" ON public.sessions FOR DELETE USING (true);


--
-- Name: pix_transactions Todos podem deletar transações PIX; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Todos podem deletar transações PIX" ON public.pix_transactions FOR DELETE USING (true);


--
-- Name: pix_config Todos podem ler configurações PIX; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Todos podem ler configurações PIX" ON public.pix_config FOR SELECT USING (true);


--
-- Name: ads_config Todos podem ler configurações de anúncios; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Todos podem ler configurações de anúncios" ON public.ads_config FOR SELECT USING (true);


--
-- Name: theme_config Todos podem ler configurações de tema; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Todos podem ler configurações de tema" ON public.theme_config FOR SELECT USING (true);


--
-- Name: sessions Todos podem ler sessões; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Todos podem ler sessões" ON public.sessions FOR SELECT USING (true);


--
-- Name: pix_transactions Todos podem ler transações PIX; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Todos podem ler transações PIX" ON public.pix_transactions FOR SELECT USING (true);


--
-- Name: ad_items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ad_items ENABLE ROW LEVEL SECURITY;

--
-- Name: ads_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.ads_config ENABLE ROW LEVEL SECURITY;

--
-- Name: pix_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pix_config ENABLE ROW LEVEL SECURITY;

--
-- Name: pix_transactions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.pix_transactions ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: theme_config; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.theme_config ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--



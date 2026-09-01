CREATE OR REPLACE FUNCTION stampa_guard_bank_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF (NEW.bank_name IS DISTINCT FROM OLD.bank_name
      OR NEW.bank_last4 IS DISTINCT FROM OLD.bank_last4)
     AND current_setting('stampa.allow_bank_write', true) IS DISTINCT FROM 'on' THEN
    RAISE EXCEPTION 'bank fields are immutable'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
DROP TRIGGER IF EXISTS supplier_links_bank_immutable ON supplier_links;
--> statement-breakpoint
CREATE TRIGGER supplier_links_bank_immutable
  BEFORE UPDATE ON supplier_links
  FOR EACH ROW
  EXECUTE PROCEDURE stampa_guard_bank_update();

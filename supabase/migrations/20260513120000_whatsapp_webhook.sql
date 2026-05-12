-- Habilita a extensão pg_net para permitir requisições HTTP a partir do banco de dados
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Criação da função que será disparada pelo gatilho
CREATE OR REPLACE FUNCTION public.notify_whatsapp_alert()
RETURNS trigger AS $$
BEGIN
  -- Faz um POST assíncrono para a Edge Function assim que a notificação for gerada
  PERFORM net.http_post(
    url := 'https://epxpyxhlreqgvagsrqds.supabase.co/functions/v1/whatsapp-alert',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVweHB5eGhscmVxZ3ZhZ3NycWRzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM3ODg3MjAsImV4cCI6MjA4OTM2NDcyMH0.TZYrWYKPK65lKneThU2PQBEg6VJaMv4kTA9HqFh_y7Y'
    ),
    body := jsonb_build_object(
      'type', TG_OP,
      'table', TG_TABLE_NAME,
      'schema', TG_TABLE_SCHEMA,
      'record', row_to_json(NEW)::jsonb
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove o gatilho antigo caso exista (idempotência)
DROP TRIGGER IF EXISTS on_notification_created_whatsapp ON public.notifications;

-- Cria o gatilho que monitora a inserção de novas notificações
CREATE TRIGGER on_notification_created_whatsapp
  AFTER INSERT ON public.notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_whatsapp_alert();

import { supabase } from '@/lib/supabase/client'

/**
 * Serviço auxiliar para testar a conectividade da integração do WhatsApp pelo Front-End.
 * Pode ser vinculado a um botão "Testar Conexão WhatsApp" na interface administrativa.
 */
export const sendTestWhatsAppMessage = async () => {
  const { data, error } = await supabase.functions.invoke('whatsapp-alert', {
    body: {
      record: {
        title: 'Teste de Integração',
        message:
          'Esta é uma mensagem de teste do sistema JP Sistemas confirmando que a integração com o WhatsApp está funcionando perfeitamente! 🚀',
        type: 'TEST',
      },
    },
  })

  return { data, error }
}

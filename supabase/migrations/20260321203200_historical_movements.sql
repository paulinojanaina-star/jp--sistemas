DO $BODY$
DECLARE
  v_item_id uuid;
  v_user_id uuid;
  v_record RECORD;
BEGIN
  -- Identifica um usuário existente para atribuir a movimentação, garantindo a integridade referencial.
  SELECT id INTO v_user_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
  
  -- Itera sobre a lista extraída da imagem fornecida para carga do histórico de saídas.
  FOR v_record IN (
    SELECT * FROM (VALUES 
      ('ABAIXADOR DE LINGUA DE MADEIRA', 11),
      ('AGULHA DESCARTAVEL 13X4,5', 150),
      ('AGULHA DESCARTAVEL 25X7', 970),
      ('AGULHA DESCARTAVEL 25X8', 1012),
      ('AGULHA DESCARTAVEL 30X7', 266),
      ('AGULHA DESCARTAVEL 40X12', 850),
      ('ALCOOL 70%', 87),
      ('ALGODAO HIDROFILO 500G', 98),
      ('ATADURA DE CREPOM 15CM', 2216),
      ('BOTAO GASTRICO N18', 1),
      ('BOTAO GASTRICO N20', 1),
      ('CATETER NASAL TIPO OCULOS ADULTO', 4),
      ('CATETER ENDOVENOSO 24G COM DISPOSITIVO DE SEGURANÇA', 193),
      ('CATETER ENDOVENOSO 18G COM DISPOSITIVO DE SEGURANÇA', 16),
      ('CATETER ENDOVENOSO 20G COM DISPOSITIVO DE SEGURANÇA', 54),
      ('CATETER ENDOVENOSO 22G COM DISPOSITIVO DE SEGURANÇA', 169),
      ('COLETOR DE MATERIAL PERFUROCORTANTE 3 LT', 23),
      ('COLETOR DE MATERIAL PERFUROCORTANTE 13LT', 44),
      ('COLETOR URINARIO SISTEMA ABERTO', 33),
      ('COLETOR URINARIO SISTEMA FECHADO', 13),
      ('DIGLICONATO DE CLOREXIDINE 0,5%', 5),
      ('DIGLICONATO DE CLOREXIDINE 2%', 7),
      ('COMPRESSA DE GAZE 7,5X7,5 ESTERIL', 7547),
      ('ELETRODO P/ MONITORIZAÇÃO ECG', 800),
      ('EQUIPO MACROGOTAS C/ INJETOR LATERAL', 588),
      ('EQUIPO PARA NUTRICAO ENTERAL SIMPLES', 660),
      ('ESCOVA CERVICAL NAO ESTERIL', 2),
      ('ESPARADRAPO 10CMX4,5M', 93),
      ('ESPARADRAPO MICROPORE 5CMX10M', 100),
      ('ESPATULA DE AYRES DESCARTAVEL', 3),
      ('ESPECULO VAGINAL DESCARTAVEL GRANDE', 35),
      ('ESPECULO VAGINAL DESCARTAVEL MEDIO', 255),
      ('ESPECULO VAGINAL DESCARTAVEL PEQUENO', 229),
      ('FITA PARA GLICOSIMETRO COMPATIVEL COM (ON CALL PLUS II)', 78),
      ('FRASCO ALIMENTACAO ENTERAL 300ML', 790),
      ('GAZE TIPO QUEIJO 13 FIOS 08 DOBRAS', 27),
      ('GEL PARA ECG 100 G', 21),
      ('LAMINA P/ BISTURI Nº11', 216),
      ('LANCETA P/ GLICEMIA CAPILAR', 23),
      ('LUVA CIRURGICA ESTERIL N.6,5', 4),
      ('LUVA CIRURGICA ESTERIL N.7,0', 13),
      ('LUVA CIRURGICA ESTERIL N.7,5', 20),
      ('LUVA CIRURGICA ESTERIL N.8', 1),
      ('LUVA LATEX DESCARTAVEL N/ ESTERIL G', 14),
      ('LUVA LATEX DESCARTAVEL N/ESTERIL M', 93),
      ('LUVA LATEX DESCARTAVEL N/ESTERIL P', 39),
      ('LUVA LATEX DESCARTAVEL NAO ESTERIL PP', 2),
      ('LUVA PLASTICA DESCARTAVEL C/ 100 UNIDADES', 17),
      ('MASCARA CIRURGICA DESCASRTAVEL', 21),
      ('PAPEL CREPADO 50X50', 50),
      ('PINCA POZZI', 30),
      ('PINCA DE CHERON', 65),
      ('P.V.P.I TOPICO', 2),
      ('P.V.P.I DEGERMANTE', 1),
      ('PAPEL LENCOL 50 CM X 50M', 123),
      ('PAPEL P/ELETROCARDIOGRAFO CARDIOCARE 2000/BIONET', 11),
      ('SCALP PARA INFUSAO Nº 19 COM DISPOSITIVO DE SEGURANÇA', 7),
      ('SCALP PARA INFUSAO Nº 21 COM DISPOSITIVO DE SEGURANÇA', 222),
      ('SCALP PARA INFUSAO Nº 23 COM DISPOSITIVO DE SEGURANÇA', 186),
      ('SERINGA DESCARTAVEL 10ML COM BICO TIPO LUER LOCK', 12),
      ('SERINGA DESCARTAVEL SEM AGULHA 10ML, COM BICO LUER SLIP', 312),
      ('SERINGA DESCARTAVEL 20ML C/AGULHA 25GAX7MM LUER LOCK', 30),
      ('SERINGA DESCARTAVEL S/AGULHA 20ML BICO TIPO LUER LOCK', 305),
      ('SERINGA DESCARTAVEL SEM AGULHA 20ML, COM BICO LUER SLIP', 411),
      ('SERINGA DESCARTÁVEL 3 ML S AGULHA LUER LOCK', 1462),
      ('SERINGA DESCARTÁVEL 3 ML COM AGULHA 25X7 MM BICO LUER S', 220),
      ('SERINGA DESCARTAVEL 5ML C/AGULHA 25X7', 955),
      ('SONDA P/NUTRICAO ENTERAL ADULTO 12FR', 8),
      ('SONDA VESICAL DE DEMORA FOLEY N 14', 4),
      ('SONDA VESICAL DE DEMORA FOLEY FOLEY N 16', 2),
      ('SONDA VESICAL DE DEMORA FOLEY FOLEY N 18', 10),
      ('SONDA VESICAL DE DEMORA FOLEY FOLEY N 20', 2),
      ('SONDA URETRAL N.06', 240),
      ('SONDA URETRAL N.08', 1),
      ('SONDA URETRAL N.10', 212),
      ('SONDA URETRAL N.12', 1902),
      ('SONDA URETRAL N.14', 410),
      ('SORO 250ML', 369),
      ('SORO 500 ML', 308),
      ('SORO 100 ML', 150)
    ) AS t(name, quantity)
  )
  LOOP
    -- Tenta encontrar o item pelo nome exato ou aproximado
    SELECT id INTO v_item_id FROM public.items WHERE name ILIKE v_record.name LIMIT 1;
    
    IF v_item_id IS NULL THEN
      SELECT id INTO v_item_id FROM public.items WHERE name ILIKE '%' || v_record.name || '%' LIMIT 1;
    END IF;

    -- Se o item foi encontrado na base, insere a movimentação histórica
    IF v_item_id IS NOT NULL THEN
      -- Garante que a migração é idempotente e não insere o mesmo histórico duas vezes
      IF NOT EXISTS (
        SELECT 1 FROM public.movements 
        WHERE item_id = v_item_id AND quantity = v_record.quantity AND notes = 'Carga de Histórico (Importação)'
      ) THEN
        
        -- Tentativa encadeada para lidar com possíveis variações no tipo enumerado da tabela de movimentações ('out', 'OUT', 'saída')
        BEGIN
          INSERT INTO public.movements (item_id, type, quantity, user_id, notes, created_at)
          VALUES (v_item_id, 'out', v_record.quantity, v_user_id, 'Carga de Histórico (Importação)', now() - interval '3 months');
        EXCEPTION WHEN OTHERS THEN
          BEGIN
            INSERT INTO public.movements (item_id, type, quantity, user_id, notes, created_at)
            VALUES (v_item_id, 'OUT', v_record.quantity, v_user_id, 'Carga de Histórico (Importação)', now() - interval '3 months');
          EXCEPTION WHEN OTHERS THEN
            BEGIN
              INSERT INTO public.movements (item_id, type, quantity, user_id, notes, created_at)
              VALUES (v_item_id, 'saída', v_record.quantity, v_user_id, 'Carga de Histórico (Importação)', now() - interval '3 months');
            EXCEPTION WHEN OTHERS THEN
              NULL;
            END;
          END;
        END;

      END IF;
    END IF;

  END LOOP;
END $BODY$;

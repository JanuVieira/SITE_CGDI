%% ============================================================
%% MAPA DE NAVEGAÇÃO — "INPI para empreender e inovar" — v6 FINAL
%% Data: 2026-10-13 · 39 páginas verificadas (HTTP 200) · 121 arestas
%% ------------------------------------------------------------
%% LEGENDA — cores dos nós:
%%   Azul escuro   = HOME
%%   Azul claro    = páginas de consulta (J1, J6, J8, J9)
%%   Lilás         = jornada de conteúdo (J2: novos formatos, trilha, cards)
%%   Laranja       = eventos (J3)
%%   Verde         = solicitações/programas (J4 mentorias, J5 palestras)
%%   Ciano         = agendamento presencial (J7)
%%   Cinza         = saídas externas [EXT]
%%   Verde-claro   = downloads [PDF] / [ICS]
%%   Amarelo       = e-mails [EMAIL]
%%   Vermelho      = dead-end [ERRO] e suspensões ⚠
%%   Rosa-claro    = imagens clicáveis [IMG]
%% Aresta tracejada (-.->) = percurso após sair do portal
%% ============================================================

flowchart TD
    P00["🏠 HOME — INPI para empreender e inovar"]

    %% ============ J1 · PAINEL INTERATIVO ============
    P00 -->|"L001 'Saiba mais' [301]"| P01["📊 P01 — INPI IMPACT DASH"]
    P01 --> EXT01["[EXT] Power BI"]
    P01 --> EXT02["[EXT] INPIDRIVE"]
    P01 --> PDF01["[PDF] irradiar-2025.pdf"]
    P01 --> PDF02["[PDF] portarias IRRADIAR.pdf"]
    P01 --> P17["[URL] P17 — Relatórios"]

    %% ============ J2 · PI EM NOVOS FORMATOS ============
    P00 -->|"L002 'Saiba mais'"| P02["🎬 P02 — PI em novos formatos"]
    P02 --> P14["[URL] P14 — Cartilhas"]
    P14 --> PDF03["[PDF] cartilha ABES"]
    P14 --> PDF04["[PDF] cartilha PGESP"]
    P02 --> P12["[URL] P12 — Quadrinhos e Gibis"]
    P02 --> P13["[URL] P13 — Ranking software"]
    P13 --> PDF05["[PDF] folheto software"]
    P02 --> P11["[URL] P11 — Vídeos-Cápsulas 2026"]
    P11 --> EXT15["[EXT] INPIDRIVE — vídeos"]

    %% Trilha 1-7
    P02 -->|"L017"| P09["🧭 P09 — Jornada de PI para Startups"]
    P09 --> P20["[URL] 1 · Identificar"]
    P09 --> P21["[URL] 2 · Marcas"]
    P09 --> P22["[URL] 3 · Programa de Computador"]
    P09 --> P23["[URL] 4 · Patente"]
    P09 --> P24["[URL] 5 · Desenho Industrial"]
    P09 --> P25["[URL] 6 · Internacionalização"]
    P09 --> P26["[URL] 7 · Estratégias"]

    %% Cards
    P02 -->|"L016"| P10["🗂️ P10 — Guias Rápidos"]
    P10 --> P27["[URL] Quem pode ser mentorado"]
    P10 --> P28["[URL] Como acompanhar seu pedido ⚠slug"]
    P10 --> P29["[URL] Nova tabela de retribuições"]
    P10 --> P30["[URL] Registrar seu software ⚠slug"]
    P10 --> P31["[URL] Patentes verdes"]

    %% ============ J3 · CALENDÁRIO DE EVENTOS ============
    P00 -->|"L003 'Saiba mais' [301]"| P03["📅 P03 — Calendário de eventos"]
    P03 --> ICS01["[ICS] iCal do calendário"]
    P03 --> P32["[URL] P32 · II Seminário Inova CCB"]
    P03 --> P33["[URL] P33 · PI estratégia de negócios"]
    P03 --> P34["[URL] P34 · Sua Inovação protegida?"]
    P03 --> P35["[URL] P35 · Registro Marcas/Patentes"]
    P03 --> P36["[URL] P36 · Software e Patente"]
    P03 --> P37["[URL] P37 · Transformar (IA)"]
    P03 --> P38["[URL] P38 · Pesquisa vira Inovação"]

    P32 -->|"L024"| EXT03["[EXT] Google Forms"]
    P32 -->|"L025"| ICS02["[ICS] .ics por evento"]
    P33 -->|"L026"| EXT04["[EXT] Microsoft Forms"]
    P34 -->|"L027"| EXT05["[EXT] Sympla"]
    P35 -->|"L028"| EXT03
    P36 -->|"L029"| EXT06["[EXT] UNEMAT"]
    P37 -->|"L030"| ERRO01["❌ [ERRO] P37 sem link de inscrição"]
    P38 -->|"L031"| EXT07["[EXT] Unitins ⚠ exige login"]

    %% ============ J4 · MENTORIAS ============
    P00 -->|"L004 'Saiba mais' [301]"| P04["🧭 P04 — Mentorias · 8 etapas"]
    P04 --> EXT08["[EXT] Moodle — Salas Facilitadores/Mentorandos"]
    P04 --> EXT09["[EXT] YouTube — fluxograma"]
    P04 --> PIO01["[URL·outro setor] Trâmite prioritário de marcas"]

    %% ============ J5 · PALESTRAS ============
    P00 -->|"L005 'Saiba mais' [301]"| P05["🎤 P05 — Palestras"]
    P05 --> EXT10["[EXT] LimeSurvey — Formulário"]
    P05 --> MAIL01["[EMAIL] diadd@inpi.gov.br"]

    %% ============ J6 · COOPERAÇÃO TÉCNICA ============
    P00 -->|"L006 'Saiba mais'"| P06["🤝 P06 — Cooperação Técnica Nacional"]
    P06 --> P15["[URL] P15 — ACTs 2025"]
    P06 --> P16["[URL] P16 — ACTs 2026"]
    P06 --> PIO02["[URL·outro setor] Acordos vigentes/não vigentes"]
    P06 --> MAIL02["[EMAIL] dicop@inpi.gov.br"]

    %% ============ J7 · ATENDIMENTO PRESENCIAL ============
    P00 -->|"L007 'Saiba mais'"| P07["🏛️ P07 — Atendimento nas SRPIs"]
    P07 --> EXT13a["[EXT] Calendly Norte (Manaus)"]
    P07 --> EXT13b["[EXT] Calendly Nordeste ⚠ SUSPENSO"]
    P07 --> EXT13c["[EXT] Calendly C.-Oeste (Brasília)"]
    P07 --> EXT13d["[EXT] Calendly Sudeste (SP)"]
    P07 --> EXT13e["[EXT] Calendly Sul (Florianópolis)"]
    P07 --> PIO03["[URL·outro setor] Plataforma Integrada"]

    %% 4 passos no Calendly
    EXT13a -.-> ST1["1 · Escolher data (1-15 dias úteis)"]
    EXT13c -.-> ST1
    EXT13d -.-> ST1
    EXT13e -.-> ST1
    ST1 --> ST2["2 · Escolher horário (30 min)"]
    ST2 --> ST3["3 · Informar dados"]
    ST3 --> ST4["4 · Confirmar"]
    ST4 --> SAIDA01["✅ SAÍDA: e-mail Calendly + anexo [ICS]"]

    %% ============ J8 · FEDERAÇÕES E SECRETARIAS ============
    P00 -->|"L008 'Saiba mais'"| P08["🏭 P08 — Federações e Secretarias"]
    P08 --> P18["[URL] P18 — Programas de PI"]
    P18 --> P18a["[URL] 5 subpáginas Secretarias (MS, BA, DF, ES, MT)"]
    P18 --> P18b["[IMG] 30 tarjas PNG clicáveis"]
    P08 --> P19["[URL] P19 — Matérias"]
    P19 --> PIO04["[URL·outro setor] 3 notícias"]
    P08 --> MAIL03["[EMAIL] cgdi@inpi.gov.br"]

    %% ============ J9 · INPI NOS ESTADOS ============
    P00 -->|"L009 · mapa SVG · 27 UFs"| PNE["🗺️ Listagem por UF (×27)"]
    PNE --> NOT["[URL] Notícia do estado → leitura (fim)"]

    %% ============ CORES ============
    %% HOME
    style P00 fill:#1351B4,color:#ffffff,stroke:#0c3a7d,stroke-width:3px
    %% Consulta (J1, J6, J8, J9) — azul claro
    style P01 fill:#d6e4ff,stroke:#1351B4
    style P17 fill:#d6e4ff,stroke:#1351B4
    style P06 fill:#d6e4ff,stroke:#1351B4
    style P15 fill:#d6e4ff,stroke:#1351B4
    style P16 fill:#d6e4ff,stroke:#1351B4
    style P08 fill:#d6e4ff,stroke:#1351B4
    style P18 fill:#d6e4ff,stroke:#1351B4
    style P18a fill:#d6e4ff,stroke:#1351B4
    style P19 fill:#d6e4ff,stroke:#1351B4
    style PNE fill:#d6e4ff,stroke:#1351B4
    style NOT fill:#d6e4ff,stroke:#1351B4
    %% Conteúdo (J2) — lilás
    style P02 fill:#e8daef,stroke:#6a3fb5
    style P14 fill:#e8daef,stroke:#6a3fb5
    style P12 fill:#e8daef,stroke:#6a3fb5
    style P13 fill:#e8daef,stroke:#6a3fb5
    style P11 fill:#e8daef,stroke:#6a3fb5
    style P09 fill:#e8daef,stroke:#6a3fb5,stroke-width:2px
    style P10 fill:#e8daef,stroke:#6a3fb5,stroke-width:2px
    style P20 fill:#f5eef8,stroke:#6a3fb5
    style P21 fill:#f5eef8,stroke:#6a3fb5
    style P22 fill:#f5eef8,stroke:#6a3fb5
    style P23 fill:#f5eef8,stroke:#6a3fb5
    style P24 fill:#f5eef8,stroke:#6a3fb5
    style P25 fill:#f5eef8,stroke:#6a3fb5
    style P26 fill:#f5eef8,stroke:#6a3fb5
    style P27 fill:#f5eef8,stroke:#6a3fb5
    style P28 fill:#f5eef8,stroke:#6a3fb5
    style P29 fill:#f5eef8,stroke:#6a3fb5
    style P30 fill:#f5eef8,stroke:#6a3fb5
    style P31 fill:#f5eef8,stroke:#6a3fb5
    %% Eventos (J3) — laranja
    style P03 fill:#fdebd0,stroke:#c0392b,stroke-width:2px
    style P32 fill:#fdebd0,stroke:#c0392b
    style P33 fill:#fdebd0,stroke:#c0392b
    style P34 fill:#fdebd0,stroke:#c0392b
    style P35 fill:#fdebd0,stroke:#c0392b
    style P36 fill:#fdebd0,stroke:#c0392b
    style P37 fill:#fdebd0,stroke:#c0392b
    style P38 fill:#fdebd0,stroke:#c0392b
    %% Solicitações/programas (J4, J5) — verde
    style P04 fill:#d5f5e3,stroke:#1e8449,stroke-width:2px
    style P05 fill:#d5f5e3,stroke:#1e8449,stroke-width:2px
    %% Agendamento (J7) — ciano
    style P07 fill:#d1f2eb,stroke:#21618c,stroke-width:2px
    style ST1 fill:#d1f2eb,stroke:#21618c
    style ST2 fill:#d1f2eb,stroke:#21618c
    style ST3 fill:#d1f2eb,stroke:#21618c
    style ST4 fill:#d1f2eb,stroke:#21618c
    %% Saídas externas — cinza
    style EXT01 fill:#e0e0e0,stroke:#7f8c8d
    style EXT02 fill:#e0e0e0,stroke:#7f8c8d
    style EXT03 fill:#e0e0e0,stroke:#7f8c8d
    style EXT04 fill:#e0e0e0,stroke:#7f8c8d
    style EXT05 fill:#e0e0e0,stroke:#7f8c8d
    style EXT06 fill:#e0e0e0,stroke:#7f8c8d
    style EXT07 fill:#e0e0e0,stroke:#7f8c8d
    style EXT08 fill:#e0e0e0,stroke:#7f8c8d
    style EXT09 fill:#e0e0e0,stroke:#7f8c8d
    style EXT10 fill:#e0e0e0,stroke:#7f8c8d
    style EXT15 fill:#e0e0e0,stroke:#7f8c8d
    style EXT13a fill:#e0e0e0,stroke:#7f8c8d
    style EXT13c fill:#e0e0e0,stroke:#7f8c8d
    style EXT13d fill:#e0e0e0,stroke:#7f8c8d
    style EXT13e fill:#e0e0e0,stroke:#7f8c8d
    %% Páginas de outro setor do portal — cinza-azulado
    style PIO01 fill:#e8e8e8,stroke:#7f8c8d
    style PIO02 fill:#e8e8e8,stroke:#7f8c8d
    style PIO03 fill:#e8e8e8,stroke:#7f8c8d
    style PIO04 fill:#e8e8e8,stroke:#7f8c8d
    %% Downloads — verde-claro
    style PDF01 fill:#d9ead3,stroke:#1e8449
    style PDF02 fill:#d9ead3,stroke:#1e8449
    style PDF03 fill:#d9ead3,stroke:#1e8449
    style PDF04 fill:#d9ead3,stroke:#1e8449
    style PDF05 fill:#d9ead3,stroke:#1e8449
    style ICS01 fill:#d9ead3,stroke:#1e8449
    style ICS02 fill:#d9ead3,stroke:#1e8449
    %% E-mails — amarelo
    style MAIL01 fill:#fff2cc,stroke:#b7950b
    style MAIL02 fill:#fff2cc,stroke:#b7950b
    style MAIL03 fill:#fff2cc,stroke:#b7950b
    %% Erros e suspensões — vermelho
    style ERRO01 fill:#ffcccc,stroke:#c0392b,stroke-width:2px
    style EXT13b fill:#f2d7d5,stroke:#c0392b,stroke-width:2px
    %% Imagens clicáveis — rosa-claro
    style P18b fill:#ead1dc,stroke:#a64b78
    %% Saída transacional
    style SAIDA01 fill:#e6efff,stroke:#1351B4,stroke-width:2px


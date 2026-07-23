-- ============================================================
-- PLANTEL — Schema completo
-- ============================================================


-- ── 1. GAIOLAS ──────────────────────────────────────────────
create table gaiolas (
                         id           uuid primary key default gen_random_uuid(),
                         numero       text not null,
                         localizacao  text,
                         descricao    text,
                         created_at   timestamptz default now()
);


-- ── 2. AVES ─────────────────────────────────────────────────
create table aves (
                      id           uuid primary key default gen_random_uuid(),
                      nome         text not null,
                      especie      text default 'Canário',
                      anilha       text,
                      sexo         text default 'Macho',        -- Macho | Fêmea | Indefinido
                      nascimento   date,
                      status       text default 'Ativo',        -- Ativo | Chocando | Filhote | Vendido | Falecido
                      gaiola_id    uuid references gaiolas(id) on delete set null,
                      proprietario text,
                      contato      text,
                      registro     text,
                      obs          text,
                      created_at   timestamptz default now()
);


-- ── 3. POSTURAS ─────────────────────────────────────────────
create table posturas (
                          id               uuid primary key default gen_random_uuid(),
                          gaiola_id        uuid references gaiolas(id) on delete set null,
                          ave_femea_id     uuid references aves(id) on delete set null,
                          ave_macho_id     uuid references aves(id) on delete set null,
                          anel_mc          text,
                          anel_fm          text,
                          postura_em       date,
                          inicio_choco_em  date,
                          nascidos_em      date,
                          anel_fts         text,
                          obs              text,
                          created_at       timestamptz default now()
);


-- ── 4. OVOS ─────────────────────────────────────────────────
create table ovos (
                      id          uuid primary key default gen_random_uuid(),
                      postura_id  uuid not null references posturas(id) on delete cascade,
                      numero      integer not null,
                      status      text default 'Aguardando ovoscopia',
    -- Aguardando ovoscopia | Fértil | Infértil | Nascido | Morto no ovo
                      created_at  timestamptz default now()
);


-- ── 5. AGENDA ───────────────────────────────────────────────
create table agenda (
                        id          uuid primary key default gen_random_uuid(),
                        titulo      text not null,
                        tipo        text default 'Outro',
    -- Ovoscopia | Anilhamento | Vacinação | Medicação | Visita veterinária | Limpeza | Outro
                        data        date,
                        hora        time,
                        prioridade  text default 'Normal',        -- Alta | Normal | Baixa
                        ave_id      uuid references aves(id) on delete set null,
                        obs         text,
                        concluido   boolean default false,
                        created_at  timestamptz default now()
);


-- ============================================================
-- ROW LEVEL SECURITY
-- Cada usuário só vê os próprios dados
-- ============================================================

alter table gaiolas  enable row level security;
alter table aves     enable row level security;
alter table posturas enable row level security;
alter table ovos     enable row level security;
alter table agenda   enable row level security;

-- Coluna user_id em cada tabela
alter table gaiolas  add column user_id uuid references auth.users(id) default auth.uid();
alter table aves     add column user_id uuid references auth.users(id) default auth.uid();
alter table posturas add column user_id uuid references auth.users(id) default auth.uid();
alter table ovos     add column user_id uuid references auth.users(id) default auth.uid();
alter table agenda   add column user_id uuid references auth.users(id) default auth.uid();

-- Policies: usuário só acessa suas próprias linhas
create policy "gaiolas: dono" on gaiolas  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "aves: dono"    on aves     for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "posturas: dono"on posturas for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "ovos: dono"    on ovos     for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "agenda: dono"  on agenda   for all using (auth.uid() = user_id) with check (auth.uid() = user_id);


-- ============================================================
-- ÍNDICES (performance)
-- ============================================================

create index on aves     (gaiola_id);
create index on aves     (user_id);
create index on posturas (ave_femea_id);
create index on posturas (ave_macho_id);
create index on posturas (gaiola_id);
create index on posturas (user_id);
create index on ovos     (postura_id);
create index on agenda   (data);
create index on agenda   (user_id);
# ⚽ CRF Manager 3.0

Aplicação web profissional para gestão de equipas de Futsal, desenhada para ser utilizada em telemóveis e tablets à beira do campo.

## ✨ Funcionalidades

*   **Quadro Tático Interativo:** Movimenta jogadores e bola num campo virtual.
*   **Marcador ao Vivo:** Tempo de jogo, golos e gestão de faltas/eventos.
*   **Gestão de Plantel:** Adiciona jogadores, fotos e números.
*   **Convocatória Automática:** Cria equipas equilibradas (Fill vs Gus) e copia a lista para o WhatsApp.
*   **Estatísticas:** Tabela de melhores marcadores e assistências automática.
*   **Modo Online vs Offline:** Sincronização em tempo real (com Supabase) ou modo local (Demo).

## 🚀 Como Colocar Online (Passo a Passo)

Para que a App funcione em todos os telemóveis ao mesmo tempo, precisas de uma Base de Dados.

### 1. Criar a Base de Dados (Gratuito)
1.  Vai a [supabase.com](https://supabase.com) e cria uma conta ("Start your project").
2.  Cria um novo projeto.
3.  No menu lateral esquerdo, clica em **SQL Editor**.
4.  Cria uma "New Query", cola o seguinte código e clica em **RUN**:

```sql
create table match_data (
  id text primary key,
  content jsonb
);

alter table match_data enable row level security;

create policy "Permitir tudo" on match_data
for all using (true) with check (true);

insert into match_data (id, content) values ('live_match', '{}');
```

### 2. Pegar nas Chaves
1.  Ainda no Supabase, vai a **Settings (Roda Dentada)** no fundo do menu esquerdo.
2.  Clica em **API**.
3.  Vais precisar de copiar dois valores:
    *   **Project URL**
    *   **anon public key**

### 3. Configurar na Vercel
1.  No teu projeto na Vercel, vai a **Settings** -> **Environment Variables**.
2.  Adiciona as seguintes variáveis:
    *   `VITE_SUPABASE_URL`: (Cola o Project URL do passo anterior)
    *   `VITE_SUPABASE_ANON_KEY`: (Cola a anon key do passo anterior)
    *   `COACH_PASSWORD`: (Define uma password para o treinador, ex: `222222`)
3.  Vai ao separador **Deployments** e faz **Redeploy** (ou faz um novo commit no GitHub).

## 🛠️ Tecnologias

*   React 19
*   Vite
*   TailwindCSS
*   Supabase (Realtime Database)

---
Desenvolvido para o CRF Futsal.
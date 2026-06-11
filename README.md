# Calendário Copa 2026

Aplicação React para consultar e exibir o calendário da Copa do Mundo FIFA 2026 usando o football-data.org.

## Como rodar

1. Instale as dependências:

```bash
npm install
```

2. Crie o arquivo `.env` a partir do exemplo:

```bash
cp .env.example .env
```

3. Preencha `FOOTBALL_DATA_TOKEN` com seu token do football-data.org.

4. Rode o projeto:

```bash
npm run dev
```

Abra `http://localhost:5173`.

## API usada

O servidor local e a Netlify Function consultam:

```txt
GET https://api.football-data.org/v4/competitions/WC/matches?season=2026
```

O token fica apenas no backend local ou no ambiente do Netlify, enviado no header `X-Auth-Token`.

## Deploy no Netlify

O deploy usa `netlify.toml` para publicar `dist` e redirecionar:

```txt
/api/world-cup-fixtures -> /.netlify/functions/world-cup-fixtures
```

No painel do Netlify, cadastre a variável:

```txt
FOOTBALL_DATA_TOKEN=seu_token_do_football_data
```

Marque como variável secreta/sensível se a opção aparecer. Não envie o arquivo `.env` para o repositório.

## Recursos

- Datas e horários formatados em `pt-BR`.
- Fuso horário fixo em `America/Sao_Paulo`.
- Bandeiras/escudos dos times retornados pelo football-data.org.
- Filtro por seleção, estádio ou fase.
- Filtro por fase/rodada da competição.
- Cache local simples para reduzir chamadas repetidas à API.
- PWA instalável pelo navegador do celular.

## Instalar no celular

Depois do deploy, abra a URL no navegador do celular.

- Android/Chrome: use a opção `Instalar app` ou `Adicionar à tela inicial`.
- iPhone/Safari: use `Compartilhar > Adicionar à Tela de Início`.

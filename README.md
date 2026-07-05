# 🌤️ Clima

### Painel de Clima

<p align="center">
  <img src="./assets/screenshots/home.png" alt="Tela principal do Clima" width="900">
</p>

<p align="center">
  <img src="https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white" alt="HTML5">
  <img src="https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white" alt="CSS3">
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript">
  <img src="https://img.shields.io/badge/API-Open--Meteo-blue?style=for-the-badge" alt="Open-Meteo API">
  <img src="https://img.shields.io/badge/PWA-ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white" alt="PWA">
</p>

Painel de clima em tempo real desenvolvido com **JavaScript puro** (sem frameworks), consumindo APIs públicas e gratuitas — nenhuma delas exige chave de API.

---

## Índice

- [Sobre](#sobre)
- [Funcionalidades](#funcionalidades)
- [Screenshots](#screenshots)
- [Tecnologias](#tecnologias)
- [APIs utilizadas](#apis-utilizadas)
- [Como executar](#como-executar)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Deploy](#deploy)
- [Aprendizados](#aprendizados)
- [Licença](#licença)

---

## Sobre

O **Clima** é um painel de clima construído do zero, sem bibliotecas de UI ou frameworks — só HTML, CSS e JavaScript. O objetivo foi ir além de um projeto de portfólio comum: além de mostrar temperatura, o app tem um elemento visual assinatura (o "sky arc", que traça a posição real do sol/lua no céu), fundo dinâmico por condição climática, gráfico desenhado à mão em Canvas, PWA instalável e persistência local de favoritos e histórico.

## Funcionalidades

- ✅ Busca de cidades com autocomplete
- ✅ Geolocalização (com nome real da cidade via reverse geocoding)
- ✅ Favoritos (localStorage)
- ✅ Histórico de buscas (localStorage)
- ✅ Temperatura atual e sensação térmica
- ✅ Umidade, pressão e visibilidade
- ✅ Vento com direção (bússola)
- ✅ Índice UV
- ✅ Qualidade do ar (AQI)
- ✅ Chance de chuva e nascer/pôr do sol
- ✅ Gráfico de temperatura das próximas 24h (Canvas puro)
- ✅ Previsão horária e de 5 dias
- ✅ Mapa da localização
- ✅ Compartilhamento da previsão (Web Share API)
- ✅ Alternância °C / °F
- ✅ PWA instalável (funciona offline)
- ✅ Interface 100% responsiva

## Screenshots

> Substitua os placeholders abaixo pelas suas próprias capturas de tela (salve em `assets/screenshots/`).

| Home | Busca de cidade |
|---|---|
| ![Home](./assets/screenshots/home.png) | ![Busca](./assets/screenshots/search.png) |

| Mapa | Modo chuva |
|---|---|
| ![Mapa](./assets/screenshots/map.png) | ![Chuva](./assets/screenshots/rain-mode.png) |

## Tecnologias

- HTML5
- CSS3
- JavaScript ES6+
- Canvas API
- Fetch API
- Service Worker
- LocalStorage
- Web Share API
- Open-Meteo API

## APIs utilizadas

| API | Uso | Chave necessária |
|---|---|---|
| [Open-Meteo Forecast](https://open-meteo.com/) | Clima atual, horário e diário | Não |
| [Open-Meteo Geocoding](https://open-meteo.com/en/docs/geocoding-api) | Busca de cidades | Não |
| [Open-Meteo Air Quality](https://open-meteo.com/en/docs/air-quality-api) | Qualidade do ar (US AQI) | Não |
| [BigDataCloud Reverse Geocoding](https://www.bigdatacloud.com/geocoding-apis/free-reverse-geocode-to-city-api) | Nome da cidade via geolocalização | Não |
| [OpenStreetMap](https://www.openstreetmap.org/) | Mapa embutido | Não |

## Como executar

Como o projeto usa `fetch` e um service worker, os arquivos precisam ser servidos via HTTP (não abrir com `file://`).

```bash
# Opção 1 — Python
cd clima-dashboard
python3 -m http.server 8080
# acesse http://localhost:8080

# Opção 2 — Node
npx serve clima-dashboard
```

Ou use a extensão **Live Server** no VS Code.

## Estrutura do projeto

```
clima-dashboard/
├── index.html          # Estrutura da página
├── css/
│   └── style.css       # Design tokens, layout, animações
├── js/
│   └── script.js        # APIs, estado, renderização e persistência
├── manifest.json         # Configuração do PWA
├── sw.js                  # Service worker (cache offline)
├── icon.svg               # Ícone do app
└── README.md
```

## Deploy

🔗 **[https://seuusuario.github.io/clima-dashboard/](https://seuusuario.github.io/clima-dashboard/)**

> Publique gratuitamente pelo GitHub Pages: `Settings → Pages → Branch: main → Save`, e substitua o link acima pela URL gerada.

## Aprendizados

Durante o desenvolvimento deste projeto, pratiquei:

- Consumo de APIs REST (fetch + async/await)
- Combinação de múltiplas APIs (clima, geocoding, qualidade do ar, mapa)
- Persistência de dados com LocalStorage
- Desenho de gráficos com Canvas API
- Service Workers e Progressive Web Apps (PWA)
- Manipulação e atualização dinâmica do DOM
- Web Share API e Geolocation API
- Design responsivo e acessibilidade (foco visível, `prefers-reduced-motion`)

## Licença

Este projeto foi desenvolvido para fins de estudo e portfólio. Dados climáticos sob licença [CC BY 4.0 (Open-Meteo)](https://creativecommons.org/licenses/by/4.0/). Mapa © colaboradores do OpenStreetMap.

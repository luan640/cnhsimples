# CNH Simples — Banco de Imagens

> Todas as imagens abaixo são gratuitas para uso comercial (Unsplash License / Pixabay License).
> Nenhuma atribuição obrigatória, mas recomendada.

---

## Estratégia por Seção da Homepage

| Seção | Tipo de imagem | Tom |
|-------|---------------|-----|
| Hero | Instrutor + aluno interagindo dentro do carro | Caloroso, confiante, humano |
| Social proof | Aluno sorrindo ao volante (conquista) | Alegre, realização |
| "Como funciona" | Ícones Lucide (sem foto) | — |
| Instrutores em destaque | Foto de perfil de cada instrutor (upload) | — |
| CTA Instrutor | Instrutor do lado de fora do carro, seguro | Profissional |
| Depoimentos | Avatar/rosto do aluno depoente | Real, próximo |
| Background geral | Rua de cidade brasileira (sutil, desfocado) | Local |

---

## Imagens Confirmadas — Unsplash (gratuitas, sem atribuição)

### 🥇 HERO — Principal (instrutor ensinando aluna)

**Foto 1 — Instrutor homem ensinando jovem aluna (nervosa, primeira aula)**
- Página: https://unsplash.com/photos/happy-male-instructor-smiling-and-teaching-a-teenage-girl-student-to-drive-adolescent-girl-feeling-nervous-during-her-first-driving-lesson-rVFlPceH4gA
- ID Unsplash: `rVFlPceH4gA`
- Uso: **Hero da homepage** — imagem principal ao lado do headline
- Tom: calor humano, instrução, primeira vez ao volante

**Foto 2 — Mulher ao volante com homem (instrutor) ao fundo**
- Página: https://unsplash.com/photos/a-woman-driving-a-car-with-a-man-behind-her-O6_DXjYTO9A
- ID Unsplash: `O6_DXjYTO9A`
- Uso: **Alternativa para o hero** ou seção "Como funciona"
- Tom: instrutor acompanhando, aluna no controle

---

### 🚗 ALUNO — Conquista / Social Proof

**Foto 3 — Jovem mulher confiante ao volante (sorrindo)**
- Página: https://unsplash.com/photos/beautiful-young-confident-woman-driving-a-car-zcUqj16aWE0
- ID Unsplash: `zcUqj16aWE0`
- Uso: Card de depoimento / seção social proof
- Tom: conquista, autoconfiança, resultado

---

### 🏙️ CONTEXTO — Ruas brasileiras (fundo/backdrop)

**Foto 4 — Rua movimentada com carros, Campinas-SP (Lucas Lopes)**
- Página: https://unsplash.com/photos/a-city-street-with-cars-and-people-YFdgQ8dSCbI
- ID Unsplash: `YFdgQ8dSCbI`
- Uso: Background desfocado de seção ou imagem de contexto geográfico
- Tom: urbano brasileiro, cotidiano

**Foto 5 — Rua com cerca e construções, João Pessoa-PB (Brasil)**
- Página: https://unsplash.com/photos/a-street-with-a-fence-and-buildings-WDUu_eHNRYI
- ID Unsplash: `WDUu_eHNRYI`
- Uso: Background alternativo de seção
- Tom: nordeste brasileiro, cidades do interior

**Foto 6 — Avenida noturna, São Paulo (Carlos Kenobi)**
- Página: https://unsplash.com/photos/BU8ORcUI9rQ
- ID Unsplash: `BU8ORcUI9rQ`
- Uso: Background da seção CTA Instrutor (dark + imagem de rua)
- Tom: urbano, moderno, noturno

---

## Imagens Confirmadas — Pixabay (gratuitas, sem atribuição)

**Foto 7 — Instrutores de direção + aluno (foto clássica de aula)**
- Página: https://pixabay.com/photos/driving-instructors-driving-lessons-380066/
- ID: `380066`
- Uso: Seção "Como funciona" ou card de instrutor de exemplo
- Licença: Pixabay License (gratuita, uso comercial)

**Foto 8 — Autoescola, carro nas ruas (exterior, carro em movimento)**
- Página: https://pixabay.com/photos/driving-school-driving-a-car-streets-1819155/
- ID: `1819155`
- Uso: Seção de contexto / background
- Licença: Pixabay License

**Foto 9 — Interior de carro (painel, volante, ponto de vista do motorista)**
- Página: https://pixabay.com/photos/car-car-interior-driving-car-auto-3588679/
- ID: `3588679`
- Uso: Card ilustrativo de "aula prática"
- Licença: Pixabay License

**Foto 10 — Táxi / transporte / instrutor ensinando motorista**
- Página: https://pixabay.com/photos/taxi-transport-teaches-driver-1161124/
- ID: `1161124`
- Uso: Alternativa para hero ou card de instrutor
- Licença: Pixabay License

---

## Links de Busca para Expansão

Se precisar de mais imagens, busque diretamente nestes links:

| Plataforma | Busca | Link |
|------------|-------|------|
| Unsplash | Driving instructor | https://unsplash.com/s/photos/driving-instructor |
| Unsplash | Driving lesson | https://unsplash.com/s/photos/driving-lesson |
| Unsplash | Learning to drive | https://unsplash.com/s/photos/learning-to-drive |
| Unsplash | Student driver | https://unsplash.com/s/photos/student-driver |
| Pixabay | Driving instructor | https://pixabay.com/photos/search/driving%20instructor/ |
| Pixabay | Driving lesson | https://pixabay.com/photos/search/driving%20lessons/ |
| Pexels | Driving instructor | https://www.pexels.com/search/driving%20instructor/ |
| Pexels | Driving school | https://www.pexels.com/search/driving%20school/ |

---

## Como Usar no Next.js

### Usando next/image com Unsplash

Configure o `next.config.js` para aceitar domínios externos:

```js
// next.config.ts
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'cdn.pixabay.com' },
    ],
  },
}
```

### Construindo URL do Unsplash via API (recomendado para produção)

Unsplash oferece API gratuita (50 req/hora sem autenticação):

```ts
// Busca aleatória por tema
const UNSPLASH_URL = 'https://source.unsplash.com/1200x800/?driving,instructor,car'

// URL direta por ID (melhor para produção)
// Formato: https://images.unsplash.com/photo-{id}?w=1200&q=80&auto=format&fit=crop
```

### Uso com next/image

```tsx
import Image from 'next/image'

// Hero
<Image
  src="https://images.unsplash.com/photo-rVFlPceH4gA?w=1200&q=80&auto=format&fit=crop"
  alt="Instrutor ensinando aluna a dirigir"
  width={600}
  height={400}
  priority  // LCP — carregar com prioridade
  className="rounded-xl object-cover"
/>
```

### Recomendação: baixar e hospedar no Supabase Storage

Para evitar dependência de CDNs externos e garantir performance, **baixe as imagens selecionadas** e suba para o **Supabase Storage**:

```
supabase/storage/
  └── public/
      └── homepage/
          ├── hero-instructor-aluno.webp       (1200×800)
          ├── hero-instructor-aluno-mobile.webp (600×800)
          ├── social-proof-mulher-volante.webp  (600×600)
          ├── cta-instrutor-carro.webp          (1200×600)
          └── background-rua-brasil.webp        (1920×1080)
```

Converter para **WebP** (30–50% menor que JPEG) antes do upload.

---

## Critérios de Seleção de Imagem

Ao escolher novas imagens, priorizar:

- ✅ Pessoas reais (não ilustrações ou vetores)
- ✅ Diversidade — homens e mulheres de diferentes idades e etnias
- ✅ Interior de carro (instrutor + aluno lado a lado)
- ✅ Expressão positiva — confiança, atenção, aprendizado
- ✅ Boa iluminação, sem filtros pesados
- ✅ Horizontal/landscape para hero (16:9 ou 3:2)
- ✅ Quadrada ou vertical para cards de depoimento (1:1 ou 4:5)
- ❌ Evitar: imagens de autoescola com placa/logo de terceiros
- ❌ Evitar: cenários claramente fora do Brasil (veículos com direção à direita, placas estrangeiras)

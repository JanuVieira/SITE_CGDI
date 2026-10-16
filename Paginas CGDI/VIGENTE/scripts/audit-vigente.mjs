import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const pages = async version => (await readdir(join(root, 'projetos', version), { recursive: true })).filter(file => file.endsWith('.html'));
const required = [
  'componentes/componentes.css',
  'componentes/shell/shell.css',
  'componentes/fundamentos.css',
  'componentes/templates.js',
  'componentes/componentes.js'
];
const externalInteraction = /<(?:a|form|iframe)\b[^>]*(?:href|action|src)="(?:https?:)?\/\/|<(?:a|form)\b[^>]*(?:href|action)="(?:mailto:|tel:)/i;
const externalResource = /<link\b(?=[^>]*\bhref="(?:https?:)?\/\/)[^>]*>/i;

function collectAttributeValues(html, attribute) {
  return [...html.matchAll(new RegExp(`\\b${attribute}="([^"]+)"`, 'gi'))].map(match => match[1]);
}

const v1 = await pages('v1');
const v2 = await pages('v2');
assert.ok(v1.length > 0, 'V1 deve manter suas páginas HTML.');
assert.deepEqual(v2, ['p00.html'], 'V2 deve publicar somente sua home nesta etapa.');
assert.deepEqual(await pages('v3'), [], 'V3 deve permanecer reservada e sem HTML.');
assert.deepEqual(await pages('v4'), [], 'V4 deve permanecer reservada e sem HTML.');

for (const [version, files] of [['v1', v1], ['v2', v2]]) {
  for (const file of files) {
    const html = await readFile(join(root, 'projetos', version, file), 'utf8');
    for (const path of required) assert.match(html, new RegExp(path.replaceAll('.', '\\.').replaceAll('/', '\\/')));
    const pageComponents = ['cgdi-prototype-nav', 'cgdi-portal-top', 'cgdi-breadcrumb', 'cgdi-page-intro', 'cgdi-portal-footer'];
    if (version === 'v1') pageComponents.push('cgdi-page-feedback');
    for (const component of pageComponents) {
      assert.match(html, new RegExp(`<${component}\\b`), `${version}/${file} deve declarar ${component}`);
    }
    // P01_BI_2026_EXCECAO_INICIO. Exceção restrita aos recursos oficiais desta página.
    let auditedExternal = html;
    if (version === 'v1' && file === 'p01.html') {
      const iframeTags = [...html.matchAll(/<iframe\b[^>]*>/gi)].map(m => m[0]);
      assert.equal(iframeTags.length, 1, 'P01 permite exatamente um iframe oficial.');
      assert.equal(iframeTags[0].match(/\bsrc="([^"]+)"/)?.[1], 'https://app.powerbi.com/view?r=eyJrIjoiY2I2NjRhYmMtY2MwZS00MzBjLWE4NjMtMGMyZjNhM2E4YjRkIiwidCI6IjU4MTVmODA4LTYwOTEtNDdiZC1hY2FiLTMwYzA4ZmU3YjlmMiJ9', 'URL do BI 2026 alterada.');
      assert.match(iframeTags[0], /\btitle="Painel interativo INPI IMPACT DASH 2026"/, 'Iframe deve ter título acessível.');
      assert.match(html, /frame-src 'self' https:\/\/app\.powerbi\.com;/, 'CSP deve permitir somente o domínio oficial do iframe.');
      const allowedLinks = [
          'https://www.gov.br/inpi/pt-br/uso-estrategico-da-pi/inpi-para-empreender-e-inovar/pdfs-pi-em-novos-formatos/irradiar-com-as-duas-portarias.pdf',
          'https://www.gov.br/inpi/pt-br/uso-estrategico-da-pi/inpi-para-empreender-e-inovar/relatorios-trimestrais-semestrais-e-anuais',
          'https://www.gov.br/inpi/pt-br/uso-estrategico-da-pi/inpi-para-empreender-e-inovar/pdfs-pi-em-novos-formatos/irradiar-2025.pdf',
          'https://app.powerbi.com/view?r=eyJrIjoiMmJjOWEyZjctYmMxYS00ODQ4LThhYjQtYjZmOWI4ZjE2MGVhIiwidCI6IjU4MTVmODA4LTYwOTEtNDdiZC1hY2FiLTMwYzA4ZmU3YjlmMiJ9'
      ];
      const outbound = [...html.matchAll(/<a\b[^>]*\bhref="https?:\/\/[^"]+"[^>]*>/gi)].map(m => m[0]);
      assert.equal(outbound.length, allowedLinks.length, 'P01 deve manter quatro referências oficiais.');
      for (let i = 0; i < allowedLinks.length; i++) {
        assert.equal(outbound[i].match(/\bhref="([^"]+)"/)?.[1], allowedLinks[i], 'Link oficial da P01 alterado.');
        assert.match(outbound[i], /\bdata-cgdi-p01-official="true"/, 'Referência oficial não identificada.');
        assert.match(outbound[i], /\btarget="_blank"/, 'Documento deve abrir em nova aba.');
        assert.match(outbound[i], /\brel="noopener noreferrer"/, 'Abertura externa deve usar noopener.');
      }
      auditedExternal = html.replace(iframeTags[0], '');
      for (const tag of outbound) auditedExternal = auditedExternal.replace(tag, '');
    }
    // P01_BI_2026_EXCECAO_FIM
    // CGDI_P06_EXCECAO_INICIO
    if (version === 'v1' && file === 'p06.html') {
      const iframes = [...html.matchAll(/<iframe\b[^>]*>/gi)].map(m => m[0]);
      assert.equal(iframes.length, 1, 'P06 permite exatamente um painel.');
      assert.equal(iframes[0].match(/\bsrc="([^"]+)"/)?.[1], 'https://app.powerbi.com/view?pageName=0c2c1c38d0962c017803&amp;r=eyJrIjoiMDU0ZjIzYmUtMmI0NS00M2VjLWE2ZWUtMDA5MzExYTU3MWNmIiwidCI6IjU4MTVmODA4LTYwOTEtNDdiZC1hY2FiLTMwYzA4ZmU3YjlmMiJ9', 'Origem do ACT IMPACT DASH não confere.');
      assert.match(iframes[0], /\btitle="ACT IMPACT DASH, painel interativo/);
      assert.match(html, /frame-src 'self' https:\/\/app\.powerbi\.com;/);
      const allowed = [
          'https://www.gov.br/inpi/pt-br/uso-estrategico-da-pi/inpi-para-empreender-e-inovar/acts-assinados-em-2025',
          'https://www.gov.br/inpi/pt-br/uso-estrategico-da-pi/inpi-para-empreender-e-inovar/copy2_of_acts-assinados-em-2026',
          'https://www.gov.br/inpi/pt-br/uso-estrategico-da-pi/relacoes-e-parcerias-nacionais/acordos-de-cooperacao',
          'https://www.gov.br/inpi/pt-br/uso-estrategico-da-pi/relacoes-e-parcerias-nacionais/acordos-de-cooperacao-nao-vigentes',
          'https://www.gov.br/inpi/pt-br/uso-estrategico-da-pi/inpi-para-empreender-e-inovar/ranking-dos-maiores-depositantes-de-software',
          'https://www.gov.br/inpi/pt-br/uso-estrategico-da-pi/inpi-para-empreender-e-inovar/relatorios-trimestrais-semestrais-e-anuais',
          'mailto:dicop@inpi.gov.br'
      ];
      const out = [...html.matchAll(/<a\b[^>]*\bhref="(?:https?:\/\/|mailto:)[^"]+"[^>]*>/gi)].map(m => m[0]);
      assert.equal(out.length, allowed.length, 'P06 deve preservar os sete destinos oficiais.');
      for (let i=0; i<allowed.length; i++) {
        assert.equal(out[i].match(/\bhref="([^"]+)"/)?.[1], allowed[i]);
        assert.match(out[i], /\bdata-cgdi-p06-official="true"/);
        if (i<6) { assert.match(out[i], /\btarget="_blank"/);assert.match(out[i], /\brel="noopener noreferrer"/); }
      }
      auditedExternal=html.replace(iframes[0], '');
      for (const element of out) auditedExternal=auditedExternal.replace(element, '');
    }
    // CGDI_P06_EXCECAO_FIM
    // CGDI_P07_EXCECAO_INICIO
    if (version === 'v1' && file === 'p07.html') {
      assert.doesNotMatch(html, /<iframe\b/i, 'A P07 não deve incluir iframe de agendamento.');
      const urls = [
        'https://calendly.com/srpi-norte-dff3/30min',
        'https://calendly.com/srpi-centro-oeste',
        'https://calendly.com/srpi-sudeste',
        'https://calendly.com/srpi-sul',
        'https://www.gov.br/inpi/pt-br/plataforma-integrada-de-atendimento'
      ];
      const links = [...html.matchAll(/<a\b[^>]*\bhref="(?:https?:\/\/|mailto:)[^"]+"[^>]*>/gi)].map(m => m[0]);
      assert.equal(links.length, urls.length, 'P07 deve permitir somente cinco destinos oficiais');
      for (let i=0; i<urls.length; i++) {
        assert.equal(links[i].match(/\bhref="([^"]+)"/)?.[1], urls[i], 'Destino da P07 divergiu.');
        assert.match(links[i], /\bdata-cgdi-p07-official="true"/);
        assert.match(links[i], /\btarget="_blank"/);
        assert.match(links[i], /\brel="noopener noreferrer"/);
        auditedExternal = auditedExternal.replace(links[i], '');
      }
    }
    // CGDI_P07_EXCECAO_FIM
    assert.doesNotMatch(auditedExternal, externalInteraction, `${version}/${file} não deve expor saída externa pelo protótipo`);
    assert.doesNotMatch(html, externalResource, `${version}/${file} não deve carregar recurso externo.`);
    assert.match(html, /http-equiv="Content-Security-Policy"/i, `${version}/${file} deve bloquear carregamentos externos.`);
    assert.doesNotMatch(html, /__CGDI_[A-Z0-9_]+__/, `${version}/${file} não deve publicar marcadores de build.`);
    // CGDI_P04_MENTORIAS_ROTA_INICIO
    // A exceção é exclusiva da home V1, para o arquivo P04 publicado.
    const routeHtmlP04 = version === 'v1' && file === 'p00.html'
      ? html.replace(/(<a\b[^>]*\bhref=")p04\.html(")/gi, '$1#cgdi-ambiente-teste$2')
      : html;
    // CGDI_P04_MENTORIAS_ROTA_FIM
    assert.doesNotMatch(routeHtmlP04, /<a\b[^>]*\bhref="p(?:0[4]|0[8-9]|1[0-3]|1[5-9]|[2-9]\d)\.html"/i, `${version}/${file} não deve apontar para páginas V1 ainda não publicadas.`);

    const ids = collectAttributeValues(html, 'id');
    assert.equal(new Set(ids).size, ids.length, `${version}/${file} não deve repetir IDs.`);
    const idSet = new Set(ids);
    for (const fragment of collectAttributeValues(html, 'href').filter(value => value.startsWith('#') && value.length > 1 && value !== '#cgdi-ambiente-teste')) {
      assert.ok(idSet.has(fragment.slice(1)), `${version}/${file} deve resolver o fragmento interno ${fragment}.`);
    }
    for (const controlled of collectAttributeValues(html, 'aria-controls')) {
      assert.ok(idSet.has(controlled), `${version}/${file} deve associar aria-controls="${controlled}" a um ID existente.`);
    }
  }
}

const v1Home = await readFile(join(root, 'projetos', 'v1', 'p00.html'), 'utf8');
assert.equal((v1Home.match(/href="p04\.html"/g) || []).length, 1, 'O card Mentorias deve apontar uma vez para P04.');
const v1P04 = await readFile(join(root, 'projetos', 'v1', 'p04.html'), 'utf8');
assert.match(v1P04, /<h1>Mentorias<\/h1>/, 'P04 deve apresentar título Mentorias.');
assert.equal((v1P04.match(/class="p04-number"/g) || []).length, 8, 'P04 deve preservar as oito etapas.');

assert.doesNotMatch(v1Home, /<h1[^>]*>INPI para empreender e inovar<\/h1>\s*<p>/, 'V1 não deve ter texto auxiliar abaixo do h1.');
assert.match(v1Home, /href="p02\.html"/, 'O segundo card da V1 deve levar à P02.');
assert.match(v1Home, /meta name="cgdi-prototype-version" content="V1"/, 'A Home V1 deve declarar sua versão sem marcador pendente.');
assert.match(v1Home, /href="\.\.\/\.\.\/index\.html"/, 'A Home V1 deve retornar à entrada interna dos protótipos.');
// CGDI_P03_CALENDARIO_ROTA
const v1P03 = await readFile(join(root, 'projetos', 'v1', 'p03.html'), 'utf8');
assert.match(v1P03, /<cgdi-calendar\b/, 'P03 deve reutilizar o componente cgdi-calendar.');
assert.match(v1P03, /data-calendar-mode="legacy"/, 'P03 deve manter os dados editoriais locais sem exemplos do template.');
assert.match(v1P03, /src="\.\/src\/p03-calendar\.js"/, 'P03 deve carregar a filtragem local.');
assert.equal((v1P03.match(/data-calendar-event\b/g) || []).length, 5, 'P03 deve preservar os cinco eventos programados.');
assert.doesNotMatch(v1P03, />Encerrado</, 'P03 não deve apresentar eventos encerrados.');
assert.match(v1Home, /href="p03\.html"/, 'O card Calendário deve apontar para P03.');
assert.match(v1Home, /<a class="service-link" href="p05\.html" aria-label="Solicitar palestra">/, 'O card Palestras deve levar à P05 publicada.');
assert.match(v1Home, /<a class="service-link" href="\.\.\/\.\.\/diagnosticos\/criterios\/index\.html" aria-label="Conhecer programas de Federações e Secretarias">/, 'O card Federações e Secretarias deve levar à página publicada.');
assert.equal((v1Home.match(/class="service-link"/g) || []).length, (v1Home.match(/class="service-link"[^>]*href=/g) || []).length, 'Todos os cards de serviço da Home V1 devem ter destino navegável.');
const v1P02 = await readFile(join(root, 'projetos', 'v1', 'p02.html'), 'utf8');
assert.match(v1P02, /<h1[^>]*>Materiais e dados do INPI<\/h1>/, 'A P02 deve apresentar seu título editorial.');
assert.equal((v1P02.match(/<cgdi-card(?!-)\b/g) || []).length, 6, 'A P02 deve usar seis cards reutilizáveis.');
assert.doesNotMatch(v1P02, /<cgdi-pre-download\b/, 'A P02 deve manter apenas cards padrão na grade de conteúdos.');
assert.match(v1P02, /href="p14\.html"/, 'O card de Cartilhas da P02 deve levar à página interna de cartilhas.');
const v1P14 = await readFile(join(root, 'projetos', 'v1', 'p14.html'), 'utf8');
assert.equal((v1P14.match(/<cgdi-pre-download\b/gi) || []).length, 2, 'A P14 deve apresentar as duas cartilhas com cgdi-pre-download.');
for (const marker of ['pd-card-body', 'pd-cover-mask', 'pd-file', 'pd-subjects', 'pd-details', 'pd-metadata', 'pd-primary-actions', 'data-pd-toggle']) {
  assert.match(v1P14, new RegExp(marker), `A P14 deve manter a estrutura canônica do pré-download: ${marker}.`);
}
assert.match(v1P14, /aria-controls="pd-details-pi"/, 'O controle da primeira cartilha deve estar associado aos detalhes.');
assert.match(v1P14, /aria-controls="pd-details-software"/, 'O controle da segunda cartilha deve estar associado aos detalhes.');
const v2Home = await readFile(join(root, 'projetos', 'v2', 'p00.html'), 'utf8');
assert.match(v2Home, /<li aria-current="page">INPI para empreender e inovar · V2<\/li>/, 'V2 deve ter breadcrumb interno e objetivo.');
assert.match(v2Home, /<a href="\.\.\/\.\.\/index\.html">[\s\S]*?Versões dos protótipos/, 'V2 deve retornar à entrada interna dos protótipos.');
assert.equal((v2Home.match(/<h1\b/g) || []).length, 1, 'A V2 deve apresentar um único título principal.');
assert.match(v2Home, /<cgdi-page-intro[^>]*>[\s\n]*<h1[^>]*>INPI para empreender e inovar<\/h1>[\s\n]*<\/cgdi-page-intro>/, 'A abertura da V2 deve conter somente o título.');
assert.ok((v2Home.match(/<cgdi-card\b/g) || []).length >= 10, 'A V2 deve preservar seus cards de conteúdo.');
assert.match(v2Home, /<cgdi-news-carousel\b/, 'A V2 deve preservar o carrossel.');
assert.match(v2Home, /<cgdi-calendar\b/, 'A V2 deve preservar o calendário.');
for (const removedCopy of [
  'Proteção de criações, materiais, programas e resultados do INPI.',
  'Notícias em destaque',
  'Conteúdo ilustrativo para teste. Não são notícias oficiais.'
]) assert.doesNotMatch(v2Home, new RegExp(removedCopy.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')), `A V2 não deve restaurar o texto removido: ${removedCopy}`);
assert.doesNotMatch(v2Home, /v2-demo-(?:label|intro)/, 'A V2 não deve exibir ressalvas editoriais artificiais.');

const feedbackScript = await readFile(join(root, 'componentes', 'pesquisa', 'pesquisa.js'), 'utf8');
const feedbackStyle = await readFile(join(root, 'componentes', 'pesquisa', 'pesquisa.css'), 'utf8');
const mapTemplate = await readFile(join(root, 'componentes', 'mapa', 'template.html'), 'utf8');
const componentStyle = await readFile(join(root, 'componentes', 'componentes.css'), 'utf8');
const componentScript = await readFile(join(root, 'componentes', 'componentes.js'), 'utf8');
const prototypeNavTemplate = await readFile(join(root, 'componentes', 'navegacao-prototipos', 'template.html'), 'utf8');
const templateBundle = await readFile(join(root, 'componentes', 'templates.js'), 'utf8');
const lecturesPage = await readFile(join(root, 'projetos', 'v1', 'p05.html'), 'utf8');
const federationsPage = await readFile(join(root, 'diagnosticos', 'criterios', 'index.html'), 'utf8');
assert.match(prototypeNavTemplate, />\s*Retornar à página inicial\s*<\/a>/, 'A navegação do protótipo deve usar um rótulo de retorno claro e objetivo.');
assert.match(templateBundle, /Retornar à página inicial/, 'O bundle deve refletir o rótulo do componente canônico.');
for (const [page, name] of [[lecturesPage, 'Palestras'], [federationsPage, 'Federações e Secretarias']]) {
  for (const component of ['cgdi-prototype-nav', 'cgdi-portal-top', 'cgdi-breadcrumb', 'cgdi-page-intro', 'cgdi-page-feedback', 'cgdi-portal-footer']) {
    assert.match(page, new RegExp(`<${component}\\b`), `A página de ${name} deve declarar ${component}.`);
  }
}
assert.match(lecturesPage, /<h1>Palestras<\/h1>/, 'A P05 deve apresentar o título Palestras.');
assert.equal((lecturesPage.match(/class="num"/g) || []).length, 4, 'O fluxo de Palestras deve apresentar quatro etapas.');
assert.match(federationsPage, /<h1>Federações das Indústrias e Secretarias de Inovação<\/h1>/, 'A página deve apresentar o título oficial.');
assert.match(federationsPage, /frame-src 'self' https:\/\/app\.powerbi\.com;/, 'A CSP deve permitir o painel oficial.');
assert.equal((federationsPage.match(/<iframe\b/gi) || []).length, 1, 'A página deve incorporar exatamente um painel.');
assert.match(federationsPage, /title="Painel interativo Federações e Secretarias IMPACT DASH"/, 'O painel deve ter título acessível.');
assert.equal((federationsPage.match(/data-cgdi-federacoes-official="true"/g) || []).length, 4, 'A página deve preservar quatro destinos oficiais identificados.');
assert.match(componentScript, /const federationsOfficialResources = new Set\(/, 'Os destinos oficiais de Federações e Secretarias devem estar liberados pelo carregador.');
assert.match(componentScript, /link\.dataset\.cgdiFederacoesOfficial === 'true'/, 'O carregador deve reconhecer os destinos oficiais de Federações e Secretarias.');
assert.match(feedbackScript, /cgdi-feedback-stepper/, 'O modal de pesquisa deve ter stepper.');
assert.match(feedbackStyle, /cgdi-feedback-stepper-item\.is-active/, 'O stepper deve apresentar estado ativo.');
assert.doesNotMatch(mapTemplate, /<text[^>]*>[^<]{3,}<\/text>/, 'O mapa deve exibir siglas, não nomes extensos.');
assert.match(componentStyle, /cgdi-map \.states-map svg a text \{[\s\S]*?fill:#1b1b1b!important;[\s\S]*?font-weight:400!important;[\s\S]*?stroke:none!important;/, 'As siglas do mapa devem usar peso regular e contraste sobre a paleta clara.');
assert.match(componentStyle, /cgdi-map \.states-map svg \.sudeste \{ fill:#d1d9ff!important; \}/, 'O mapa deve preservar a paleta clara original.');
assert.match(componentStyle, /\.states-info > p \{ color:#fff!important; \}/, 'O texto ao lado do mapa deve ter contraste sobre o fundo azul.');
assert.match(componentStyle, /cgdi-map \.states-map svg a:focus-visible path/, 'O mapa deve ter foco visível nas unidades federativas.');
assert.match(componentScript, /card\.classList\.add\('cgdi-card', 'br-card'\)/, 'Todos os cards reutilizáveis devem receber a classe estrutural br-card do GOV.BR.');

console.log(`Vigente validado: ${v1.length} página(s) V1, ${v2.length} página V2 e V3/V4 reservadas.`);

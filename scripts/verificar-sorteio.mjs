// Lê a última chave do Euromilhões no site da Santa Casa e junta-a ao data.json.
// Corre no GitHub Actions (Node 20). Só usa os 5 números, sem estrelas.
import { readFile, writeFile } from "node:fs/promises";

const URL_SC = "https://www.jogossantacasa.pt/web/SCCartazResult/euroMilhoes";
const FICHEIRO = "data.json";

async function lerSantaCasa() {
  const r = await fetch(URL_SC + "?t=" + Date.now(), {
    headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "pt-PT" },
  });
  if (!r.ok) throw new Error("Santa Casa respondeu " + r.status);
  const html = new TextDecoder("latin1").decode(await r.arrayBuffer());
  const txt = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ");
  const md = txt.match(/Data do Sorteio\s*-\s*(\d{2})\/(\d{2})\/(\d{4})/i);
  if (!md) throw new Error("Data do sorteio não encontrada");
  const mk = txt.slice(md.index).match(/(\d{1,2}) (\d{1,2}) (\d{1,2}) (\d{1,2}) (\d{1,2}) ?\+ ?(\d{1,2}) (\d{1,2})/);
  if (!mk) throw new Error("Chave não encontrada");
  const numeros = mk.slice(1, 6).map(Number);
  if (!numeros.every((n) => n >= 1 && n <= 50) || new Set(numeros).size !== 5) throw new Error("Chave inválida");
  return { data: `${md[3]}-${md[2]}-${md[1]}`, numeros: numeros.sort((a, b) => a - b) };
}

function temVencedor(d) {
  const saidos = new Set(d.sorteios.flatMap((s) => s.numeros));
  return d.jogadores.some((j) => {
    const ns = j.numeros.filter((n) => n >= 1 && n <= 50);
    return ns.length === 10 && ns.every((n) => saidos.has(n));
  });
}

const sorteio = await lerSantaCasa();
console.log("Último sorteio na Santa Casa:", sorteio.data, sorteio.numeros.join(" "));

const d = JSON.parse(await readFile(FICHEIRO, "utf8"));
if (d.sorteios.some((s) => s.data === sorteio.data)) {
  console.log("Já está na grelha. Nada a fazer.");
} else if (sorteio.data < d.inicio) {
  console.log("Sorteio anterior ao início da ronda. Ignorado.");
} else if (temVencedor(d)) {
  console.log("Ronda já terminou (há vencedor). Ignorado.");
} else {
  d.sorteios.push({ data: sorteio.data, numeros: sorteio.numeros, fonte: "auto" });
  d.atualizado = Date.now();
  await writeFile(FICHEIRO, JSON.stringify(d, null, 1) + "\n");
  console.log("Sorteio adicionado.");
}

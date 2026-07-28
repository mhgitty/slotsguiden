import { createClient } from '@sanity/client'
import * as dotenv from 'dotenv'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: join(__dirname, '../.env.local') })

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET,
  token: process.env.SANITY_API_TOKEN,
  apiVersion: '2026-04-22',
  useCdn: false,
})

const redirects = [
  { code: 'default',         destination: 'https://pokcas.com' },
  { code: 'leovegas',        destination: 'https://bandstrack.com/r/leovegas?site=pokcas.com' },
  { code: 'kapow',           destination: 'https://wlkapowcasino.adsrv.eacdn.com/C.ashx?btag=a_1142b_709c_&affid=442&siteid=1142&adid=709&c=' },
  { code: 'chanz',           destination: 'https://wlchanz.adsrv.eacdn.com/C.ashx?btag=a_3849b_211c_&affid=227&siteid=3849&adid=211&c=' },
  { code: 'videoslots',      destination: 'https://trk.affiliates.videoslots.com/o/7yd3EK?lpage=LZ95xq&site_id=7012504' },
  { code: 'comeon',          destination: 'https://media.comeon.com/tracking.php?tracking_code&aid=119642&mid=4514&sid=457663&pid=3105' },
  { code: 'mrgreen',         destination: 'https://bandstrack.com/r/mrgreen?site=pokcas.com' },
  { code: 'onecasino',       destination: 'https://go.polar-trk.com/aff_c?offer_id=127&aff_id=1738' },
  { code: 'royalcasino',     destination: 'https://wlroyalcasino.adsrv.eacdn.com/C.ashx?btag=a_1197b_902c_&affid=458&siteid=1197&adid=902&c=' },
  { code: 'mrvegas',         destination: 'https://bandstrack.com/r/mrvegas?site=pokcas.com' },
  { code: 'betinia',         destination: 'https://bandstrack.com/r/betinia?site=pokcas.com' },
  { code: '888casino',       destination: 'https://bandstrack.com/r/888casino?site=pokcas.com' },
  { code: 'expekt',          destination: 'https://bandstrack.com/r/expekt?site=pokcas.com' },
  { code: 'gratisspins',     destination: 'https://wlroyalcasino.adsrv.eacdn.com/C.ashx?btag=a_410b_74c_&affid=157&siteid=410&adid=74&c=' },
  { code: 'getlucky',        destination: 'https://media.getlucky.com/tracking.php?tracking_code&aid=119642&mid=9054&sid=457663&pid=3462' },
  { code: 'ahtigames',       destination: 'https://site.ahtigames.com/index.php?aname=pokcas.com&cg=danish' },
  { code: 'campobet',        destination: 'https://bandstrack.com/r/campobet?site=pokcas.com' },
  { code: 'winlandia',       destination: 'https://site.winlandia.com/index.php?aname=pokcas&zone_id=pokcas' },
  { code: 'playojo',         destination: 'https://bandstrack.com/r/playojo?site=pokcas.com' },
  { code: 'vindercasino',    destination: 'https://vindercasino.dk/?btag=wildtrigger250&utm_source=pokcas&utm_medium=velkomstgave-wildtrigger250&utm_campaign=wildtrigger250' },
  { code: 'luna',            destination: 'https://ads.galaxyaffiliates.com/redirect.aspx?mid=5370&sid=13002&cid=&pid=&affid=7757' },
  { code: 'swift',           destination: 'https://ads.galaxyaffiliates.com/redirect.aspx?mid=4271&sid=13002&cid=&pid=&affid=7757' },
  { code: 'slots',           destination: 'https://ads.galaxyaffiliates.com/redirect.aspx?mid=5370&sid=13002&cid=&pid=&affid=7757' },
  { code: 'leovegasmatch',   destination: 'https://bandstrack.com/r/leovegas-match?site=pokcas.com' },
  { code: 'jackpotbet',      destination: 'https://record.jackpotbet.dk/_HMpGcY-4ZyP6PBA04iUMN2Nd7ZgqdRLk/1/' },
  { code: 'royalmatch',      destination: 'https://wlroyalcasino.adsrv.eacdn.com/C.ashx?btag=a_1197b_903c_&affid=458&siteid=1197&adid=903&c=' },
  { code: 'leovegaslive',    destination: 'https://bandstrack.com/r/leovegas-live?site=pokcas.com' },
  { code: 'marathonbet',     destination: 'https://mrthnbet.dk/dc202055b' },
  { code: 'leovegassport',   destination: 'https://bandstrack.com/r/leovegas-sport?site=pokcas.com' },
  { code: 'expektsport',     destination: 'https://bandstrack.com/r/expekt-sport?site=pokcas.com' },
  { code: 'jackpotbetsport', destination: 'https://record.jackpotbet.dk/_HMpGcY-4ZyP6PBA04iUMN2Nd7ZgqdRLk/1/' },
  { code: 'comeonsport',     destination: 'https://media.comeon.com/tracking.php?tracking_code&aid=119642&mid=4947&sid=457663&pid=3102' },
  { code: 'getluckysport',   destination: 'https://media.getlucky.com/tracking.php?tracking_code&aid=119642&mid=9265&sid=457663&pid=3557' },
  { code: 'campobetsport',   destination: 'https://bandstrack.com/r/campobet-sport?site=pokcas.com' },
  { code: 'betiniasport',    destination: 'https://bandstrack.com/r/betinia-sport?site=pokcas.com' },
  { code: 'marathonbetsport',destination: 'https://mrthnbet.dk/dc1fa163f' },
  { code: 'betano',          destination: 'https://gml-grp.com/C.ashx?btag=a_56250b_3751c_&affid=19156&siteid=56250&adid=3751&c=' },
  { code: 'spilleautomaten', destination: 'https://bandstrack.com/r/spilleautomaten?site=pokcas.com' },
  { code: 'royalcasinomatch',destination: 'https://wlroyalcasino.adsrv.eacdn.com/C.ashx?btag=a_1197b_903c_&affid=458&siteid=1197&adid=903&c=' },
  { code: '888casinomatch',  destination: 'https://bandstrack.com/r/888casino-match?site=pokcas.com' },
  { code: 'spildansknu',     destination: 'https://bandstrack.com/r/spildansknu?site=pokcas.com' },
  { code: 'vbet',            destination: 'https://bandstrack.com/r/vbet?site=pokcas.com' },
  { code: 'betoro',          destination: 'https://bandstrack.com/r/betoro?site=pokcas.com' },
  { code: 'betorosport',     destination: 'https://bandstrack.com/r/betoro-sport?site=pokcas.com' },
  { code: 'vbetsport',       destination: 'https://bandstrack.com/r/vbet-sport?site=pokcas.com' },
]

const transaction = client.transaction()

for (const r of redirects) {
  const title = r.code.charAt(0).toUpperCase() + r.code.slice(1)
  transaction.createOrReplace({
    _type: 'redirect',
    _id: `redirect-${r.code}`,
    title,
    code: { _type: 'slug', current: r.code },
    destination: r.destination,
    active: true,
  })
}

console.log(`Importing ${redirects.length} redirects...`)
const result = await transaction.commit()
console.log(`✓ Done! Created/updated ${redirects.length} redirects.`)

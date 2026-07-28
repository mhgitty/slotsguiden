import { NextResponse } from 'next/server'

const SM = 'https://api.sportmonks.com/v3/football'

export async function GET() {
  const token = process.env.SPORTSMONKS_API_TOKEN
  if (!token) return NextResponse.json({ error: 'SPORTSMONKS_API_TOKEN not set' }, { status: 500 })

  const results: Record<string, any> = {}

  // 1. Test league fetch with currentSeason include
  try {
    const r = await fetch(`${SM}/leagues/271?api_token=${token}&include=currentSeason`)
    results.league_271 = await r.json()
  } catch (e: any) { results.league_271_error = e.message }

  // 2. Test seasons for league 271
  try {
    const r = await fetch(`${SM}/seasons?api_token=${token}&filters=leagueId:271`)
    results.seasons_271 = await r.json()
  } catch (e: any) { results.seasons_271_error = e.message }

  // 3. Try standings directly for a guessed season
  const guessedSeason = results.league_271?.data?.currentseason?.id
  if (guessedSeason) {
    try {
      const r = await fetch(`${SM}/standings/seasons/${guessedSeason}?api_token=${token}&include=participant;details`)
      results.standings = await r.json()
    } catch (e: any) { results.standings_error = e.message }
  }

  return NextResponse.json(results, { headers: { 'Cache-Control': 'no-store' } })
}

// Leading tokens that are initials (e.g. "K.M.", "A.B.M.", "S.", "A.") — a run of single letters each followed by a dot.
const INITIAL_TOKEN = /^([A-Za-z]\.)+$/
// The common Bangladeshi honorific/prefix "Md"/"Md."/"MD" (short for "Mohammad"), on its own as a token.
const MD_TOKEN = /^md\.?$/i

/**
 * A short, space-friendly display name — just the given name, skipping past any leading initials
 * (e.g. "K.M.", "A.B.M.") or an "MD"/"Md." prefix rather than treating those as the first name.
 *
 * "MD. Rakibul Islam" -> "Rakibul"
 * "K.M. Abdul Hannan"  -> "Abdul"
 * "Aman Gupta"         -> "Aman"
 */
export function shortDisplayName(fullName: string): string {
  const tokens = fullName.trim().split(/\s+/).filter(Boolean)
  if (tokens.length === 0) return fullName

  let idx = 0
  while (idx < tokens.length - 1 && (INITIAL_TOKEN.test(tokens[idx]) || MD_TOKEN.test(tokens[idx]))) {
    idx++
  }
  return tokens[idx]
}

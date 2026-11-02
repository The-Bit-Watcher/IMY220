// Small fuzzy matcher for search. Finds words even with missing, extra, swapped or wrong letters.
// Uses Optimal String Alignment distance (Levenshtein + adjacent transpositions).

function editDistance(a, b) {
    const rows = a.length + 1;
    const cols = b.length + 1;
    const d = Array.from({ length: rows }, (_, i) => [i, ...new Array(cols - 1).fill(0)]);
    for (let j = 0; j < cols; j++) d[0][j] = j;

    for (let i = 1; i < rows; i++) {
        for (let j = 1; j < cols; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + cost);
            if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
                d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1); // swapped letters
            }
        }
    }
    return d[a.length][b.length];
}

// How many typos we forgive grows with the length of what was typed
const allowedEdits = (len) => (len <= 3 ? 0 : len <= 5 ? 1 : len <= 8 ? 2 : 3);

const words = (text) => String(text || "").toLowerCase().split(/[^a-z0-9_]+/).filter(Boolean);

// Score 0..1 for one typed token against one word
function wordScore(token, word) {
    if (word === token) return 1;
    if (word.startsWith(token)) return 0.9;          // autocomplete: "sun" -> "sunset"
    if (token.length >= 3 && word.includes(token)) return 0.8;

    const allowed = allowedEdits(token.length);
    if (allowed === 0) return 0;
    // Compare with the whole word and with its start (so a misspelt partial word still matches)
    const dist = Math.min(editDistance(token, word), editDistance(token, word.slice(0, token.length)));
    return dist <= allowed ? 0.7 - (0.15 * dist) / allowed : 0;
}

// Score 0..1 for a query against a list of fields. Every typed word must match something.
function scoreFields(query, fields) {
    const tokens = words(query);
    if (tokens.length === 0) return 0;
    const candidates = [...new Set(fields.flatMap(words))];
    if (candidates.length === 0) return 0;

    let total = 0;
    for (const token of tokens) {
        let best = 0;
        for (const w of candidates) {
            best = Math.max(best, wordScore(token, w));
            if (best === 1) break;
        }
        if (best === 0) return 0;
        total += best;
    }
    return total / tokens.length;
}

// Ranks items by score and keeps the best `limit`
function rank(query, items, getFields, limit) {
    return items
        .map((item) => ({ item, score: scoreFields(query, getFields(item)) }))
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((r) => r.item);
}

module.exports = { editDistance, scoreFields, rank };

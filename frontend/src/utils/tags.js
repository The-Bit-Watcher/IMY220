// Normalise a hashtag like the backend does: lowercase, no '#', letters/numbers/_ only
export const cleanTag = (t) => t.trim().replace(/^#+/, '').toLowerCase().replace(/[^a-z0-9_]/g, '');

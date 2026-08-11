export function hasValidAcceptedResponseEscapes(value: string): boolean {
  let escaped = false;
  let segmentLength = 0;
  for (const character of value) {
    if (escaped) {
      if (character !== '\\' && character !== ';') return false;
      segmentLength += 1; escaped = false;
    } else if (character === '\\') escaped = true;
    else if (character === ';') {
      if (segmentLength === 0) return false;
      segmentLength = 0;
    } else if (!/\s/.test(character) || segmentLength > 0) segmentLength += 1;
  }
  return !escaped && segmentLength > 0;
}

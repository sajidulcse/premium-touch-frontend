/**
 * Unique Event ID generator for Meta Pixel & Meta CAPI Event Deduplication.
 * Ensures consistent event_id format across client and server.
 */
export const generateEventId = (prefix = 'evt') => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}_${crypto.randomUUID()}`;
  }
  
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 10);
  return `${prefix}_${timestamp}_${randomStr}`;
};

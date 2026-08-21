/**
 * True on iPhone/iPad (any browser). iPadOS 13+ reports its UA as a Mac, so
 * that case is distinguished from a real Mac by touch support.
 */
export const isIOSDevice = (): boolean => {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isIPhoneOrIPod = /iPhone|iPod/.test(ua);
  const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return isIPhoneOrIPod || /iPad/.test(ua) || isIPadOS;
};

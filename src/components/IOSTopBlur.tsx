import React, { useState, useEffect } from 'react';
import { isIOSDevice } from '../utils/platform';

/**
 * A soft, graduated blur behind the notch/status-bar area — iOS/iPadOS only.
 * Without it that strip is a flat color; native iOS apps instead fade the
 * content behind the status bar into a blur so it never looks like a hard
 * edge. Built from a few stacked backdrop-filter layers, each fading out at
 * a different point, since a single masked blur layer looks like one flat
 * band rather than a gradient. Purely decorative: pointer-events-none, and
 * renders nothing at all on non-Apple devices.
 */
const IOSTopBlur: React.FC = () => {
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    setIsIOS(isIOSDevice());
  }, []);

  if (!isIOS) return null;

  const bandHeight = 'calc(env(safe-area-inset-top) + 70px)';

  const layers = [
    { blur: 22, stops: '0%, transparent 45%' },
    { blur: 13, stops: '0%, transparent 65%' },
    { blur: 6, stops: '0%, transparent 100%' },
  ];

  return (
    <div
      aria-hidden="true"
      className="fixed inset-x-0 top-0 z-40 pointer-events-none"
      style={{ height: bandHeight }}
    >
      {layers.map((layer, i) => {
        const mask = `linear-gradient(to bottom, black ${layer.stops})`;
        return (
          <div
            key={i}
            className="absolute inset-0"
            style={{
              backdropFilter: `blur(${layer.blur}px)`,
              WebkitBackdropFilter: `blur(${layer.blur}px)`,
              WebkitMaskImage: mask,
              maskImage: mask,
            }}
          />
        );
      })}
    </div>
  );
};

export default IOSTopBlur;

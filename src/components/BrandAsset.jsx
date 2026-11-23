const BRAND_ASSETS = {
  mark: '/brand/expensenest-mark.png',
  lockup: '/brand/expensenest-lockup.png',
};

export default function BrandAsset({ variant = 'mark', className = '', alt = '' }) {
  const selectedVariant = variant in BRAND_ASSETS ? variant : 'mark';

  return (
    <img
      className={`brand-asset brand-asset-${selectedVariant}${className ? ` ${className}` : ''}`}
      src={BRAND_ASSETS[selectedVariant]}
      alt={alt}
      aria-hidden={alt ? undefined : 'true'}
      decoding="async"
      draggable="false"
    />
  );
}

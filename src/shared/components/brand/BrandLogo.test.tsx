import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { BRAND_COLORS, BRAND_INFO } from '@/shared/constants/brand';

import { BrandLogo } from './BrandLogo';

describe('<BrandLogo /> Component', () => {
  it('renders default compact positive layout with company name and red icon', () => {
    const { container } = render(<BrandLogo />);

    expect(screen.getByText(BRAND_INFO.COMPANY_NAME)).toBeInTheDocument();
    expect(screen.queryByText(BRAND_INFO.SLOGAN)).not.toBeInTheDocument();

    const path = container.querySelector('path');
    expect(path).toHaveAttribute('fill', BRAND_COLORS.PRIMARY);
  });

  it('renders full layout including slogan', () => {
    render(<BrandLogo layout="full" />);

    expect(screen.getByText(BRAND_INFO.COMPANY_NAME)).toBeInTheDocument();
    expect(screen.getByText(BRAND_INFO.SLOGAN)).toBeInTheDocument();
  });

  it('renders symbol-only layout without company text or slogan', () => {
    const { container } = render(<BrandLogo layout="symbol" />);

    expect(screen.queryByText(BRAND_INFO.COMPANY_NAME)).not.toBeInTheDocument();
    expect(screen.queryByText(BRAND_INFO.SLOGAN)).not.toBeInTheDocument();

    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders monochrome variant with black and white tones', () => {
    const { container: blackContainer } = render(
      <BrandLogo variant="monochrome" monochromeTone="black" />,
    );
    expect(blackContainer.querySelector('path')).toHaveAttribute(
      'fill',
      BRAND_COLORS.BLACK,
    );

    const { container: whiteContainer } = render(
      <BrandLogo variant="monochrome" monochromeTone="white" />,
    );
    expect(whiteContainer.querySelector('path')).toHaveAttribute(
      'fill',
      BRAND_COLORS.WHITE,
    );
  });

  it('supports img renderMode using brand SVG assets', () => {
    render(
      <BrandLogo
        layout="compact"
        variant="positive"
        renderMode="img"
        alt="Brand Test Alt"
      />,
    );

    const img = screen.getByRole('img', { name: 'Brand Test Alt' });
    expect(img).toBeInTheDocument();
  });

  it('provides accessible role and labels', () => {
    render(<BrandLogo alt="Logo Doanh Nghiep Vinh Phat" />);

    const logoContainer = screen.getByRole('img', {
      name: 'Logo Doanh Nghiep Vinh Phat',
    });
    expect(logoContainer).toBeInTheDocument();
  });
});

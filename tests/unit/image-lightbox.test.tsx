import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ImageLightbox from '../../src/renderer/components/ImageLightbox';

describe('Image Lightbox Zoom Component (T511 / F37 / AC-37.1)', () => {
  it('does not render when isOpen is false', () => {
    render(
      <ImageLightbox
        isOpen={false}
        src="https://example.com/photo.jpg"
        alt="Photo"
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByTestId('image-lightbox')).toBeNull();
  });

  it('renders image, dimensions info and zoom level when isOpen is true', () => {
    render(
      <ImageLightbox
        isOpen={true}
        src="https://example.com/photo.jpg"
        alt="Photo"
        naturalWidth={1920}
        naturalHeight={1080}
        onClose={vi.fn()}
      />
    );

    const lightbox = screen.getByTestId('image-lightbox');
    expect(lightbox).toBeDefined();

    expect(screen.getByText('100%')).toBeDefined();
    expect(screen.getByText(/1920 × 1080/)).toBeDefined();
  });

  it('zooms in, zooms out, and resets scale via control buttons', () => {
    render(
      <ImageLightbox
        isOpen={true}
        src="https://example.com/photo.jpg"
        alt="Photo"
        onClose={vi.fn()}
      />
    );

    const zoomInBtn = screen.getByTestId('lightbox-zoom-in');
    const zoomOutBtn = screen.getByTestId('lightbox-zoom-out');
    const zoomResetBtn = screen.getByTestId('lightbox-zoom-reset');

    expect(screen.getByTestId('lightbox-scale-badge').textContent).toBe('100%');

    // Zoom in (+25%) -> 125%
    fireEvent.click(zoomInBtn);
    expect(screen.getByTestId('lightbox-scale-badge').textContent).toBe('125%');

    // Zoom out twice -> 75%
    fireEvent.click(zoomOutBtn);
    fireEvent.click(zoomOutBtn);
    expect(screen.getByTestId('lightbox-scale-badge').textContent).toBe('75%');

    // Reset -> 100%
    fireEvent.click(zoomResetBtn);
    expect(screen.getByTestId('lightbox-scale-badge').textContent).toBe('100%');
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(
      <ImageLightbox
        isOpen={true}
        src="https://example.com/photo.jpg"
        alt="Photo"
        onClose={onClose}
      />
    );

    const closeBtn = screen.getByTestId('lightbox-close-btn');
    fireEvent.click(closeBtn);

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = vi.fn();
    render(
      <ImageLightbox
        isOpen={true}
        src="https://example.com/photo.jpg"
        alt="Photo"
        onClose={onClose}
      />
    );

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking outside the image on the backdrop', () => {
    const onClose = vi.fn();
    render(
      <ImageLightbox
        isOpen={true}
        src="https://example.com/photo.jpg"
        alt="Photo"
        onClose={onClose}
      />
    );

    const backdrop = screen.getByTestId('lightbox-backdrop');
    fireEvent.click(backdrop);

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

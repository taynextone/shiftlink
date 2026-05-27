import { useRef, useState, useCallback, useEffect } from 'react';

type SignaturePadProps = {
  onChange: (dataUrl: string | null) => void;
  width?: number;
  height?: number;
  label?: string;
  error?: string;
  disabled?: boolean;
};

export function SignaturePad({
  onChange,
  width = 400,
  height = 200,
  label = 'Unterschrift',
  error,
  disabled = false,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);
  const lastPos = useRef<{ x: number; y: number } | null>(null);

  const getPos = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      if ('touches' in e) {
        const touch = e.touches[0];
        return {
          x: (touch.clientX - rect.left) * scaleX,
          y: (touch.clientY - rect.top) * scaleY,
        };
      }
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    },
    [],
  );

  const startDrawing = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (disabled) return;
      e.preventDefault();
      const pos = getPos(e);
      lastPos.current = pos;
      setIsDrawing(true);
    },
    [disabled, getPos],
  );

  const draw = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
      if (!isDrawing || disabled) return;
      e.preventDefault();

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!ctx || !lastPos.current) return;

      const pos = getPos(e);
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = '#1a1a2e';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
      lastPos.current = pos;
      setHasSignature(true);
    },
    [isDrawing, disabled, getPos],
  );

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;
    setIsDrawing(false);
    lastPos.current = null;

    const canvas = canvasRef.current;
    if (canvas && hasSignature) {
      onChange(canvas.toDataURL('image/png'));
    }
  }, [isDrawing, hasSignature, onChange]);

  const clear = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onChange(null);
  }, [onChange]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw baseline
    const baselineY = canvas.height - 30;
    ctx.beginPath();
    ctx.moveTo(20, baselineY);
    ctx.lineTo(canvas.width - 20, baselineY);
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 3]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw hint text
    ctx.fillStyle = '#9ca3af';
    ctx.font = '14px system-ui, sans-serif';
    ctx.fillText('Hier unterschreiben', 20, baselineY + 20);
  }, []);

  return (
    <div className="signature-pad">
      {label && <label className="field-label">{label}</label>}
      <div className="signature-canvas-wrapper" style={{ width, maxWidth: '100%' }}>
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="signature-canvas"
          style={{
            border: error ? '2px solid #ef4444' : '2px solid #d1d5db',
            borderRadius: '8px',
            cursor: disabled ? 'not-allowed' : 'crosshair',
            touchAction: 'none',
            width: '100%',
            height: 'auto',
          }}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      <div className="signature-actions">
        <button type="button" onClick={clear} className="btn btn-sm btn-ghost" disabled={disabled || !hasSignature}>
          Löschen
        </button>
        {hasSignature && <span className="signature-hint">✓ Unterschrift erfasst</span>}
      </div>
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

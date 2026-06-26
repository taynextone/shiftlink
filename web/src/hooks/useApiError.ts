import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiError } from '../lib/api-error';

const STATUS_MESSAGES: Record<number, string> = {
  401: 'Bitte melde dich erneut an',
  403: 'Keine Berechtigung',
  404: 'Nicht gefunden',
  500: 'Serverfehler, bitte versuche es später',
};

type ApiErrorNotification = {
  message: string;
  status?: number;
  code?: string;
};

export function getApiErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return STATUS_MESSAGES[error.status] ?? error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Ein unerwarteter Fehler ist aufgetreten';
}

export function useApiError() {
  const navigate = useNavigate();
  const [notification, setNotification] = useState<ApiErrorNotification | null>(null);

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  const handleApiError = useCallback((error: unknown) => {
    const message = getApiErrorMessage(error);
    const nextNotification: ApiErrorNotification = {
      message,
      status: error instanceof ApiError ? error.status : undefined,
      code: error instanceof ApiError ? error.code : undefined,
    };

    setNotification(nextNotification);
    window.dispatchEvent(new CustomEvent('shiftlink:api-error', { detail: nextNotification }));

    if (error instanceof ApiError && error.status === 401) {
      navigate('/login', { replace: true });
    }

    return message;
  }, [navigate]);

  return {
    notification,
    clearNotification,
    handleApiError,
  };
}

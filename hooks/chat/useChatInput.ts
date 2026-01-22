import { useCallback, useMemo, useState } from "react";
import type { ChangeEvent } from "react";

export interface UseChatInputOptions {
  initialValue?: string;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  trimOnSubmit?: boolean;
  validate?: (value: string) => string | null;
  onSubmit?: (value: string) => void | Promise<void>;
}

export interface UseChatInputResult {
  value: string;
  error: string | null;
  isValid: boolean;
  isSubmitting: boolean;
  setValue: (value: string) => void;
  handleChange: (
    eventOrValue: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | string,
  ) => void;
  reset: () => void;
  submit: (valueOverride?: string) => Promise<boolean>;
}

/**
 * Controla el estado del input de chat con validación y envío opcional.
 * @param options Configuración de validación, valor inicial y handler de submit.
 * @returns Estado del input, validación y acciones de cambio/envío.
 */
export function useChatInput(
  options: UseChatInputOptions = {},
): UseChatInputResult {
  const {
    initialValue = "",
    required = false,
    minLength,
    maxLength,
    trimOnSubmit = true,
    validate,
    onSubmit,
  } = options;
  const [value, setValueState] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateValue = useCallback(
    (nextValue: string) => {
      if (required && nextValue.trim().length === 0) {
        return null;
      }
      if (minLength !== undefined && nextValue.length < minLength) {
        return `Debe tener al menos ${minLength} caracteres.`;
      }
      if (maxLength !== undefined && nextValue.length > maxLength) {
        return `Debe tener como máximo ${maxLength} caracteres.`;
      }
      if (validate) return validate(nextValue);
      return null;
    },
    [maxLength, minLength, required, validate],
  );

  const setValue = useCallback(
    (nextValue: string) => {
      setValueState(nextValue);
      setError(validateValue(nextValue));
    },
    [validateValue],
  );

  const handleChange = useCallback(
    (
      eventOrValue:
        | ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
        | string,
    ) => {
      if (typeof eventOrValue === "string") {
        setValue(eventOrValue);
        return;
      }
      setValue(eventOrValue.target.value);
    },
    [setValue],
  );

  const reset = useCallback(() => {
    setValueState(initialValue);
    setError(null);
  }, [initialValue]);

  const submit = useCallback(
    async (valueOverride?: string) => {
      const rawValue = valueOverride ?? value;
      const nextValue = trimOnSubmit ? rawValue.trim() : rawValue;
      if (valueOverride !== undefined && rawValue !== value) {
        setValueState(rawValue);
      }
    const validationError = validateValue(nextValue);
    setError(validationError);
    if (validationError) return false;

    if (!onSubmit) return true;

    try {
      setIsSubmitting(true);
      await onSubmit(nextValue);
      return true;
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("No se pudo enviar el mensaje.");
      }
      return false;
    } finally {
      setIsSubmitting(false);
    }
    },
    [onSubmit, trimOnSubmit, validateValue, value],
  );

  const isValid = useMemo(() => error === null, [error]);

  return {
    value,
    error,
    isValid,
    isSubmitting,
    setValue,
    handleChange,
    reset,
    submit,
  };
}

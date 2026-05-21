export function FeedbackMessage({ tone = 'neutral', message }: { tone?: 'neutral' | 'success' | 'error'; message: string }) {
  return <div className={`feedback-message ${tone}`}>{message}</div>;
}

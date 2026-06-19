export default function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div
        className="px-4 py-3 rounded-[16px] rounded-bl-[5px]"
        style={{
          backgroundColor: "var(--color-fp-card)",
          border: "1px solid var(--color-fp-card-line)",
        }}
      >
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="h-1.5 w-1.5 animate-bounce rounded-full"
              style={{
                backgroundColor: "var(--color-fp-ink-3)",
                animationDelay: `${i * 0.15}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Brand mark icon - flight path kite crossed by horizontal line
// Recreates: <path d="M2 12h20M12 2l4 10-4 10-4-10z"/>

export function BrandMark({ 
  size = 26, 
  className = "" 
}: { 
  size?: number; 
  className?: string 
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M2 12h20M12 2l4 10-4 10-4-10z" />
    </svg>
  );
}

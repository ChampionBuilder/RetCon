type FrameworkSelectorProps = {
  frameworks: string[];
  onSelectFramework: (frameworkId: string | null) => void;
};

export function FrameworkSelector({
  frameworks,
  onSelectFramework,
}: FrameworkSelectorProps) {
  return (
    <div>
      <h2>Frameworks</h2>

      <button onClick={() => onSelectFramework(null)}>
        ALL
      </button>

      <div style={{ marginTop: "10px" }}>
        {frameworks.map((frameworkId) => (
          <div key={frameworkId}>
            <button
              onClick={() => onSelectFramework(frameworkId)}
            >
              {frameworkId}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

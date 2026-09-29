interface ComingSoonProps {
  title: string;
  description: string;
  icon: string;
  plannedFeatures?: string[];
}

export default function ComingSoon({
  title,
  description,
  icon,
  plannedFeatures = [],
}: ComingSoonProps) {
  return (
    <div
      style={{
        maxWidth: "600px",
        margin: "40px auto",
        textAlign: "center",
        padding: "0 16px",
      }}
    >
      {/* Ícone */}
      <div
        style={{
          fontSize: "64px",
          marginBottom: "24px",
          lineHeight: 1,
        }}
        aria-hidden="true"
      >
        {icon}
      </div>

      {/* Título */}
      <h2
        style={{
          fontSize: "24px",
          fontWeight: 700,
          color: "var(--color-text)",
          margin: "0 0 12px",
        }}
      >
        {title}
      </h2>

      {/* Descrição */}
      <p
        style={{
          fontSize: "15px",
          color: "var(--color-text-muted)",
          margin: "0 0 32px",
          lineHeight: 1.6,
        }}
      >
        {description}
      </p>

      {/* Badge de status */}
      <span
        style={{
          display: "inline-block",
          background: "#fef3c7",
          color: "#92400e",
          border: "1px solid #fcd34d",
          borderRadius: "20px",
          padding: "6px 16px",
          fontSize: "13px",
          fontWeight: 600,
          marginBottom: "32px",
        }}
      >
        🔧 Em desenvolvimento
      </span>

      {/* Lista de funcionalidades planejadas */}
      {plannedFeatures.length > 0 && (
        <div
          style={{
            background: "var(--color-surface)",
            border: "1px solid var(--color-border)",
            borderRadius: "12px",
            padding: "20px 24px",
            textAlign: "left",
          }}
        >
          <p
            style={{
              margin: "0 0 12px",
              fontSize: "13px",
              fontWeight: 600,
              color: "var(--color-text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Funcionalidades previstas
          </p>
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: "none",
            }}
          >
            {plannedFeatures.map((feature, index) => (
              <li
                key={index}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "8px",
                  padding: "6px 0",
                  fontSize: "14px",
                  color: "var(--color-text)",
                  borderTop: index > 0 ? "1px solid var(--color-border)" : "none",
                }}
              >
                <span
                  style={{ color: "var(--color-primary)", flexShrink: 0, marginTop: "1px" }}
                  aria-hidden="true"
                >
                  ✓
                </span>
                {feature}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

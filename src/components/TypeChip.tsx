"use client";

import { pokemonTypeStyles, typeIcons } from "@/utils/pokemonTypes";

interface TypeChipProps {
  type: string;
  size?: "xs" | "sm" | "md" | "lg";
  showIcon?: boolean;
  className?: string;
}

const TypeChip: React.FC<TypeChipProps> = ({
  type,
  size = "md",
  showIcon = true,
  className = "",
}) => {
  const formattedType = type.toLowerCase();
  const typeData = pokemonTypeStyles[formattedType] || pokemonTypeStyles.normal;
  const icon = typeIcons[formattedType] || "";

  const sizeClasses = {
    xs: "text-xs px-1.5 py-0.5",
    sm: "text-sm px-2 py-1",
    md: "text-base px-3 py-1.5",
    lg: "text-lg px-4 py-2",
  };

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium capitalize border ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: typeData.bg,
        color: typeData.text,
        borderColor: typeData.border || typeData.bg,
      }}
    >
      {showIcon && icon && <span className="mr-1">{icon}</span>}
      {type}
    </span>
  );
};

export default TypeChip;

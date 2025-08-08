import React from "react";

type InfoChipProps = {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  variant?:
    | "default"
    | "highlight"
    | "ability"
    | "measurement"
    | "hp"
    | "attack"
    | "defense"
    | "special-attack"
    | "special-defense"
    | "speed";
};
// Generic InfoChip component
const InfoChip: React.FC<InfoChipProps> = ({
  label,
  value = null,
  icon = null,
  variant = "default",
}) => {
  const variantStyles = {
    default: "bg-gray-100 text-gray-800",
    highlight: "bg-blue-100 text-blue-800",
    ability: "bg-purple-100 text-purple-800",
    measurement: "bg-green-100 text-green-800",
    hp: "bg-red-100 text-red-800",
    attack: "bg-orange-100 text-orange-800",
    defense: "bg-yellow-100 text-yellow-800",
    "special-attack": "bg-indigo-100 text-indigo-800",
    "special-defense": "bg-teal-100 text-teal-800",
    speed: "bg-pink-100 text-pink-800",
  };

  return (
    <div className="flex flex-col items-center">
      <span className="text-xs font-medium text-gray-500 mb-1">{label}</span>
      <div
        className={`inline-flex items-center rounded-full px-5 py-1 text-sm font-medium ${variantStyles[variant]}`}
      >
        {icon && <span className="mr-1">{icon}</span>}
        {value}
      </div>
    </div>
  );
};
export default InfoChip;

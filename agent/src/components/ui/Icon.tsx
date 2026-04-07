import * as Icons from "lucide-react";

const DEFAULT_SIZE = 20;
const DEFAULT_STROKE = 1.5;

type IconName = keyof typeof Icons;

export function Icon({
    name,
    size = DEFAULT_SIZE,
    strokeWidth = DEFAULT_STROKE,
    className = "",
}: {
    name: IconName;
    size?: number;
    strokeWidth?: number;
    className?: string;
}) {
    const LucideIcon = Icons[name];

    if (!LucideIcon) {
        console.warn(`Icon "${name}" not found`);
        return null;
    }

    return (
        <LucideIcon
            size={size}
            strokeWidth={strokeWidth}
            className={className}
        />
    );
}
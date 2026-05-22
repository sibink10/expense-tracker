import type { SVGProps } from "react";

interface TrashIconProps extends SVGProps<SVGSVGElement> {
  size?: number;
  color?: string;
}

export function TrashIcon({ size = 18, color = "currentColor", ...rest }: TrashIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 17 17"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: "block", flexShrink: 0 }}
      {...rest}
    >
      <path
        d="M9.91688 7.08337V12.0417M7.08352 7.08337L7.08352 12.0417M2.8335 4.25001H14.1669M12.7502 4.25001V12.6084C12.7502 13.4018 12.7504 13.7986 12.596 14.1016C12.4602 14.3682 12.2431 14.5848 11.9766 14.7207C11.6735 14.8751 11.2771 14.8751 10.4837 14.8751H6.51699C5.72358 14.8751 5.32658 14.8751 5.02353 14.7207C4.75697 14.5848 4.5404 14.3682 4.40458 14.1016C4.25017 13.7986 4.25017 13.4018 4.25017 12.6084V4.25001H12.7502ZM11.3336 4.25001H5.66685C5.66685 3.58993 5.66685 3.25987 5.77469 2.99953C5.91847 2.6524 6.19408 2.37662 6.5412 2.23284C6.80155 2.125 7.13177 2.125 7.79186 2.125H9.20854C9.86863 2.125 10.1987 2.125 10.459 2.23284C10.8061 2.37662 11.0819 2.6524 11.2256 2.99953C11.3335 3.25987 11.3336 3.58993 11.3336 4.25001Z"
        stroke={color}
        strokeWidth="1.05"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

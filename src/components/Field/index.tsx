import clsx from "clsx";
import React, { FC, ReactNode } from "react";

export interface FieldProps {
  title?: ReactNode;
  subTitle?: ReactNode;
  children?: ReactNode;

  className?: string;
}

export const Field: FC<FieldProps> = ({
  subTitle,
  title,
  children,
  className,
}) => {
  return (
    <div className={clsx("inputWrapper", className)}>
      <p>{title}</p>
      {children}
      <small className="text-secondary ">{subTitle}</small>
    </div>
  );
};

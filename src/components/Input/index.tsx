import React, {
  DetailedHTMLProps,
  FC,
  InputHTMLAttributes,
  ReactNode,
} from "react";
import clsx from "clsx";
import { Field } from "components/Field";

interface Props
  extends Omit<
    DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>,
    "title"
  > {
  title?: ReactNode;
  subTitle?: ReactNode;
}

export const Input: FC<Props> = ({ subTitle, title, className, ...props }) => {
  return (
    <Field subTitle={subTitle} title={title}>
      <input
        {...props}
        className={clsx("form-control me-sm-2", className)}
        type="text"
      />
    </Field>
  );
};

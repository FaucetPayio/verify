import React, { FC, Fragment } from "react";
import clsx from "clsx";

import { Field } from "components";
import { Card } from "../Card";

interface Props {
  cards: number[];
  title: string;
  subTitle: string;

  className?: string;
}

export const CardRow: FC<Props> = ({ cards, title, subTitle, className }) => {
  return (
    <div>
      <Field title={title} subTitle={subTitle}>
        <div className={clsx("cards", className)}>
          {cards.map((id, i) => (
            <Fragment key={`${id}_${i}`}>
              <Card id={id} />
            </Fragment>
          ))}
        </div>
      </Field>
    </div>
  );
};

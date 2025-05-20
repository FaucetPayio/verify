import React, { FC } from "react";
import { cardsList } from "assets";

interface Props {
  id: number;
}

export const Card: FC<Props> = ({ id }) => {
  return <img src={cardsList[id]} alt={`card#${id}`} />;
};

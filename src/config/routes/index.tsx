import { lazyLoad } from "config/utils";
import { PagesRoute } from "./type";

const Home = lazyLoad(() => import("pages/Home"));
const Crash = lazyLoad(() => import("pages/Crash"));
const Dice = lazyLoad(() => import("pages/Dice"));
const Plinko = lazyLoad(() => import("pages/Plinko"));
const Limbo = lazyLoad(() => import("pages/Limbo"));
const Roulette = lazyLoad(() => import("pages/Roulette"));
const Diamonds = lazyLoad(() => import("pages/Diamonds"));
const Towers = lazyLoad(() => import("pages/Towers"));
const Mines = lazyLoad(() => import("pages/Mines"));
const Blackjack = lazyLoad(() => import("pages/BlackJack"));
const Lottery = lazyLoad(() => import("pages/Lottery"));

const _404 = lazyLoad(() => import("pages/404"));

export const routes: PagesRoute = {
  "/": {
    data: {
      component: Home,
    },

    crash: {
      data: {
        component: Crash,
      },
    },

    dice: {
      data: {
        component: Dice,
      },
    },

    plinko: {
      data: {
        component: Plinko,
      },
    },

    limbo: {
      data: {
        component: Limbo,
      },
    },

    roulette: {
      data: {
        component: Roulette,
      },
    },

    diamonds: {
      data: {
        component: Diamonds,
      },
    },

    towers: {
      data: {
        component: Towers,
      },
    },

    mines: {
      data: {
        component: Mines,
      },
    },

    blackjack: {
      data: {
        component: Blackjack,
      },
    },

    lottery: {
      data: {
        component: Lottery,
      },
    },
  },

  "*": {
    data: {
      component: _404,
    },
  },
};

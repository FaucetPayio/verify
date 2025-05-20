import { Link } from "react-router-dom";

import { externalLinks, pagesLinks } from "./config";

const Home = () => {
  return (
    <div className={"mainWrapper"}>
      <h1 className="lead">Please choose a game from the list below:</h1>

      <ul>
        {pagesLinks.map(({ link, name }) => (
          <li className="gameName">
            <Link to={link}>{name}</Link>
          </li>
        ))}

        {externalLinks.map(({ link, name }) => (
          <li className="gameName">
            <a href={link} target="_blank">
              {name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Home;

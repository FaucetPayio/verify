import { globalConfig } from "config";
import { Link } from "react-router-dom";

export const Header = () => {
  return (
    <div className="navbar navbar-expand-lg navbar-dark bg-primary">
      <Link className="container-fluid navbar-brand headerLink" to={"/"}>
        All Games
      </Link>
      <div className="collapse navbar-collapse">
        <ul className="navbar-nav ms-md-auto">
          <li className="nav-item">
            <a href={globalConfig.mainSite.link} className="nav-link">
              Back to {globalConfig.mainSite.title}
            </a>
          </li>
        </ul>
      </div>
    </div>
  );
};

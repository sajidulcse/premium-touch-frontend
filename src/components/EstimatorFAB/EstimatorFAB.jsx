import React from "react";
import { Link, useLocation } from "react-router-dom";
import "./EstimatorFAB.css";

const EstimatorFAB = () => {
  const location = useLocation();

  // Hide on the estimator page itself and admin pages
  if (
    location.pathname === "/estimator" ||
    location.pathname.startsWith("/admin")
  ) {
    return null;
  }

  return (
    <Link to="/estimator" className="estimator-fab" id="estimator-fab-tab" aria-label="Open Interior Cost Estimator">
      <span className="estimator-fab__icon">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H8v-2h4v2zm4-4H8v-2h8v2zm0-4H8V7h8v2z"/>
        </svg>
      </span>
      <span className="estimator-fab__text">Estimate Cost</span>
    </Link>
  );
};

export default EstimatorFAB;

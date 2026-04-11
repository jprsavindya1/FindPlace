import React from "react";
import "./SkeletonCard.css";

const SkeletonCard = () => {
  return (
    <div className="skeleton-card">
      <div className="skeleton-image pulse"></div>
      <div className="skeleton-content">
        <div className="skeleton-title pulse"></div>
        <div className="skeleton-rating pulse"></div>
        <div className="skeleton-list">
          <div className="skeleton-item pulse"></div>
          <div className="skeleton-item pulse"></div>
          <div className="skeleton-item pulse"></div>
        </div>
        <div className="skeleton-footer pulse"></div>
      </div>
    </div>
  );
};

export default SkeletonCard;

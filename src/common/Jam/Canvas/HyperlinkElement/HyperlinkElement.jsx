import React from 'react';
import styles from './HyperlinkElement.module.css';
import HyperlinkCard from '../../HyperlinkCard/HyperlinkCard';

const HyperlinkElement = ({ element, isSelected, style }) => {
  return (
    <div
      className={`${styles.hyperlinkElement} ${isSelected ? styles.selected : ''}`}
      style={style}
    >
      <HyperlinkCard
        data={element.cardData}
        isCanvasElement={true}
        onElementClick={(cardData) => {
          if (cardData.url) {
            window.open(cardData.url, '_blank', 'noopener,noreferrer');
          }
        }}
      />
    </div>
  );
};

export default HyperlinkElement; 
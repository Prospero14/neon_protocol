import React from 'react';
import type { MapNodeData } from '../logic/mapData';

/**
 * Характеристики (Props) нашего узла на карте.
 */
interface MapNodeProps {
  node: MapNodeData;       // Все данные района (название, координаты, описание)
  onSelect: (node: MapNodeData) => void; // Функция, которая срабатывает при клике
}

/**
 * MapNode - Компонент отдельной точки на радаре Москвы.
 */
const MapNode: React.FC<MapNodeProps> = ({ node, onSelect }) => {
  return (
    <div 
      className="map-node-wrapper"
      style={{ left: `${node.x}%`, top: `${node.y}%` }}
    >
      {/* Голографический столб света над точкой */}
      <div className="hologram-pillar"></div>

      <button 
        className={`map-node-dot ${node.type}`} 
        onClick={() => onSelect(node)}
        title={node.name}
      >
      </button>

      {/* Название района (крупнее и с подложкой) */}
      <span className="node-label mono-text">{node.name}</span>
    </div>
  );
};

export default MapNode;
